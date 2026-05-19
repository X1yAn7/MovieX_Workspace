#!/usr/bin/env python3
"""
run_all.py — MovieX Spark ETL 主调度脚本
=========================================
按依赖顺序依次执行所有 ETL 模块。

用法:
  # 全量运行
  spark-submit run_all.py

  # 运行指定模块
  spark-submit run_all.py --module movies      # 先同步电影全量数据
  spark-submit run_all.py --module dashboard   # 仪表盘聚合
  spark-submit run_all.py --module analysis    # 分析数据
  spark-submit run_all.py --module residual   # 票房残差
  spark-submit run_all.py --module kg          # 知识图谱

  # 跳过某些模块
  spark-submit run_all.py --skip residual

  # 使用本地 Python (调试模式, 不提交到集群)
  python run_all.py --local

依赖关系:
  dashboard  (无依赖)
  analysis   (无依赖)
  residual   (无依赖, 但建议在 analysis 之后运行以保证 rating_ml_agg 已就绪)
  kg         (无依赖)
"""

import sys
import argparse
from datetime import datetime

import config as C
from config import build_spark


MODULES = {
    "movies": {
        "name": "全量电影数据同步",
        "module": "etl_movies",
        "deps": [],
    },
    "dashboard": {
        "name": "仪表盘聚合",
        "module": "etl_dashboard",
        "deps": ["movies"],
    },
    "analysis": {
        "name": "深度分析数据",
        "module": "etl_analysis",
        "deps": [],
    },
    "residual": {
        "name": "票房残差分析",
        "module": "etl_residual",
        "deps": [],
    },
    "kg": {
        "name": "知识图谱",
        "module": "etl_kg",
        "deps": [],
    },
}


def run_module(spark, module_name: str):
    """动态导入并执行指定模块的 run() 函数"""
    mod_name = MODULES[module_name]["module"]
    print(f"\n{'#' * 70}")
    print(f"# [{datetime.now():%H:%M:%S}] 开始执行: {MODULES[module_name]['name']}")
    print(f"{'#' * 70}\n")

    __import__(mod_name)
    mod = sys.modules[mod_name]
    mod.run(spark)

    print(f"\n{'#' * 70}")
    print(f"# [{datetime.now():%H:%M:%S}] 完成: {MODULES[module_name]['name']}")
    print(f"{'#' * 70}\n")


def main():
    parser = argparse.ArgumentParser(description="MovieX Spark ETL 调度器")
    parser.add_argument("--module", "-m", type=str, default=None,
                        help="仅运行指定模块: dashboard | analysis | residual | kg")
    parser.add_argument("--skip", "-s", type=str, default=None,
                        help="跳过指定模块 (逗号分隔)")
    parser.add_argument("--local", action="store_true",
                        help="本地调试模式 (使用 python 而非 spark-submit)")
    args = parser.parse_args()

    # 可用模块列表
    available = list(MODULES.keys())

    # 确定要运行的模块
    if args.module:
        if args.module not in MODULES:
            print(f"错误: 未知模块 '{args.module}'。可选: {', '.join(available)}")
            sys.exit(1)
        to_run = [args.module]
    else:
        to_run = available.copy()

    # 处理 --skip
    if args.skip:
        skip_list = [s.strip() for s in args.skip.split(",")]
        to_run = [m for m in to_run if m not in skip_list]

    if not to_run:
        print("没有需要运行的模块。")
        sys.exit(0)

    print("=" * 70)
    print(f"  MovieX Spark ETL 调度器")
    print(f"  启动时间: {datetime.now():%Y-%m-%d %H:%M:%S}")
    print(f"  运行模式: {'本地调试' if args.local else '集群模式'}")
    print(f"  执行顺序: {' → '.join(to_run)}")
    print("=" * 70)

    if args.local:
        # 本地调试：用普通 Python 直接运行（需要 PySpark 已安装）
        for m in to_run:
            print(f"\n>>> 运行模块: {m}")
            __import__(MODULES[m]["module"])
            mod = sys.modules[MODULES[m]["module"]]
            spark = mod.C.build_spark(f"MovieX-ETL-{m.capitalize()}")
            try:
                mod.run(spark)
            finally:
                spark.stop()
    else:
        # 集群模式：spark-submit 会处理 driver
        spark = build_spark("MovieX-ETL-Orchestrator")
        try:
            for m in to_run:
                run_module(spark, m)
        finally:
            spark.stop()

    print("=" * 70)
    print(f"  全部任务完成！结束时间: {datetime.now():%Y-%m-%d %H:%M:%S}")
    print("=" * 70)


if __name__ == "__main__":
    main()
