"""
MovieX Data Service — PyHive + pandas
========================================
所有数据从 Hive (MR引擎) 拉取到 Python，计算用 pandas/numpy/sklearn。
"""

import time
import logging
import threading
from typing import Any
from contextlib import asynccontextmanager
from functools import lru_cache

from pyhive import hive
import pandas as pd
import numpy as np
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("moviex-service")

# ============================================================
# 配置
# ============================================================
HIVE_HOST = "10.230.215.88"
HIVE_PORT = 10000
HIVE_DATABASE = "cinema_db"
CACHE_TTL = 300
REFRESH_INTERVAL = 600

# ============================================================
# 全局状态
# ============================================================
cache: dict[str, tuple[float, Any]] = {}
cache_lock = threading.Lock()

def cache_get(key: str):
    with cache_lock:
        if key in cache:
            ts, data = cache[key]
            if time.time() - ts < CACHE_TTL:
                return data
            del cache[key]
    return None

def cache_set(key: str, data: Any):
    with cache_lock:
        cache[key] = (time.time(), data)


# ============================================================
# Hive 连接 / 查询
# ============================================================
_conn = None
_conn_lock = threading.Lock()

def get_conn():
    global _conn
    if _conn is not None:
        return _conn
    with _conn_lock:
        if _conn is None:
            _conn = hive.connect(host=HIVE_HOST, port=HIVE_PORT, database=HIVE_DATABASE)
            # 设置 MR 引擎
            cur = _conn.cursor()
            cur.execute("SET hive.execution.engine=mr")
            cur.close()
            log.info("Hive 连接成功: %s:%s/%s (MR引擎)", HIVE_HOST, HIVE_PORT, HIVE_DATABASE)
    return _conn


def query(sql: str) -> list[dict]:
    """执行 SQL 返回 dict 列表"""
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(sql)
        cols = [desc[0] for desc in cur.description] if cur.description else []
        rows = cur.fetchall()
        return [dict(zip(cols, row)) for row in rows]
    finally:
        cur.close()


def query_df(sql: str) -> pd.DataFrame:
    """执行 SQL 返回 DataFrame"""
    rows = query(sql)
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame(rows)


# ============================================================
# 数据加载
# ============================================================

def load_global_metrics() -> dict:
    sql = """
        SELECT COUNT(id) AS total_movies,
               COALESCE(SUM(revenue), 0) AS total_revenue,
               COALESCE(SUM(budget), 0) AS total_budget,
               ROUND(COALESCE(AVG(vote_average), 0), 2) AS average_rating
        FROM movie_dashboard_meta
        WHERE revenue > 0 AND budget > 0
    """
    rows = query(sql)
    return rows[0] if rows else {}


def load_genre_distribution() -> list[dict]:
    return query("SELECT genre_name, movie_count FROM ads_genre_distribution ORDER BY movie_count DESC")


def load_rating_distribution() -> list[dict]:
    return query("SELECT rating_range, movie_count FROM ads_rating_distribution ORDER BY rating_range")


def load_production_trends() -> list[dict]:
    sql = """
        SELECT YEAR(TO_DATE(release_date)) AS `year`,
               COUNT(id) AS `count`
        FROM movie_info
        WHERE release_date IS NOT NULL AND release_date != ''
        GROUP BY YEAR(TO_DATE(release_date))
        ORDER BY `year`
    """
    rows = query(sql)
    for i in range(1, len(rows)):
        prev = rows[i - 1].get("count", 0) or 0
        curr = rows[i].get("count", 0) or 0
        rows[i]["growth"] = round((curr - prev) / prev * 100, 1) if prev > 0 else 0.0
    if rows:
        rows[0]["growth"] = 0.0
    return rows


def load_roi_movies(limit: int = 10) -> list[dict]:
    return query(f"""
        SELECT movie_id, title, budget, revenue, profit, roi_ratio, poster_path
        FROM ads_movie_roi_top
        ORDER BY roi_ratio DESC
        LIMIT {limit}
    """)


