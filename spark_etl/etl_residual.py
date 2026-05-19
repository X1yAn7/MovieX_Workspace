"""
etl_residual.py — 票房残差分析（岭回归）
========================================
用 Spark MLlib 做岭回归，替代 Java 手写版本。

特征（与 Java 版对齐）：
  TMDB均分 / log(预算) / log(评分人数) / 片长(百分钟)
  / 上映月份(归一) / log(热度) / 是否系列电影
  / 类型标签数 / 出品公司数 / 主演阵容人数

数据源：movie_dashboard_meta + movie_genres_map
                    + movie_dashboard_company_map + movie_cast
"""

from pyspark.sql import SparkSession, DataFrame
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StructType, StructField, StringType, DoubleType, IntegerType
)
from pyspark.ml.regression import LinearRegression
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.evaluation import RegressionEvaluator

import config as C

FEATURE_LABELS_CN = [
    "截距",
    "TMDB均分",
    "log(预算)",
    "log(评分人数)",
    "片长(百分钟)",
    "上映月份(归一)",
    "log(热度指标)",
    "是否系列电影",
    "类型标签数",
    "出品公司数",
    "主演阵容人数",
]


def write_df(df: DataFrame, table_name: str):
    df.coalesce(C.REPARTITION_NUM).write \
        .mode(C.WRITE_MODE) \
        .format("jdbc") \
        .option("url", C.MYSQL_JDBC_URL) \
        .option("dbtable", table_name) \
        .option("user", C.MYSQL_USER) \
        .option("password", C.MYSQL_PASSWORD) \
        .option("driver", C.MYSQL_DRIVER) \
        .option("rewriteBatchedStatements", "true") \
        .save()


def build_features(spark: SparkSession):
    """
    构建特征矩阵（与 Java ResidualAnalysisService.buildDataset 对齐）

    筛选条件（Java 原版）：
      - revenue > 0, budget >= 10000, vote_average > 0
      - vote_count >= 8, runtime > 10

    movie_dashboard_meta 提供所有基础字段 + belongs_to_collection_id
    """
    meta = spark.table(C.HIVE_TABLE_MOVIE_DASHBOARD_META) \
        .filter("""
            revenue > 0
            AND budget >= 10000
            AND vote_average > 0
            AND vote_count >= 8
            AND runtime > 10
            AND release_date IS NOT NULL
            AND release_date != ''
        """) \
        .selectExpr(
            "CAST(id AS STRING) AS movie_id",
            "title",
            "YEAR(TO_DATE(release_date, 'yyyy-MM-dd')) AS year",
            "vote_average",
            "budget",
            "revenue",
            "vote_count",
            "runtime",
            "popularity",
            "release_date",
            "IF(belongs_to_collection_id IS NOT NULL AND belongs_to_collection_id > 0, 1, 0) AS is_collection"
        )

    # 类型数/电影
    genre_cnt = spark.table(C.HIVE_TABLE_GENRES_MAP) \
        .groupBy("movie_id") \
        .agg(F.count("*").alias("genre_count"))

    # 出品公司数/电影
    company_cnt = spark.table(C.HIVE_TABLE_COMPANY_MAP) \
        .groupBy("movie_id") \
        .agg(F.count("*").alias("company_count"))

    # 主演数（前 7 位）
    cast_cnt = spark.table(C.HIVE_TABLE_CAST) \
        .withColumn("rn", F.row_number().over(
            F.Window.partitionBy("movie_id").orderBy("cast_id")
        )) \
        .filter("rn <= 7") \
        .groupBy("movie_id") \
        .agg(F.count("*").alias("cast_count"))

    # 关联所有特征
    features = meta.alias("m") \
        .join(genre_cnt.alias("gc"),
              F.col("m.movie_id") == F.col("gc.movie_id"), "left") \
        .join(company_cnt.alias("cc"),
              F.col("m.movie_id") == F.col("cc.movie_id"), "left") \
        .join(cast_cnt.alias("ct"),
              F.col("m.movie_id") == F.col("ct.movie_id"), "left") \
        .selectExpr(
            "m.movie_id", "m.title", "m.year",
            "m.vote_average", "m.budget", "m.revenue",
            "m.vote_count", "m.runtime", "m.popularity",
            "m.is_collection",
            "COALESCE(gc.genre_count, 0) AS genre_count",
            "COALESCE(cc.company_count, 0) AS company_count",
            "COALESCE(ct.cast_count, 0) AS cast_count"
        )

    # 特征工程（与 Java 版完全对齐）
    features = features \
        .withColumn("log_revenue", F.log("revenue")) \
        .withColumn("log_budget", F.log("budget")) \
        .withColumn("log_vote_count", F.log(F.col("vote_count") + 1)) \
        .withColumn("runtime_per_100", F.col("runtime") / 100) \
        .withColumn("month", F.month(F.to_date("release_date", "yyyy-MM-dd"))) \
        .withColumn("month_norm", (F.col("month") - 1) / 11.0) \
        .withColumn("log_popularity", F.log(F.col("popularity") + 1)) \
        .withColumn("gn", F.least(F.col("genre_count"), 5) / 5.0) \
        .withColumn("cn", F.least(F.col("company_count"), 8) / 4.0) \
        .withColumn("ctn", F.least(F.col("cast_count"), 12) / 8.0) \
        .filter("""
            log_revenue IS NOT NULL AND log_budget IS NOT NULL
            AND vote_average IS NOT NULL
        """) \
        .select(
            "movie_id", "title", "year", "vote_average", "budget", "revenue",
            "log_revenue",
            F.col("vote_average").alias("feat_vote"),
            "log_budget", "log_vote_count",
            "runtime_per_100", "month_norm", "log_popularity",
            "is_collection",
            F.col("gn").alias("genre_count_norm"),
            F.col("cn").alias("company_count_norm"),
            F.col("ctn").alias("cast_count_norm")
        )

    return features


