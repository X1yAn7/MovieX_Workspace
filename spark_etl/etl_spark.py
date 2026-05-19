"""
etl_spark.py — MovieX PySpark ETL（在 VM 上运行）
===================================================
读取 Hive → 全量同步到 Windows MySQL → 预计算 ads_* 聚合表。

运行方式（在 VM 上）：
  spark-submit \
    --master spark://master:7077 \
    --executor-memory 4g \
    --jars mysql-connector-j-8.0.33.jar \
    /root/spark_etl/etl_spark.py

参数：
  --tables 全部同步到 MySQL（含 movie_info 等原始表）
  --agg    只跑聚合（ads_* 表）
  --all    全部（默认）
"""

import sys
import time
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql import functions as F, types as T
from pyspark.sql.window import Window

# ============================================================
# 配置
# ============================================================
MYSQL_URL = "jdbc:mysql://10.230.212.113:3306/cinema_db?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&rewriteBatchedStatements=true&useSSL=false&allowPublicKeyRetrieval=true"
MYSQL_USER = "root"
MYSQL_PASSWORD = "123456"
MYSQL_DRIVER = "com.mysql.cj.jdbc.Driver"

HIVE_DATABASE = "cinema_db"

# ============================================================
# Spark 初始化
# ============================================================
spark = (
    SparkSession.builder
    .appName("MovieX-ETL-Full")
    .master("spark://master:7077")
    .config("spark.sql.adaptive.enabled", "true")
    .config("spark.sql.shuffle.partitions", "100")
    .config("spark.executor.memory", "4g")
    .config("spark.executor.cores", "2")
    .enableHiveSupport()
    .getOrCreate()
)

spark.sparkContext.setLogLevel("WARN")
print(f"SparkSession 就绪, AppID: {spark.sparkContext.applicationId}")


def write_mysql(df: DataFrame, table: str):
    """写入 MySQL"""
    n = df.count()
    df.write \
        .mode("overwrite") \
        .format("jdbc") \
        .option("url", MYSQL_URL) \
        .option("dbtable", table) \
        .option("user", MYSQL_USER) \
        .option("password", MYSQL_PASSWORD) \
        .option("driver", MYSQL_DRIVER) \
        .option("rewriteBatchedStatements", "true") \
        .option("batchsize", "500") \
        .save()
    print(f"  ✓ {table}: {n} 行")


def hive(name: str) -> DataFrame:
    return spark.table(f"{HIVE_DATABASE}.{name}")


def transfer_tables():
    """全量同步所有原始表到 MySQL"""
    tables = [
        "movie_info",
        "movie_genres_map",
        "movie_director",
        "movie_cast",
        "movie_dashboard_meta",
        "movie_dashboard_company_map",
        "movie_dashboard_rating_ml",
        "movie_dashboard_genres_map",
        "movie_dashboard_keyword_fact",
        "movie_dashboard_kg_node",
        "movie_dashboard_kg_edge",
        "ads_genre_distribution",
        "ads_rating_distribution",
        "ads_movie_roi_top",
    ]
    for t in tables:
        print(f"  正在同步: {t} ...")
        try:
            df = hive(t)
            cnt = df.count()
            write_mysql(df, t)
            print(f"    {t}: {cnt} 行 ✓")
        except Exception as e:
            print(f"    ✗ {t}: {e}")


def compute_global_metrics():
    """全局统计指标"""
    print("  计算 ads_global_metrics ...")
    df = hive("movie_dashboard_meta") \
        .filter("revenue > 0 AND budget > 0") \
        .agg(
            F.count("id").alias("total_movies"),
            F.coalesce(F.sum("revenue"), F.lit(0)).alias("total_revenue"),
            F.coalesce(F.sum("budget"), F.lit(0)).alias("total_budget"),
            F.round(F.coalesce(F.avg("vote_average"), F.lit(0)), 2).alias("average_rating")
        )
    write_mysql(df, "ads_global_metrics")
    df.show(truncate=False)


def compute_production_trend():
    """产量趋势"""
    print("  计算 ads_production_trend ...")
    df = hive("movie_info") \
        .filter("release_date IS NOT NULL AND release_date != ''") \
        .withColumn("year", F.year(F.to_date("release_date", "yyyy-MM-dd"))) \
        .filter("year IS NOT NULL") \
        .groupBy("year").agg(F.count("id").alias("count")) \
        .orderBy("year")

    w = Window.orderBy("year")
    df = df.withColumn("growth", F.when(
        F.lag("count", 1).over(w).isNotNull() &
        (F.lag("count", 1).over(w) > 0),
        F.round((F.col("count") - F.lag("count", 1).over(w))
                / F.lag("count", 1).over(w) * 100, 1)
    ).otherwise(F.lit(0.0)))

    write_mysql(df, "ads_production_trend")
    df.show(10, truncate=False)


