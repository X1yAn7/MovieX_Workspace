# MovieX Spark ETL

用 PySpark 替代 MySQL 进行大数据量（千万级）的 ETL 计算，结果写回 MySQL 供 Spring Boot 后端直接读取。

## 架构

```
Hive (dwd_movies + 关联表)     ← 千万级原始数据
        │
   PySpark (分布式计算)
        │
   ┌─────┴──────┐
   │             │
   MySQL        Parquet
  (后端API)     (备份)
```

## 前置条件

1. **PySpark 环境**
   - Spark 3.3+ / Hadoop 3.x
   - `spark-submit` 在 PATH 中
   - Hive Metastore 可访问

2. **MySQL JDBC Driver**
   - 下载 `mysql-connector-j-8.x.jar`
   - 放入 Spark 的 `jars/` 目录，或通过 `--jars` 参数传入

3. **Hive 表就绪**
   - 确认 `cinema_db.dwd_movies` 等表存在且有数据

## 快速开始

### 1. 创建 MySQL 输出表

```bash
mysql -u root -p cinema_db < schema.sql
```

### 2. 提交到 Spark 集群（全量运行）

```bash
spark-submit \
  --master yarn \
  --deploy-mode cluster \
  --num-executors 8 \
  --executor-cores 4 \
  --executor-memory 8g \
  --driver-memory 4g \
  --jars mysql-connector-j-8.0.33.jar \
  run_all.py
```

### 3. 运行单个模块

```bash
# 仅仪表盘
spark-submit run_all.py --module dashboard

# 仅残差分析
spark-submit run_all.py --module residual
```

### 4. 本地调试

```bash
# 确保已 pip install pyspark mysql-connector-python
python run_all.py --local --module dashboard
```

## 模块说明

| 模块 | 脚本 | 产出表 | 数据量级 |
|---|---|---|---|
| dashboard | `etl_dashboard.py` | 全局指标 / 类型分布 / 评分分布 / 产量趋势 / ROI排行 | 扫描全表 → 几条汇总 |
| analysis | `etl_analysis.py` | 四象限 / 评分偏差 / 评分聚合 | 全表 → 百~千条 |
| residual | `etl_residual.py` | 残差排行 / 模型摘要 / 系数 / 直方图 | 全表 → 建模 |
| kg | `etl_kg.py` | 知识图谱节点/边 | 全表 → 万~十万条 |

## 与 Java 后端的关系

- **之前**：Java 后端每次请求都扫 MySQL 做聚合，或全表拉取到内存计算（四象限、残差）
- **之后**：Spark 定时（如每天凌晨）跑完 ETL，将结果写入 `ads_*` 表，Java 后端直接 `SELECT` 这些预计算结果，响应时间从秒级降到毫秒级

## 注意事项

1. **首次运行** 建议先用 `--module dashboard` 测试连通性
2. **Hive 表名** 与生产环境不一致时，修改 `config.py` 中的 `HIVE_TABLE_*` 变量
3. **MySQL 写入** 使用 `overwrite` 模式，每次全量替换（数据量小，适合）
4. **残差分析** 的岭回归使用 Spark MLlib，比 Java 手动实现更稳定且支持特征标准化
