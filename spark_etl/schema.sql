-- =============================================================
-- MovieX Spark ETL — MySQL 输出表建表 DDL
-- 运行 ETL 前，先在 MySQL 中执行此脚本创建输出表
-- =============================================================

-- 0. movie_info — 全量电影信息（由 Spark 从 Hive 同步）
--    注意：如果 MySQL 已有 movie_info 表，先确认字段一致
CREATE TABLE IF NOT EXISTS movie_info (
    id               INT            PRIMARY KEY COMMENT '电影ID',
    title            VARCHAR(500)   COMMENT '电影标题',
    original_title   VARCHAR(200)   COMMENT '原始标题',
    overview         TEXT           COMMENT '剧情简介',
    genres           TEXT           COMMENT '类型列表(逗号分隔)',
    director         VARCHAR(500)   COMMENT '导演',
    cast_list        TEXT           COMMENT '演员阵容',
    duration         VARCHAR(50)    COMMENT '片长',
    release_date     VARCHAR(20)    COMMENT '上映日期(yyyy-MM-dd)',
    poster_path      VARCHAR(500)   COMMENT '海报路径',
    vote_average     DECIMAL(4,2)   COMMENT 'TMDB评分',
    vote_count       INT            COMMENT '评分人数',
    popularity       DOUBLE         COMMENT '热度',
    budget           BIGINT         COMMENT '预算',
    revenue          BIGINT         COMMENT '票房',
    status           VARCHAR(50)    DEFAULT 'Released' COMMENT '状态'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电影信息（Spark从Hive同步）';

-- 1. 全局统计指标
CREATE TABLE IF NOT EXISTS ads_global_metrics (
    total_movies    BIGINT         COMMENT '电影总数',
    total_revenue   DECIMAL(20,2)  COMMENT '总票房',
    total_budget    DECIMAL(20,2)  COMMENT '总预算',
    average_rating  DECIMAL(4,2)   COMMENT '平均评分'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全局统计指标（Spark ETL）';

-- 2. 类型分布
CREATE TABLE IF NOT EXISTS ads_genre_distribution (
    genre_name  VARCHAR(100) PRIMARY KEY COMMENT '类型名称',
    movie_count BIGINT        COMMENT '电影数量'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电影类型分布（Spark ETL）';

-- 3. 评分分布
CREATE TABLE IF NOT EXISTS ads_rating_distribution (
    rating_range VARCHAR(20) PRIMARY KEY COMMENT '评分区间',
    movie_count  BIGINT       COMMENT '电影数量'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电影评分分布（Spark ETL）';

-- 4. 产量趋势
CREATE TABLE IF NOT EXISTS ads_production_trend (
    year   INT         PRIMARY KEY COMMENT '年份',
    count  BIGINT      COMMENT '该年电影数',
    growth DECIMAL(6,1) COMMENT '同比增长率(%)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电影产量趋势（Spark ETL）';

-- 5. ROI 排行
CREATE TABLE IF NOT EXISTS ads_movie_roi_top (
    movie_id    INT           PRIMARY KEY COMMENT '电影ID',
    title       VARCHAR(500)  COMMENT '电影标题',
    budget      BIGINT        COMMENT '预算',
    revenue     BIGINT        COMMENT '票房',
    profit      BIGINT        COMMENT '利润',
    roi_ratio   DOUBLE        COMMENT 'ROI 比率',
    poster_path VARCHAR(500)  COMMENT '海报路径'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投资回报率排行（Spark ETL）';

-- 6. 商业四象限
CREATE TABLE IF NOT EXISTS ads_box_office_quadrant (
    movie_id       VARCHAR(50)  PRIMARY KEY COMMENT '电影ID',
    title          VARCHAR(500) COMMENT '电影标题',
    year           INT          COMMENT '上映年份',
    vote_average   DECIMAL(4,2) COMMENT 'TMDB评分',
    vote_count     BIGINT       COMMENT '评分人数',
    budget         BIGINT       COMMENT '预算',
    revenue        BIGINT       COMMENT '票房',
    roi            DECIMAL(10,4) COMMENT 'ROI',
    roi_log        DECIMAL(10,4) COMMENT 'log10(ROI)',
    genres_str     TEXT         COMMENT '类型列表',
    quadrant       VARCHAR(2)   COMMENT '象限(UR/UL/LR/LL)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商业口碑四象限数据（Spark ETL）';

-- 7. 评分偏差对比
CREATE TABLE IF NOT EXISTS ads_ratings_vs_tmdb (
    movie_id        BIGINT       COMMENT '电影ID',
    title           VARCHAR(500) COMMENT '电影标题',
    release_year    INT          COMMENT '上映年份',
    user_avg        DECIMAL(6,3) COMMENT '用户均分(5分制)',
    user_avg_on_ten DECIMAL(5,2) COMMENT '用户均分×2→10分制',
    tmdb_avg        DECIMAL(5,2) COMMENT 'TMDB均分',
    delta           DECIMAL(5,2) COMMENT '偏差',
    rating_count    BIGINT       COMMENT '评分数',
    tone            VARCHAR(10)  COMMENT 'higher/lower',
    PRIMARY KEY (movie_id, tone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户评分vs TMDB评分偏差（Spark ETL）';

-- 8. MovieLens 评分聚合
CREATE TABLE IF NOT EXISTS ads_rating_ml_agg (
    movie_id    BIGINT        PRIMARY KEY COMMENT '电影ID',
    rating_sum  DECIMAL(20,4) COMMENT '评分总和',
    cnt         BIGINT        COMMENT '评分数'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='MovieLens评分聚合（Spark ETL）';

-- 9. 残差排行
CREATE TABLE IF NOT EXISTS ads_residual_rankings (
    movie_id               VARCHAR(50)  COMMENT '电影ID',
    title                  VARCHAR(500) COMMENT '电影标题',
    year                   INT          COMMENT '上映年份',
    vote_average           DECIMAL(4,2) COMMENT 'TMDB评分',
    revenue                BIGINT       COMMENT '票房',
    budget                 BIGINT       COMMENT '预算',
    log_revenue            DECIMAL(10,4) COMMENT '实际log票房',
    predicted_log_revenue  DECIMAL(10,4) COMMENT '预测log票房',
    residual               DECIMAL(10,4) COMMENT '残差',
    tone                   VARCHAR(10)  COMMENT 'over/under',
    PRIMARY KEY (movie_id, tone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='票房残差排行（Spark ETL）';

-- 10. 模型摘要
CREATE TABLE IF NOT EXISTS ads_residual_model_summary (
    metric  VARCHAR(100) PRIMARY KEY COMMENT '指标名',
    value   TEXT         COMMENT '指标值'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岭回归模型摘要（Spark ETL）';

-- 11. 系数
CREATE TABLE IF NOT EXISTS ads_residual_coefficients (
    feature_name VARCHAR(100) PRIMARY KEY COMMENT '特征名',
    coefficient  DOUBLE       COMMENT '系数值'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岭回归系数（Spark ETL）';

-- 12. 直方图
CREATE TABLE IF NOT EXISTS ads_residual_histogram (
    bin_from DOUBLE COMMENT '分桶起始',
    bin_to   DOUBLE COMMENT '分桶结束',
    count    INT    COMMENT '电影数量'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='残差分布直方图（Spark ETL）';
