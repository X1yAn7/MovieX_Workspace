"""
MovieX Spark ETL — 集中配置
============================
所有连接参数、表名在此统一管理。
"""

from pyspark.sql import SparkSession

# ==========================================================
# Hive 配置（Spark 通过 Hive Metastore 读取）
# ==========================================================
HIVE_METASTORE_URIS = "thrift://10.230.215.88:9083"
HIVE_DATABASE = "cinema_db"

# Hive 原始表（已确认存在的表）
HIVE_TABLE_MOVIE_INFO          = f"{HIVE_DATABASE}.movie_info"
HIVE_TABLE_MOVIE_DASHBOARD_META = f"{HIVE_DATABASE}.movie_dashboard_meta"
HIVE_TABLE_GENRES_MAP           = f"{HIVE_DATABASE}.movie_genres_map"
HIVE_TABLE_DIRECTOR             = f"{HIVE_DATABASE}.movie_director"
HIVE_TABLE_CAST                 = f"{HIVE_DATABASE}.movie_cast"
HIVE_TABLE_COMPANY_MAP          = f"{HIVE_DATABASE}.movie_dashboard_company_map"
HIVE_TABLE_RATING_ML            = f"{HIVE_DATABASE}.movie_dashboard_rating_ml"
HIVE_TABLE_KG_NODE              = f"{HIVE_DATABASE}.movie_dashboard_kg_node"
HIVE_TABLE_KG_EDGE              = f"{HIVE_DATABASE}.movie_dashboard_kg_edge"

# Hive 预计算表（方案B：直接复用已有结果）
HIVE_TABLE_ADS_GENRE_DIST   = f"{HIVE_DATABASE}.ads_genre_distribution"
HIVE_TABLE_ADS_RATING_DIST  = f"{HIVE_DATABASE}.ads_rating_distribution"
HIVE_TABLE_ADS_ROI_TOP      = f"{HIVE_DATABASE}.ads_movie_roi_top"

# ==========================================================
# MySQL 输出配置（ETL 结果写回供 Spring Boot 读取）
# ==========================================================
MYSQL_JDBC_URL = "jdbc:mysql://localhost:3306/cinema_db?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&rewriteBatchedStatements=true"
MYSQL_USER = "root"
MYSQL_PASSWORD = "123456"
MYSQL_DRIVER = "com.mysql.cj.jdbc.Driver"

# MySQL 输出表
MYSQL_TABLE_METRICS       = "ads_global_metrics"
MYSQL_TABLE_GENRE_DIST    = "ads_genre_distribution"
MYSQL_TABLE_RATING_DIST   = "ads_rating_distribution"
MYSQL_TABLE_PRODUCTION_TREND = "ads_production_trend"
MYSQL_TABLE_ROI           = "ads_movie_roi_top"
MYSQL_TABLE_QUADRANT      = "ads_box_office_quadrant"
MYSQL_TABLE_RATINGS_VS_TMDB  = "ads_ratings_vs_tmdb"
MYSQL_TABLE_RATING_ML_AGG    = "ads_rating_ml_agg"
MYSQL_TABLE_RESIDUAL_RANKINGS = "ads_residual_rankings"
MYSQL_TABLE_MOVIE_INFO    = "movie_info"  # 覆盖原始表

# ==========================================================
# 其他配置
# ==========================================================
WRITE_MODE = "overwrite"
REPARTITION_NUM = 4


def build_spark(app_name: str = "MovieX-ETL") -> SparkSession:
    """创建带 Hive 支持的 SparkSession"""
    return (
        SparkSession.builder
        .appName(app_name)
        .config("hive.metastore.uris", HIVE_METASTORE_URIS)
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
        .config("spark.sql.adaptive.skewJoin.enabled", "true")
        .config("spark.sql.parquet.writeLegacyFormat", "true")
        .config("spark.sql.shuffle.partitions", "200")
        .enableHiveSupport()
        .getOrCreate()
    )