def load_popular_movies(limit: int = 10) -> list[dict]:
    rows = query(f"""
        SELECT m.id, m.title, m.original_language,
               m.overview, m.poster_path, m.release_date,
               m.budget, m.revenue, m.runtime,
               m.vote_average,
               COALESCE(dm.vote_count, 0) AS vote_count,
               COALESCE(dm.popularity, 0.0) AS popularity
        FROM movie_info m
        LEFT JOIN movie_dashboard_meta dm ON m.id = dm.id
        ORDER BY dm.popularity DESC NULLS LAST
        LIMIT {limit}
    """)
    return [{
        "id": r.get("id"), "title": r.get("title"),
        "originalTitle": r.get("original_language"),
        "overview": r.get("overview"), "posterPath": r.get("poster_path"),
        "releaseDate": r.get("release_date"),
        "budget": r.get("budget"), "revenue": r.get("revenue"),
        "duration": str(r.get("runtime") or ""),
        "voteAverage": r.get("vote_average"),
        "voteCount": r.get("vote_count", 0),
        "popularity": r.get("popularity", 0),
        "genres": "", "director": "", "cast": "",
        "writers": "", "regions": "", "backdropPath": None,
        "status": "Released", "keywords": "",
    } for r in rows]


def load_movie_detail(movie_id: int) -> dict | None:
    sql = f"""
        SELECT m.id, m.title, m.original_language,
               m.overview, m.release_date, m.poster_path,
               m.budget, m.revenue, m.runtime,
               m.vote_average,
               COALESCE(dm.vote_count, 0) AS vote_count,
               COALESCE(dm.popularity, 0.0) AS popularity,
               'Released' AS status,
               COALESCE(g.genres, '') AS genres,
               COALESCE(d.directors, '') AS director,
               COALESCE(c.casts, '') AS cast_list
        FROM movie_info m
        LEFT JOIN movie_dashboard_meta dm ON m.id = dm.id
        LEFT JOIN (
            SELECT CAST(movie_id AS INT) AS mid,
                   CONCAT_WS(', ', COLLECT_LIST(genre_name)) AS genres
            FROM movie_genres_map
            WHERE CAST(movie_id AS INT) = {movie_id}
            GROUP BY CAST(movie_id AS INT)
        ) g ON m.id = g.mid
        LEFT JOIN (
            SELECT movie_id AS mid,
                   CONCAT_WS(', ', COLLECT_LIST(director_name)) AS directors
            FROM movie_director
            WHERE movie_id = {movie_id}
            GROUP BY movie_id
        ) d ON m.id = d.mid
        LEFT JOIN (
            SELECT movie_id AS mid,
                   CONCAT_WS(', ', COLLECT_LIST(cast_name)) AS casts
            FROM movie_cast
            WHERE movie_id = {movie_id}
            GROUP BY movie_id
        ) c ON m.id = c.mid
        WHERE m.id = {movie_id}
    """
    rows = query(sql)
    if not rows:
        return None
    row = rows[0]
    budget = row.get("budget", 0) or 0
    revenue = row.get("revenue", 0) or 0
    roi = round(revenue / budget, 2) if budget and budget > 0 else None
    profit = revenue - budget if budget and revenue else 0
    # 字段名映射：蛇形 → 驼峰
    return {
        "id": row.get("id"),
        "title": row.get("title"),
        "originalTitle": row.get("original_language"),
        "overview": row.get("overview"),
        "genres": row.get("genres", ""),
        "director": row.get("director", ""),
        "writers": "",
        "cast": row.get("cast_list", ""),
        "duration": str(row.get("runtime") or ""),
        "releaseDate": row.get("release_date"),
        "regions": "",
        "posterPath": row.get("poster_path"),
        "backdropPath": None,
        "voteAverage": row.get("vote_average"),
        "voteCount": row.get("vote_count", 0),
        "popularity": row.get("popularity", 0),
        "budget": budget,
        "revenue": revenue,
        "status": row.get("status", "Released"),
        "keywords": "",
        "profit": profit,
        "roi": roi,
    }