def compute_box_office_quadrant():
    """商业四象限散点数据"""
    print("  计算 ads_box_office_quadrant ...")
    movies = hive("movie_dashboard_meta") \
        .filter("budget >= 10000 AND revenue > 0 AND vote_average > 0 AND vote_count >= 5") \
        .filter("release_date IS NOT NULL AND release_date != ''") \
        .withColumn("year", F.year(F.to_date("release_date", "yyyy-MM-dd"))) \
        .filter("year IS NOT NULL") \
        .selectExpr(
            "CAST(id AS STRING) AS movie_id", "title", "year",
            "vote_average", "vote_count", "budget", "revenue",
            "ROUND(revenue / CAST(NULLIF(budget, 0) AS DOUBLE), 4) AS roi",
            "ROUND(LOG10(revenue / CAST(NULLIF(budget, 1) AS DOUBLE)), 4) AS roi_log"
        ).filter("roi > 0 AND roi_log IS NOT NULL")

    genres = hive("movie_genres_map") \
        .groupBy("movie_id") \
        .agg(F.concat_ws(", ", F.collect_list("genre_name")).alias("genres_str"))

    df = movies.alias("m") \
        .join(genres.alias("g"), F.col("m.movie_id") == F.col("g.movie_id"), "left") \
        .select("m.*", F.coalesce("g.genres_str", F.lit("")).alias("genres_str"))

    # 中位数
    stats = df.agg(
        F.expr("percentile_approx(roi_log, 0.5)").alias("median_roi"),
        F.expr("percentile_approx(vote_average, 0.5)").alias("median_vote")
    ).collect()[0]
    mr = float(stats["median_roi"] or 0)
    mv = float(stats["median_vote"] or 7)

    df = df.withColumn("quadrant",
        F.when((F.col("roi_log") >= mr) & (F.col("vote_average") >= mv), "UR")
         .when((F.col("roi_log") < mr) & (F.col("vote_average") >= mv), "UL")
         .when((F.col("roi_log") >= mr) & (F.col("vote_average") < mv), "LR")
         .otherwise("LL")
    )

    write_mysql(df, "ads_box_office_quadrant")
    print(f"  ✓ 中位数 roi_log={mr:.4f}, vote={mv:.2f}")


def compute_ratings_vs_tmdb(min_count=5, top_n=12):
    """评分偏差对比"""
    print("  计算 ads_ratings_vs_tmdb ...")
    raw = hive("movie_dashboard_rating_ml") \
        .groupBy("movie_id") \
        .agg(F.sum("rating").alias("rating_sum"), F.count("*").alias("cnt")) \
        .filter(f"cnt >= {min_count}")

    movies = hive("movie_dashboard_meta") \
        .selectExpr("id AS movie_id", "title",
                     "YEAR(TO_DATE(release_date, 'yyyy-MM-dd')) AS release_year",
                     "vote_average AS tmdb_avg")

    result = raw.alias("r").join(movies.alias("m"), "movie_id") \
        .filter("tmdb_avg IS NOT NULL AND tmdb_avg > 0") \
        .selectExpr(
            "r.movie_id", "m.title", "release_year",
            "ROUND(r.rating_sum / r.cnt, 3) AS user_avg",
            "ROUND(r.rating_sum / r.cnt * 2, 2) AS user_avg_on_ten",
            "ROUND(tmdb_avg, 2) AS tmdb_avg",
            "ROUND(r.rating_sum / r.cnt * 2 - tmdb_avg, 2) AS delta",
            "r.cnt AS rating_count"
        ).filter("delta IS NOT NULL")

    wd = Window.orderBy(F.desc("delta"), F.desc("rating_count"))
    wa = Window.orderBy(F.asc("delta"), F.desc("rating_count"))

    higher = result.filter("delta > 0").withColumn("rn", F.row_number().over(wd)).filter(f"rn <= {top_n}").drop("rn").withColumn("tone", F.lit("higher"))
    lower = result.filter("delta < 0").withColumn("rn", F.row_number().over(wa)).filter(f"rn <= {top_n}").drop("rn").withColumn("tone", F.lit("lower"))

    combined = higher.unionByName(lower)
    write_mysql(combined, "ads_ratings_vs_tmdb")

    # 也写评分聚合表
    raw.write.mode("overwrite") \
        .format("jdbc") \
        .option("url", MYSQL_URL) \
        .option("dbtable", "ads_rating_ml_agg") \
        .option("user", MYSQL_USER) \
        .option("password", MYSQL_PASSWORD) \
        .option("driver", MYSQL_DRIVER) \
        .option("rewriteBatchedStatements", "true") \
        .save()
    print("  ✓ ads_rating_ml_agg")


def run():
    start = time.time()
    print("=" * 60)
    print("MovieX PySpark ETL — 全量数据处理")
    print("=" * 60)

    # 1. 同步所有原始表
    print("\n[1/2] 同步原始表到 MySQL ...")
    transfer_tables()

    # 2. 计算聚合表
    print("\n[2/2] 计算聚合表 ...")
    compute_global_metrics()
    compute_production_trend()
    compute_box_office_quadrant()
    compute_ratings_vs_tmdb()

    elapsed = time.time() - start
    print("\n" + "=" * 60)
    print(f"全部完成！耗时: {elapsed:.0f} 秒 ({elapsed/60:.1f} 分钟)")
    print("=" * 60)


if __name__ == "__main__":
    run()