def train_and_predict(features: DataFrame, lambda_reg: float = 2.0):
    """训练岭回归并预测，返回模型和带残差的结果"""
    feat_cols = [
        "feat_vote", "log_budget", "log_vote_count",
        "runtime_per_100", "month_norm", "log_popularity",
        "is_collection", "genre_count_norm", "company_count_norm",
        "cast_count_norm"
    ]

    assembler = VectorAssembler(inputCols=feat_cols, outputCol="features")
    data = assembler.transform(features)

    lr = LinearRegression(
        featuresCol="features",
        labelCol="log_revenue",
        regParam=lambda_reg,
        elasticNetParam=0,   # 纯 L2 = 岭回归
        fitIntercept=True,
        maxIter=100,
        tol=1e-6,
        standardization=True
    )

    model = lr.fit(data)
    predictions = model.transform(data) \
        .withColumn("residual", F.col("log_revenue") - F.col("prediction"))

    # R²
    evaluator = RegressionEvaluator(
        labelCol="log_revenue",
        predictionCol="prediction",
        metricName="r2"
    )
    r2 = evaluator.evaluate(predictions)

    # 残差统计
    stats = predictions.agg(
        F.avg("residual").alias("residual_mean"),
        F.stddev("residual").alias("residual_std"),
        F.count("*").alias("n")
    ).collect()[0]

    return model, predictions, r2, stats