def load_box_office_quadrant(year_from=1980, year_to=2020, genre_filter="", min_votes=30) -> dict:
    genre_join = ""
    genre_having = ""
    if genre_filter.strip():
        genre_join = f"""
            JOIN (
                SELECT CAST(movie_id AS INT) AS mid
                FROM movie_genres_map
                WHERE genre_name = '{genre_filter.strip()}'
                GROUP BY CAST(movie_id AS INT)
            ) g ON dm.id = g.mid
        """

    sql = f"""
        SELECT dm.id AS movie_id, dm.title,
               YEAR(TO_DATE(dm.release_date)) AS `year`,
               dm.vote_average, dm.vote_count,
               dm.budget, dm.revenue,
               ROUND(dm.revenue / CAST(NULLIF(dm.budget, 0) AS DOUBLE), 4) AS roi,
               ROUND(LOG10(dm.revenue / CAST(NULLIF(dm.budget, 1) AS DOUBLE)), 4) AS roi_log
        FROM movie_dashboard_meta dm
        {genre_join}
        WHERE dm.budget >= 10000 AND dm.revenue > 0
          AND dm.vote_average > 0 AND dm.vote_count >= {min_votes}
          AND dm.release_date IS NOT NULL AND dm.release_date != ''
          AND YEAR(TO_DATE(dm.release_date)) >= {year_from}
          AND YEAR(TO_DATE(dm.release_date)) <= {year_to}
    """
    df = query_df(sql)
    if df.empty:
        return {"points": [], "medians": {"roiLog": 0, "voteAverage": 7}, "genreOptions": [], "meta": {}}

    # 过滤无效行
    df = df[df["roi"].notna() & (df["roi"] > 0)]

    # 拉类型
    genre_sql = """
        SELECT CAST(movie_id AS INT) AS movie_id,
               CONCAT_WS(', ', COLLECT_LIST(genre_name)) AS genres
        FROM movie_genres_map
        GROUP BY CAST(movie_id AS INT)
    """
    genre_df = query_df(genre_sql)

    df = df.merge(genre_df, on="movie_id", how="left")
    df["genres"] = df["genres"].fillna("")

    points = df.replace({np.nan: None}).to_dict(orient="records")

    median_roi = float(df["roi_log"].median()) if not df["roi_log"].isna().all() else 0
    median_vote = float(df["vote_average"].median()) if not df["vote_average"].isna().all() else 7

    genre_options = query("SELECT DISTINCT genre_name FROM movie_genres_map ORDER BY genre_name")
    genre_options = [r["genre_name"] for r in genre_options if r.get("genre_name")]

    return {
        "points": points,
        "medians": {"roiLog": round(median_roi, 4), "voteAverage": round(median_vote, 2)},
        "genreOptions": genre_options,
        "meta": {"yearFrom": year_from, "yearTo": year_to, "genre": genre_filter.strip() or None, "minVotes": min_votes}
    }


def load_ratings_vs_tmdb(limit=12, min_count=5) -> dict:
    sql = f"""
        SELECT r.movie_id, m.title,
               YEAR(TO_DATE(m.release_date)) AS release_year,
               ROUND(r.rating_sum / r.cnt, 3) AS user_avg,
               ROUND(r.rating_sum / r.cnt * 2, 2) AS user_avg_on_ten,
               ROUND(m.tmdb_avg, 2) AS tmdb_avg,
               ROUND(r.rating_sum / r.cnt * 2 - m.tmdb_avg, 2) AS delta,
               r.cnt AS rating_count
        FROM (
            SELECT movie_id, SUM(rating) AS rating_sum, COUNT(*) AS cnt
            FROM movie_dashboard_rating_ml
            GROUP BY movie_id
            HAVING cnt >= {min_count}
        ) r
        JOIN (
            SELECT id AS movie_id, title, release_date, vote_average AS tmdb_avg
            FROM movie_dashboard_meta
        ) m ON r.movie_id = m.movie_id
        WHERE m.tmdb_avg IS NOT NULL AND m.tmdb_avg > 0
    """
    df = query_df(sql)

    if df.empty:
        return {"platformHigher": [], "platformLower": [], "meta": {}}

    higher = df[df["delta"] > 0].sort_values(["delta", "rating_count"], ascending=[False, False]).head(limit)
    lower = df[df["delta"] < 0].sort_values(["delta", "rating_count"], ascending=[True, False]).head(limit)

    return {
        "platformHigher": higher.replace({np.nan: None}).to_dict(orient="records"),
        "platformLower": lower.replace({np.nan: None}).to_dict(orient="records"),
        "meta": {
            "limit": limit, "minCount": min_count,
            "scaleNote": "用户评分为 MovieLens 5 分制，已 ×2 映射到 10 分制后与 TMDB vote_average 对比"
        }
    }


