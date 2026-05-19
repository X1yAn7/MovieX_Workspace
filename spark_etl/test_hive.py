"""测试 Hive JDBC 连接"""
from pyhive import hive
import time

print(f"[{time.strftime('%H:%M:%S')}] 正在连接 Hive...")
conn = hive.connect(host='10.230.215.88', port=10000, database='cinema_db')
print(f"[{time.strftime('%H:%M:%S')}] 连接成功")

cur = conn.cursor()

print(f"[{time.strftime('%H:%M:%S')}] 测试 SELECT 1...")
cur.execute("SELECT 1")
print(f"  结果: {cur.fetchone()}")

print(f"[{time.strftime('%H:%M:%S')}] 设置 MR 引擎...")
cur.execute("SET hive.execution.engine=mr")
print(f"  完成")

print(f"[{time.strftime('%H:%M:%S')}] 查询 5 条电影数据...")
cur.execute("SELECT id, title, vote_average FROM movie_info LIMIT 5")
rows = cur.fetchall()
print(f"  结果: {rows}")

print(f"[{time.strftime('%H:%M:%S')}] 全部完成!")
cur.close()
conn.close()
