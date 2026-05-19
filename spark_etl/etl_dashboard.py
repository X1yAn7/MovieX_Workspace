"""
etl_dashboard.py — 仪表盘聚合指标
=================================
方案B：优先复用 Hive 已有的 ads_* 预计算表。
产出写回 MySQL，供 Spring Boot 后端读取。
"""

from pyspark.sql import SparkSession, DataFrame
from pyspark.sql import functions as F
from pyspark.sql.window import Window

import config as C


def create_mysql_writer(table_name: str):
    """返回一个已配置好的 MySQL 写出器"""
    return (
        DataFrame
        .write
        .__get__(None if True else None)  # 占位，下面直接用
    )


def write_df(df: DataFrame, table_name: str):
    """将 DataFrame 写入 MySQL 表"""
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


def build_global_metrics(spark: SparkSession):
    """
    全局统计指标
    从 movie_dashboard_meta 读取（比 movie_info 多了 vote_count）
    """
    df = spark.table(C.HIVE_TABLE_MOVIE_DASHBOARD_META) \
        .filter("revenue > 0 AND budget > 0")

    metrics = df.agg(
        F.count("id").alias("total_movies"),
        F.sum("revenue").alias("total_revenue"),
        F.sum("budget").alias("total_budget"),
        F.round(F.avg("vote_average"), 2).alias("average_rating")
    )

    return metrics


def build_genre_distribution(spark: SparkSession):
    """类型分布 — 直接从 Hive ads_genre_distribution 读取"""
    return spark.table(C.HIVE_TABLE_ADS_GENRE_DIST) \
        .orderBy(F.desc("movie_count"))


def build_rating_distribution(spark: SparkSession):
    """评分分布 — 直接从 Hive ads_rating_distribution 读取"""
    return spark.table(C.HIVE_TABLE_ADS_RATING_DIST) \
        .orderBy("rating_range")


def build_production_trend(spark: SparkSession):
    """
    每年电影产量 + 同比增长率
    从 movie_info 计算（没有现成的预计算表）
    """
    df = spark.table(C.HIVE_TABLE_MOVIE_INFO) \
        .filter("release_date IS NOT NULL AND release_date != ''") \
        .withColumn("year", F.year(F.to_date("release_date", "yyyy-MM-dd"))) \
        .filter("year IS NOT NULL") \
        .groupBy("year") \
        .agg(F.count("id").alias("count")) \
        .orderBy("year")

    # 环比增长率
    w = Window.orderBy("year")
    df = df.withColumn(
        "growth",
        F.when(
            F.lag("count", 1).over(w).isNotNull() &
            (F.lag("count", 1).over(w) > 0),
            F.round(
                (F.col("count") - F.lag("count", 1).over(w))
                / F.lag("count", 1).over(w) * 100,
                1
            )
        ).otherwise(F.lit(0.0))
    )

    return df


def build_roi_top(spark: SparkSession):
    """ROI 排行 — 直接从 Hive ads_movie_roi_top 读取"""
    return spark.table(C.HIVE_TABLE_ADS_ROI_TOP) \
        .orderBy(F.desc("roi_ratio"))


def run(spark: SparkSession):
    print("=" * 60)
    print("[Dashboard ETL] 开始计算仪表盘聚合指标...")
    print("=" * 60)

    # 1. 全局指标
    print("[1/5] 全局统计指标 →", C.MYSQL_TABLE_METRICS)
    metrics = build_global_metrics(spark)
    write_df(metrics, C.MYSQL_TABLE_METRICS)
    metrics.show(truncate=False)
    print("  ✓ 完成")

    # 2. 类型分布
    print("[2/5] 类型分布 →", C.MYSQL_TABLE_GENRE_DIST)
    genre_dist = build_genre_distribution(spark)
    write_df(genre_dist, C.MYSQL_TABLE_GENRE_DIST)
    genre_dist.show(10, truncate=False)
    print("  ✓ 完成")

    # 3. 评分分布
    print("[3/5] 评分分布 →", C.MYSQL_TABLE_RATING_DIST)
    rating_dist = build_rating_distribution(spark)
    write_df(rating_dist, C.MYSQL_TABLE_RATING_DIST)
    rating_dist.show(10, truncate=False)
    print("  ✓ 完成")

    # 4. 产量趋势
    print("[4/5] 产量趋势 →", C.MYSQL_TABLE_PRODUCTION_TREND)
    trend = build_production_trend(spark)
    write_df(trend, C.MYSQL_TABLE_PRODUCTION_TREND)
    trend.show(15, truncate=False)
    print("  ✓ 完成")

    # 5. ROI 排行
    print("[5/5] ROI 排行 →", C.MYSQL_TABLE_ROI)
    roi = build_roi_top(spark)
    write_df(roi, C.MYSQL_TABLE_ROI)
    roi.show(10, truncate=False)
    print("  ✓ 完成")

    print("=" * 60)
    print("[Dashboard ETL] 全部完成！")
    print("=" * 60)


if __name__ == "__main__":
    spark = C.build_spark("MovieX-ETL-Dashboard")
    try:
        run(spark)
    finally:
        spark.stop()