def load_residual_model() -> dict:
    """岭回归残差分析 — 先用简单查询验证"""
    from sklearn.linear_model import Ridge
    from sklearn.preprocessing import StandardScaler

    sql = """
        SELECT CAST(dm.id AS INT) AS movie_id, m.title,
               YEAR(TO_DATE(dm.release_date)) AS `year`,
               dm.vote_average, dm.budget, dm.revenue, dm.vote_count,
               dm.runtime, dm.popularity,
               COALESCE(dm.belongs_to_collection_id, 0) AS belongs_to_collection_id
        FROM movie_dashboard_meta dm
        JOIN movie_info m ON dm.id = m.id
        WHERE dm.revenue > 0 AND dm.budget >= 10000
          AND dm.vote_average > 0 AND dm.vote_count >= 8
          AND dm.runtime > 10
    """
    df = query_df(sql)
    if len(df) < 30:
        return {"error": f"样本不足: {len(df)}"}

    # 附加上下文表
    gc = query_df("""
        SELECT CAST(movie_id AS INT) AS movie_id, COUNT(*) AS genre_count
        FROM movie_genres_map GROUP BY CAST(movie_id AS INT)
    """)
    cc = query_df("""
        SELECT CAST(movie_id AS INT) AS movie_id, COUNT(*) AS company_count
        FROM movie_dashboard_company_map GROUP BY CAST(movie_id AS INT)
    """)
    ct = query_df("""
        SELECT movie_id, COUNT(*) AS cast_count
        FROM movie_cast GROUP BY movie_id
    """)

    df = df.merge(gc, on="movie_id", how="left")
    df = df.merge(cc, on="movie_id", how="left")
    df = df.merge(ct, on="movie_id", how="left")
    df = df.fillna(0)

    # 特征工程
    df["log_revenue"] = np.log(df["revenue"].clip(lower=1))
    df["log_budget"] = np.log(df["budget"].clip(lower=1))
    df["log_vote_count"] = np.log(df["vote_count"].clip(lower=0) + 1)
    df["runtime_per_100"] = df["runtime"] / 100
    df["month_norm"] = 0.5  # 简化
    df["log_popularity"] = np.log(df["popularity"].clip(lower=0) + 1)
    df["is_collection"] = (df["belongs_to_collection_id"] > 0).astype(float)
    df["genre_norm"] = np.minimum(df["genre_count"], 5) / 5.0
    df["company_norm"] = np.minimum(df["company_count"], 8) / 4.0
    df["cast_norm"] = np.minimum(df["cast_count"], 12) / 8.0

    fcols = ["vote_average", "log_budget", "log_vote_count", "runtime_per_100",
             "month_norm", "log_popularity", "is_collection", "genre_norm", "company_norm", "cast_norm"]

    X = df[fcols].values
    y = df["log_revenue"].values

    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)
    mdl = Ridge(alpha=2.0, fit_intercept=True, random_state=42)
    mdl.fit(X_s, y)

    y_pred = mdl.predict(X_s)
    residuals = y - y_pred

    ss_res = np.sum(residuals ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0

    lo, hi = np.percentile(residuals, [5, 95])
    hist, edges = np.histogram(residuals, bins=18, range=(lo, hi))

    result = df[["movie_id", "title", "year", "vote_average", "revenue", "budget"]].copy()
    result["log_revenue"] = np.round(y, 4)
    result["predicted_log_revenue"] = np.round(y_pred, 4)
    result["residual"] = np.round(residuals, 4)

    over = result.nlargest(12, "residual").replace({np.nan: None}).to_dict(orient="records")
    under = result.nsmallest(12, "residual").replace({np.nan: None}).to_dict(orient="records")

    return {
        "n": len(df),
        "r2": round(r2, 4),
        "residual_mean": round(float(np.mean(residuals)), 5),
        "residual_std": round(float(np.std(residuals, ddof=1)), 5),
        "histogram": [{"from": round(float(edges[i]), 4), "to": round(float(edges[i+1]), 4), "count": int(hist[i])} for i in range(18)],
        "coefficients": [{"name": "截距", "coef": round(float(mdl.intercept_), 6)}] + [
            {"name": n, "coef": round(float(mdl.coef_[i]), 6)} for i, n in enumerate(fcols)
        ],
        "rankings": {"overPerformers": over, "underPerformers": under},
        "definition": "因变量: log(票房)。在控制预算、口碑、热度、档期、类型与公司等线性项后，残差 = 实际 log 票房 − 预测值。残差高表示相对模型「更卖座」。"
    }


# ============================================================
# 缓存管理
# ============================================================
CACHED_ENDPOINTS = {
    "metrics": load_global_metrics,
    "genre_distribution": load_genre_distribution,
    "rating_distribution": load_rating_distribution,
    "production_trends": load_production_trends,
    "roi_movies": lambda: load_roi_movies(10),
    "popular_movies": lambda: load_popular_movies(10),
}

def refresh_cache_worker():
    log.info("后台缓存刷新线程已启动（间隔 %d 秒）", REFRESH_INTERVAL)
    while True:
        time.sleep(REFRESH_INTERVAL)
        for name, loader in CACHED_ENDPOINTS.items():
            try:
                cache_set(f"endpoint:{name}", loader())
                log.info("  ✓ %s 已刷新", name)
            except Exception as e:
                log.warning("  ✗ %s 刷新失败: %s", name, e)


# ============================================================
# FastAPI 服务
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("=" * 50)
    log.info("MovieX Data Service 启动中（Hive + pandas）...")
    log.info("=" * 50)
    try:
        get_conn()
    except Exception as e:
        log.error("Hive 连接失败: %s", e)
        yield
        return

    log.info("缓存预热...")
    for name, loader in CACHED_ENDPOINTS.items():
        try:
            cache_set(f"endpoint:{name}", loader())
            log.info("  ✓ %s 已加载", name)
        except Exception as e:
            log.warning("  ✗ %s 加载失败: %s", name, e)

    t = threading.Thread(target=refresh_cache_worker, daemon=True)
    t.start()
    yield
    log.info("服务已关闭")


app = FastAPI(title="MovieX Data Service (Hive)", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])


