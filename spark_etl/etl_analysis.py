"""
etl_analysis.py — 深度分析数据
================================
产出：
  1. ads_box_office_quadrant  — 商业 × 口碑四象限数据
  2. ads_ratings_vs_tmdb      — 平台评分 vs TMDB 偏差榜
"""

from pyspark.sql import SparkSession, DataFrame
from pyspark.sql import functions as F
from pyspark.sql.window import Window

import config as C


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


def build_quadrant_data(spark: SparkSession):
    """
    商业-口碑四象限散点数据

    表: movie_dashboard_meta + movie_genres_map
    条件: 预算 ≥ 1万, 票房 > 0, 评分有效, 票数 ≥ 5

    产出: 每部电影的点 + 两个中位数（画分割线用）
    """
    # 基础电影数据
    movies = spark.table(C.HIVE_TABLE_MOVIE_DASHBOARD_META) \
        .filter("""
            budget >= 10000
            AND revenue > 0
            AND vote_average IS NOT NULL
            AND vote_average > 0
            AND vote_count IS NOT NULL
            AND vote_count >= 5
            AND release_date IS NOT NULL
            AND release_date != ''
        """) \
        .withColumn("year", F.year(F.to_date("release_date", "yyyy-MM-dd"))) \
        .filter("year IS NOT NULL") \
        .selectExpr(
            "CAST(id AS STRING) AS movie_id",
            "title",
            "year",
            "vote_average",
            "vote_count",
            "budget",
            "revenue",
            "revenue / CAST(NULLIF(budget, 0) AS DOUBLE) AS roi",
            "LOG10(revenue / CAST(NULLIF(budget, 1) AS DOUBLE)) AS roi_log"
        ) \
        .filter("roi > 0 AND roi_log IS NOT NULL")

    # 关联类型
    genres = spark.table(C.HIVE_TABLE_GENRES_MAP) \
        .groupBy("movie_id") \
        .agg(F.collect_list("genre_name").alias("genre_list"))

    quadrant = movies.alias("q") \
        .join(genres.alias("g"), F.col("q.movie_id") == F.col("g.movie_id"), "left") \
        .withColumn("genres_str", F.concat_ws(", ", F.col("genre_list")))

    # 计算中位数
    stats = quadrant.agg(
        F.expr("percentile_approx(roi_log, 0.5)").alias("median_roi_log"),
        F.expr("percentile_approx(vote_average, 0.5)").alias("median_vote_average")
    ).collect()[0]

    median_roi = float(stats["median_roi_log"] or 0.0)
    median_vote = float(stats["median_vote_average"] or 7.0)

    # 标注象限
    quadrant = quadrant.withColumn(
        "quadrant",
        F.when(
            (F.col("roi_log") >= median_roi) & (F.col("vote_average") >= median_vote),
            "UR"
        ).when(
            (F.col("roi_log") < median_roi) & (F.col("vote_average") >= median_vote),
            "UL"
        ).when(
            (F.col("roi_log") >= median_roi) & (F.col("vote_average") < median_vote),
            "LR"
        ).otherwise("LL")
    )

    quadrant = quadrant.selectExpr(
        "movie_id", "title", "year", "vote_average", "vote_count",
        "budget", "revenue",
        "ROUND(roi, 4) AS roi",
        "ROUND(roi_log, 4) AS roi_log",
        "genres_str",
        "quadrant"
    )

    return quadrant, float(median_roi), float(median_vote)


def build_ratings_vs_tmdb(spark: SparkSession, min_count: int = 5, top_n: int = 12):
    """
    平台评分（MovieLens）vs TMDB 评分偏差

    表: movie_dashboard_rating_ml + movie_dashboard_meta
    逻辑: 用户均分(5分制) ×2 → 10分制 vs TMDB vote_average
    """
    # MovieLens 评分聚合
    raw = spark.table(C.HIVE_TABLE_RATING_ML) \
        .groupBy("movie_id") \
        .agg(
            F.sum("rating").alias("rating_sum"),
            F.count("*").alias("cnt")
        ) \
        .filter(F.col("cnt") >= min_count)

    # TMDB 电影元数据
    movies = spark.table(C.HIVE_TABLE_MOVIE_DASHBOARD_META) \
        .selectExpr(
            "id AS movie_id",
            "title",
            "release_date",
            "vote_average AS tmdb_avg"
        )

    result = raw.alias("r") \
        .join(movies.alias("m"), F.col("r.movie_id") == F.col("m.movie_id")) \
        .filter("m.tmdb_avg IS NOT NULL AND m.tmdb_avg > 0") \
        .selectExpr(
            "r.movie_id",
            "m.title",
            "YEAR(TO_DATE(m.release_date, 'yyyy-MM-dd')) AS release_year",
            "ROUND(r.rating_sum / r.cnt, 3) AS user_avg",
            "ROUND(r.rating_sum / r.cnt * 2, 2) AS user_avg_on_ten",
            "ROUND(m.tmdb_avg, 2) AS tmdb_avg",
            "ROUND(r.rating_sum / r.cnt * 2 - m.tmdb_avg, 2) AS delta",
            "r.cnt AS rating_count"
        ) \
        .filter("delta IS NOT NULL")

    # 取 Δ > 0（用户更宽容）和 Δ < 0（用户更严苛）的 TopN
    w_desc = Window.orderBy(F.desc("delta"), F.desc("rating_count"))
    w_asc = Window.orderBy(F.asc("delta"), F.desc("rating_count"))

    higher = result.filter("delta > 0") \
        .withColumn("rn", F.row_number().over(w_desc)) \
        .filter(f"rn <= {top_n}") \
        .drop("rn") \
        .withColumn("tone", F.lit("higher"))

    lower = result.filter("delta < 0") \
        .withColumn("rn", F.row_number().over(w_asc)) \
        .filter(f"rn <= {top_n}") \
        .drop("rn") \
        .withColumn("tone", F.lit("lower"))

    combined = higher.unionByName(lower)

    return combined


def run(spark: SparkSession):
    print("=" * 60)
    print("[Analysis ETL] 开始计算深度分析数据...")
    print("=" * 60)

    # 1. 四象限数据
    print("[1/2] 商业-口碑四象限 →", C.MYSQL_TABLE_QUADRANT)
    quadrant, median_roi, median_vote = build_quadrant_data(spark)
    write_df(quadrant, C.MYSQL_TABLE_QUADRANT)
    count = quadrant.count()
    print(f"  ✓ {count} 条数据，中位数 roi_log={median_roi:.4f}, vote={median_vote:.2f}")

    quadrant.select("movie_id", "title", "year", "vote_average",
                    "roi", "quadrant").show(8, truncate=False)

    # 2. 评分偏差
    print("[2/2] 评分偏差对比 →", C.MYSQL_TABLE_RATINGS_VS_TMDB)
    ranked = build_ratings_vs_tmdb(spark, min_count=5, top_n=12)
    write_df(ranked, C.MYSQL_TABLE_RATINGS_VS_TMDB)
    h_count = ranked.filter("tone = 'higher'").count()
    l_count = ranked.filter("tone = 'lower'").count()
    print(f"  ✓ higher={h_count}, lower={l_count} 条")

    ranked.select("title", "user_avg_on_ten", "tmdb_avg", "delta", "tone") \
        .show(6, truncate=False)

    print("=" * 60)
    print("[Analysis ETL] 全部完成！")
    print("=" * 60)


if __name__ == "__main__":
    spark = C.build_spark("MovieX-ETL-Analysis")
    try:
        run(spark)
    finally:
        spark.stop()
