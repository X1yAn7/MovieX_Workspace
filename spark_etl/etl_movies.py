"""
etl_movies.py — 全量同步电影数据
==================================
将 Hive 中的电影信息同步到 MySQL 的 movie_info 表。

为了提供完整的电影详情（包括类型、导演、演员），需要关联多张表：
  movie_info + movie_dashboard_meta + movie_genres_map
  + movie_director + movie_cast

最终写入 MySQL 的 movie_info 表，Spring Boot 后端直接用它做 CRUD
"""

from pyspark.sql import SparkSession, DataFrame
from pyspark.sql import functions as F

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


def build_movie_info(spark: SparkSession):
    """
    构建完整的电影信息表（与 Spring Boot MovieInfo 实体对应）

    Hive 表结构参考：
      movie_info:               id(int), title, original_language, overview,
                                poster_path, release_date(string), budget,
                                revenue, runtime(double), vote_average(double)
      movie_dashboard_meta:     id(bigint), vote_count(bigint), popularity(double),
                                belongs_to_collection_id(bigint), + 相同字段
      movie_genres_map:         movie_id(string), genre_name(string)
      movie_director:           movie_id(int), director_name(string)
      movie_cast:               movie_id(int), cast_name(string)
    """
    # 1. 基础电影信息
    base = spark.table(C.HIVE_TABLE_MOVIE_INFO) \
        .selectExpr(
            "id",
            "title",
            "original_language AS original_title",
            "overview",
            "poster_path",
            "release_date",
            "budget",
            "revenue",
            "runtime",
            "vote_average"
        )

    # 2. 从 movie_dashboard_meta 补充 vote_count 和 popularity
    meta = spark.table(C.HIVE_TABLE_MOVIE_DASHBOARD_META) \
        .selectExpr(
            "CAST(id AS INT) AS id",
            "vote_count",
            "popularity"
        )

    base = base.alias("b") \
        .join(meta.alias("m"), F.col("b.id") == F.col("m.id"), "left") \
        .selectExpr(
            "b.id",
            "b.title",
            "b.original_title",
            "b.overview",
            "b.poster_path",
            "b.release_date",
            "b.budget",
            "b.revenue",
            "b.runtime",
            "b.vote_average",
            "COALESCE(m.vote_count, 0) AS vote_count",
            "COALESCE(m.popularity, 0.0) AS popularity"
        )

    # 3. 聚合类型名称（逗号分隔）
    genres = spark.table(C.HIVE_TABLE_GENRES_MAP) \
        .groupBy("movie_id") \
        .agg(F.concat_ws(", ", F.collect_list("genre_name")).alias("genres"))

    # 4. 聚合导演名称（逗号分隔）
    directors = spark.table(C.HIVE_TABLE_DIRECTOR) \
        .groupBy("movie_id") \
        .agg(F.concat_ws(", ", F.collect_list("director_name")).alias("director"))

    # 5. 聚合演员名称（逗号分隔，取前 10）
    cast = spark.table(C.HIVE_TABLE_CAST) \
        .groupBy("movie_id") \
        .agg(F.concat_ws(", ", F.collect_list("cast_name")).alias("cast_list"))

    # 6. 全部关联起来
    result = base.alias("b") \
        .join(
            genres.alias("g"),
            F.col("b.id").cast("string") == F.col("g.movie_id"),
            "left"
        ) \
        .join(
            directors.alias("d"),
            F.col("b.id") == F.col("d.movie_id"),
            "left"
        ) \
        .join(
            cast.alias("c"),
            F.col("b.id") == F.col("c.movie_id"),
            "left"
        ) \
        .selectExpr(
            "b.id",
            "b.title",
            "b.original_title",
            "b.overview",
            "COALESCE(g.genres, '') AS genres",
            "COALESCE(d.director, '') AS director",
            "COALESCE(c.cast_list, '') AS `cast`",
            "CAST(b.runtime AS STRING) AS duration",
            "b.release_date",
            "b.poster_path",
            "b.vote_average",
            "b.vote_count",
            "b.popularity",
            "b.budget",
            "b.revenue",
            "'Released' AS `status`"
        ) \
        .orderBy("id")

    return result


def run(spark: SparkSession):
    print("=" * 60)
    print("[Movies ETL] 开始全量同步电影数据...")
    print("=" * 60)

    print(f"  读取 Hive 表: {C.HIVE_TABLE_MOVIE_INFO}")
    print(f"  写入 MySQL 表: {C.MYSQL_TABLE_MOVIE_INFO}")

    movies = build_movie_info(spark)
    total = movies.count()
    print(f"  ✓ 共读取 {total} 条电影记录")

    write_df(movies, C.MYSQL_TABLE_MOVIE_INFO)
    print(f"  ✓ 写入完成！")

    movies.select("id", "title", "genres", "director", "vote_average") \
        .show(10, truncate=False)

    print("=" * 60)
    print("[Movies ETL] 全部完成！")
    print("=" * 60)


if __name__ == "__main__":
    spark = C.build_spark("MovieX-ETL-Movies")
    try:
        run(spark)
    finally:
        spark.stop()