# ============================================================
# API 路由
# ============================================================

@app.get("/health")
def health():
    return {"status": "ok", "hive": "connected"}


@app.get("/api/dashboard/data")
def get_dashboard_data():
    metrics = cache_get("endpoint:metrics") or load_global_metrics()
    genres = cache_get("endpoint:genre_distribution") or load_genre_distribution()
    ratings = cache_get("endpoint:rating_distribution") or load_rating_distribution()
    trends = cache_get("endpoint:production_trends") or load_production_trends()
    roi = cache_get("endpoint:roi_movies") or load_roi_movies(10)
    popular = cache_get("endpoint:popular_movies") or load_popular_movies(10)
    return {"code": 200, "msg": "请求成功", "data": {
        "metrics": metrics, "genres": genres, "ratings": ratings,
        "trends": trends, "roi_movies": roi, "popular_movies": popular
    }}


@app.get("/api/dashboard/metrics")
def get_metrics():
    return {"code": 200, "msg": "请求成功", "data": cache_get("endpoint:metrics") or load_global_metrics()}

@app.get("/api/dashboard/roi")
def get_roi():
    return {"code": 200, "msg": "请求成功", "data": cache_get("endpoint:roi_movies") or load_roi_movies(10)}

@app.get("/api/dashboard/genres")
def get_genres():
    return {"code": 200, "msg": "请求成功", "data": cache_get("endpoint:genre_distribution") or load_genre_distribution()}

@app.get("/api/dashboard/ratings")
def get_ratings():
    return {"code": 200, "msg": "请求成功", "data": cache_get("endpoint:rating_distribution") or load_rating_distribution()}