def run(spark: SparkSession):
    print("=" * 60)
    print("[Residual ETL] 开始票房残差分析...")
    print("=" * 60)

    # 1. 构建特征
    print("[1/4] 构建特征矩阵...")
    features = build_features(spark)
    n = features.count()
    print(f"  ✓ 有效样本: {n}")
    if n < 30:
        print("  ✗ 样本 < 30，无法建模！")
        return
    features.select("movie_id", "title", "vote_average",
                    "log_revenue", "log_budget").show(5, truncate=False)

    # 2. 训练模型
    print("[2/4] 训练岭回归 (λ=2.0)...")
    model, predictions, r2, stats = train_and_predict(features, lambda_reg=2.0)

    n_val = stats["n"]
    rm = stats["residual_mean"]
    rs = stats["residual_std"]
    print(f"  ✓ R² = {r2:.4f}")
    print(f"  ✓ 残差 μ = {rm:.5f}, σ = {rs:.5f}")
    print(f"  ✓ 截距 = {model.intercept:.6f}")
    for label, coef in zip(FEATURE_LABELS_CN[1:], model.coefficients.toArray().tolist()):
        print(f"    {label}: {coef:.6f}")

    # 3. 残差排行
    print("[3/4] 残差排行...")
    rankings = predictions.selectExpr(
        "movie_id", "title", "year", "vote_average",
        "revenue", "budget",
        "ROUND(log_revenue, 4) AS log_revenue",
        "ROUND(prediction, 4) AS predicted_log_revenue",
        "ROUND(residual, 4) AS residual"
    )

    over = rankings.orderBy(F.desc("residual")).limit(50)
    under = rankings.orderBy(F.asc("residual")).limit(50)
    over = over.withColumn("tone", F.lit("over"))
    under = under.withColumn("tone", F.lit("under"))
    all_rankings = over.unionByName(under)

    write_df(all_rankings, C.MYSQL_TABLE_RESIDUAL_RANKINGS)
    over_cnt = over.count()
    under_cnt = under.count()
    print(f"  ✓ over={over_cnt}, under={under_cnt}")

    # 4. 模型元信息
    print("[4/4] 模型元信息...")

    # 系数表
    coef_rows = [("截距", float(model.intercept))]
    for label, coef in zip(FEATURE_LABELS_CN[1:], model.coefficients.toArray().tolist()):
        coef_rows.append((label, float(round(coef, 6))))

    coef_schema = StructType([
        StructField("feature_name", StringType()),
        StructField("coefficient", DoubleType())
    ])
    coef_df = spark.createDataFrame(coef_rows, schema=coef_schema)
    write_df(coef_df, "ads_residual_coefficients")
    print("  ✓ 系数 → ads_residual_coefficients")

    # 直方图（5%~95% 分位内等宽分桶）
    bins = 18
    p_stats = predictions.agg(
        F.expr("percentile_approx(residual, 0.05)").alias("p5"),
        F.expr("percentile_approx(residual, 0.95)").alias("p95")
    ).collect()[0]
    lo = p_stats["p5"] or -2.0
    hi = p_stats["p95"] or 2.0
    if abs(hi - lo) < 1e-10:
        hi = lo + 1.0
    step = (hi - lo) / bins

    hist_rows = []
    for i in range(bins):
        f = lo + i * step
        t = lo + (i + 1) * step
        hist_rows.append((round(f, 4), round(t, 4), 0))

    # 用 Spark 分桶统计
    hist_df = predictions.withColumn(
        "bin_idx",
        F.when(F.col("residual") < lo, 0)
         .when(F.col("residual") >= hi, F.lit(bins - 1))
         .otherwise(F.floor((F.col("residual") - lo) / step).cast("int"))
    ).groupBy("bin_idx").agg(
        F.count("*").alias("count")
    ).orderBy("bin_idx").collect()

    hist_map = {r["bin_idx"]: r["count"] for r in hist_df}
    hist_final = []
    for i in range(bins):
        from_val = round(lo + i * step, 4)
        to_val = round(lo + (i + 1) * step, 4)
        cnt = int(hist_map.get(i, 0))
        hist_final.append((from_val, to_val, cnt))

    hist_schema = StructType([
        StructField("bin_from", DoubleType()),
        StructField("bin_to", DoubleType()),
        StructField("count", IntegerType())
    ])
    hist_spark = spark.createDataFrame(hist_final, schema=hist_schema)
    write_df(hist_spark, "ads_residual_histogram")
    print("  ✓ 直方图 → ads_residual_histogram")

    # 模型摘要
    summary_rows = [
        ("n", str(int(n_val))),
        ("r2", f"{r2:.4f}"),
        ("residual_mean", f"{float(rm):.5f}"),
        ("residual_std", f"{float(rs):.5f}"),
        ("lambda", "2.0"),
        ("definition", "因变量: log(票房)。在控制预算、口碑、热度、档期、类型与公司等线性项后，残差 = 实际 log 票房 − 预测值。残差高表示相对模型「更卖座」。"),
    ]
    summ_schema = StructType([
        StructField("metric", StringType()),
        StructField("value", StringType())
    ])
    summ_df = spark.createDataFrame(summary_rows, schema=summ_schema)
    write_df(summ_df, "ads_residual_model_summary")
    print("  ✓ 模型摘要 → ads_residual_model_summary")

    print("=" * 60)
    print("[Residual ETL] 全部完成！")
    print("=" * 60)


if __name__ == "__main__":
    spark = C.build_spark("MovieX-ETL-Residual")
    try:
        run(spark)
    finally:
        spark.stop()
