"""
etl_kg.py — 知识图谱数据同步
=============================
直接从 Hive 的 movie_dashboard_kg_node / edge 全量同步到 MySQL。
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


def run(spark: SparkSession):
    print("=" * 60)
    print("[KG ETL] 开始同步知识图谱...")
    print("=" * 60)

    # 1. 节点
    print("[1/2] 节点 → movie_dashboard_kg_node")
    nodes = spark.table(C.HIVE_TABLE_KG_NODE)
    n_count = nodes.count()
    print(f"  ✓ Hive 读取 {n_count} 个节点")
    write_df(nodes, "movie_dashboard_kg_node")
    nodes.show(5, truncate=False)
    print("  ✓ 写入完成")

    # 2. 边
    print("[2/2] 边 → movie_dashboard_kg_edge")
    edges = spark.table(C.HIVE_TABLE_KG_EDGE)
    e_count = edges.count()
    print(f"  ✓ Hive 读取 {e_count} 条边")
    write_df(edges, "movie_dashboard_kg_edge")
    edges.show(5, truncate=False)
    print("  ✓ 写入完成")

    print("=" * 60)
    print("[KG ETL] 全部完成！")
    print("=" * 60)


if __name__ == "__main__":
    spark = C.build_spark("MovieX-ETL-KG")
    try:
        run(spark)
    finally:
        spark.stop()