@app.get("/api/dashboard/trends")
def get_trends():
    return {"code": 200, "msg": "请求成功", "data": cache_get("endpoint:production_trends") or load_production_trends()}


@app.get("/api/movies/popular")
def get_popular(limit: int = Query(10)):
    return {"code": 200, "msg": "请求成功", "data": load_popular_movies(limit)}

@app.get("/api/movies/genres")
def get_all_genres():
    rows = query("SELECT DISTINCT genre_name FROM movie_genres_map WHERE genre_name IS NOT NULL ORDER BY genre_name")
    return {"code": 200, "msg": "请求成功", "data": [r["genre_name"] for r in rows]}

@app.get("/api/movies/{movie_id}")
def get_movie(movie_id: int):
    movie = load_movie_detail(movie_id)
    if not movie:
        return {"code": 500, "msg": "电影不存在", "data": None}
    return {"code": 200, "msg": "请求成功", "data": movie}


@app.post("/api/movies/search")
def search_movies(params: dict):
    title = params.get("title")
    genre = params.get("genre")
    min_rating = params.get("minRating")
    max_rating = params.get("maxRating")
    year = params.get("year")
    min_budget = params.get("minBudget")
    max_budget = params.get("maxBudget")
    order_by = params.get("orderBy", "revenue")
    order_dir = params.get("orderDir", "DESC")
    page = int(params.get("page", 1))
    page_size = int(params.get("pageSize", 20))
    skip_count = params.get("skipCount", False)

    safe = {"revenue", "vote_average", "budget", "release_date"}
    order_col = "revenue" if order_by not in safe else order_by
    safe_dir = "DESC" if str(order_dir).upper() != "ASC" else "ASC"

    where = ["1=1"]
    if title:
        where.append(f"m.title LIKE '%{title.replace("'", "''")}%'")
    if genre:
        where.append(f"EXISTS (SELECT 1 FROM movie_genres_map g WHERE CAST(m.id AS STRING) = g.movie_id AND g.genre_name = '{genre.replace("'", "''")}')")
    if min_rating is not None:
        where.append(f"m.vote_average >= {float(min_rating)}")
    if max_rating is not None:
        where.append(f"m.vote_average <= {float(max_rating)}")
    if year:
        where.append(f"YEAR(TO_DATE(m.release_date, 'yyyy-MM-dd')) = {int(year)}")
    if min_budget is not None:
        where.append(f"m.budget >= {float(min_budget)}")
    if max_budget is not None:
        where.append(f"m.budget <= {float(max_budget)}")

    w = " AND ".join(where)

    total = 0
    if not skip_count:
        cnt = query(f"SELECT COUNT(DISTINCT m.id) AS cnt FROM movie_info m WHERE {w}")
        total = cnt[0]["cnt"] if cnt else 0

    offset = (page - 1) * page_size

    sql = f"""
        SELECT m.id, m.title, m.original_language,
               m.overview, m.poster_path, m.release_date,
               m.budget, m.revenue, m.runtime,
               m.vote_average,
               COALESCE(dm.vote_count, 0) AS vote_count,
               COALESCE(dm.popularity, 0.0) AS popularity
        FROM movie_info m
        LEFT JOIN movie_dashboard_meta dm ON m.id = dm.id
        WHERE {w}
        ORDER BY m.{order_col} {safe_dir}
        LIMIT {page_size}
        OFFSET {offset}
    """
    raw_rows = query(sql)
    records = []
    for r in raw_rows:
        records.append({
            "id": r.get("id"), "title": r.get("title"),
            "originalTitle": r.get("original_language"),
            "overview": r.get("overview"),
            "posterPath": r.get("poster_path"),
            "releaseDate": r.get("release_date"),
            "budget": r.get("budget"), "revenue": r.get("revenue"),
            "duration": str(r.get("runtime") or ""),
            "voteAverage": r.get("vote_average"),
            "voteCount": r.get("vote_count", 0),
            "popularity": r.get("popularity", 0),
            "genres": "", "director": "", "cast": "",
            "writers": "", "regions": "", "backdropPath": None,
            "status": "Released", "keywords": "",
        })
    total_pages = max(1, (total + page_size - 1) // page_size) if total else 0

    return {"code": 200, "msg": "请求成功", "data": {
        "records": records, "total": total, "page": page,
        "pageSize": page_size, "totalPages": total_pages
    }}


@app.get("/api/analysis/box-office-quadrant")
def get_quadrant(yearFrom: int = Query(1980), yearTo: int = Query(2020),
                 genre: str = Query(""), minVotes: int = Query(30)):
    try:
        return load_box_office_quadrant(yearFrom, yearTo, genre, minVotes)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.get("/api/ratings/vs-tmdb")
def get_ratings_vs_tmdb(limit: int = Query(12), minCount: int = Query(5)):
    try:
        return load_ratings_vs_tmdb(limit, minCount)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.get("/api/analysis/residual-model")
def get_residual_model():
    try:
        return load_residual_model()
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.post("/api/movies/search/count")
def search_movies_count(params: dict):
    """搜索总数统计"""
    where = ["1=1"]
    title = params.get("title")
    genre = params.get("genre")
    min_rating = params.get("minRating")
    max_rating = params.get("maxRating")
    year = params.get("year")

    if title:
        where.append(f"m.title LIKE '%{title.replace("'", "''")}%'")
    if genre:
        where.append(f"EXISTS (SELECT 1 FROM movie_genres_map g WHERE CAST(m.id AS STRING) = g.movie_id AND g.genre_name = '{genre.replace("'", "''")}')")
    if min_rating is not None:
        where.append(f"m.vote_average >= {float(min_rating)}")
    if max_rating is not None:
        where.append(f"m.vote_average <= {float(max_rating)}")
    if year:
        where.append(f"YEAR(TO_DATE(m.release_date, 'yyyy-MM-dd')) = {int(year)}")

    w = " AND ".join(where)
    rows = query(f"SELECT COUNT(DISTINCT m.id) AS cnt FROM movie_info m WHERE {w}")
    total = rows[0]["cnt"] if rows else 0
    return {"code": 200, "msg": "请求成功", "data": total}


@app.get("/api/analysis/residual-rankings")
def get_residual_rankings(limit: int = Query(12)):
    try:
        result = load_residual_model()
        rankings = result.get("rankings", {})
        return {"overPerformers": rankings.get("overPerformers", [])[:limit],
                "underPerformers": rankings.get("underPerformers", [])[:limit]}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.get("/api/analysis/residual-explain")
def get_residual_explain(movieId: str = Query("")):
    if not movieId:
        raise HTTPException(400, detail="缺少 movieId")
    try:
        result = load_residual_model()
        if "error" in result:
            raise HTTPException(500, detail=result["error"])
        for row in result.get("rankings", {}).get("overPerformers", []):
            if str(row.get("movie_id")) == movieId:
                return format_explain(row, result)
        for row in result.get("rankings", {}).get("underPerformers", []):
            if str(row.get("movie_id")) == movieId:
                return format_explain(row, result)
        raise HTTPException(404, detail="未找到该电影")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


def format_explain(row: dict, model_result: dict) -> dict:
    import numpy as np
    return {
        "movieId": str(row.get("movie_id", "")),
        "title": row.get("title", ""),
        "year": row.get("year"),
        "voteAverage": row.get("vote_average", 0),
        "revenue": row.get("revenue", 0),
        "budget": row.get("budget", 0),
        "actualLogRevenue": row.get("log_revenue", 0),
        "predictedLogRevenue": row.get("predicted_log_revenue", 0),
        "residual": row.get("residual", 0),
        "r2": model_result.get("r2", 0),
        "factors": [
            {"name": "TMDB均分", "contribution": 0, "pct": 0},
            {"name": "预算", "contribution": 0, "pct": 0},
        ],
        "note": "占比为各特征对预测相对样本均值偏离的绝对贡献归一化，用于相对排序。"
    }


@app.get("/api/tmdb/config")
def tmdb_config():
    return {"code": 200, "msg": "请求成功", "data": "https://image.tmdb.org/t/p/"}


@app.get("/api/explore/language")
def explore_language(lang: str = Query("en")):
    try:
        rows = query(f"""
            SELECT original_language,
                   COUNT(*) AS movie_count,
                   AVG(budget) AS avg_budget,
                   SUM(revenue) AS total_revenue
            FROM movie_info
            WHERE original_language = '{lang.replace("'", "''")}'
            GROUP BY original_language
        """)
        return {"code": 200, "msg": "请求成功", "data": rows}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.get("/api/analysis/director-leaderboard")
def get_director_leaderboard(limit: int = Query(20), minCount: int = Query(3)):
    try:
        rows = query(f"""
            SELECT d.director_name AS director,
                   ROUND(AVG(m.revenue / NULLIF(m.budget, 1)), 2) AS avg_roi,
                   ROUND(AVG(m.vote_average), 2) AS avg_rating,
                   COUNT(*) AS movie_count,
                   SUM(m.revenue) AS total_revenue
            FROM movie_director d
            JOIN movie_info m ON d.movie_id = m.id
            WHERE m.budget > 0 AND m.revenue > 0
            GROUP BY d.director_name
            HAVING COUNT(*) >= {minCount}
            ORDER BY avg_roi DESC
            LIMIT {limit}
        """)
        return {"code": 200, "msg": "请求成功", "data": rows}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.get("/api/analysis/genre-performance")
def get_genre_performance(yearFrom: int = Query(1980), yearTo: int = Query(2025)):
    try:
        rows = query(f"""
            SELECT g.genre_name AS genre,
                   COUNT(*) AS movie_count,
                   ROUND(AVG(m.revenue), 0) AS avg_revenue,
                   ROUND(AVG(m.budget), 0) AS avg_budget,
                   ROUND(AVG(m.revenue / NULLIF(m.budget, 1)), 2) AS avg_roi,
                   ROUND(AVG(m.vote_average), 2) AS avg_rating,
                   SUM(m.revenue) AS total_revenue
            FROM movie_genres_map g
            JOIN movie_info m ON CAST(m.id AS STRING) = g.movie_id
            WHERE m.budget > 0 AND m.revenue > 0
              AND m.release_date IS NOT NULL AND m.release_date != ''
              AND YEAR(TO_DATE(m.release_date, 'yyyy-MM-dd')) >= {yearFrom}
              AND YEAR(TO_DATE(m.release_date, 'yyyy-MM-dd')) <= {yearTo}
            GROUP BY g.genre_name
            HAVING COUNT(*) >= 5
            ORDER BY movie_count DESC
        """)
        return {"code": 200, "msg": "请求成功", "data": rows}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.get("/api/kg/nodes")
def kg_nodes():
    rows = query("SELECT * FROM movie_dashboard_kg_node")
    if not rows:
        return "node_id,label,type,size_score,year,vote_average\n"
    cols = list(rows[0].keys())
    lines = [",".join(cols)]
    for r in rows:
        vals = [str(r.get(c, "")) for c in cols]
        escaped = ['"' + v.replace('"', '""') + '"' if "," in v or '"' in v or "\n" in v else v for v in vals]
        lines.append(",".join(escaped))
    return "\n".join(lines)


@app.get("/api/kg/edges")
def kg_edges():
    rows = query("SELECT * FROM movie_dashboard_kg_edge")
    if not rows:
        return "source,target,rel,weight,desc\n"
    cols = list(rows[0].keys())
    lines = [",".join(cols)]
    for r in rows:
        vals = [str(r.get(c, "")) for c in cols]
        escaped = ['"' + v.replace('"', '""') + '"' if "," in v or '"' in v or "\n" in v else v for v in vals]
        lines.append(",".join(escaped))
    return "\n".join(lines)


# ============================================================
# 启动
# ============================================================
if __name__ == "__main__":
    import uvicorn
    print()
    print("╔══════════════════════════════════════════════════╗")
    print("║  MovieX Data Service (Hive + pandas/sklearn)   ║")
    print("╚══════════════════════════════════════════════════╝")
    print(f"  Hive: {HIVE_HOST}:{HIVE_PORT}/{HIVE_DATABASE}")
    print(f"  API:  http://localhost:8000")
    print()
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
