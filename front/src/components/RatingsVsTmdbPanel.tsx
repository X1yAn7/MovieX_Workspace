import React, { useCallback, useEffect, useState } from 'react';
import { fetchApiJson } from '../lib/fetchApiJson';

interface Row {
  movieId: string;
  title: string;
  releaseYear: number | null;
  userAvg: number;
  userAvgOnTen: number;
  tmdbAvg: number;
  delta: number;
  ratingCount: number;
}

type ApiResponse = {
  platformHigher: Row[];
  platformLower: Row[];
  meta: { limit: number; minCount: number; scaleNote: string };
};

function RowTable({ rows, tone }: { rows: Row[]; tone: 'high' | 'low' }) {
  if (!rows.length) {
    return <p className="py-6 text-center text-[11px] text-natural-muted">暂无数据（试调低最少评分数）</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-natural-border">
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-natural-border bg-natural-sidebar/40 text-[9px] font-bold uppercase tracking-widest text-natural-muted">
            <th className="px-3 py-2">影片</th>
            <th className="px-3 py-2">用户(×2→10)</th>
            <th className="px-3 py-2">TMDB</th>
            <th className="px-3 py-2">偏差 Δ</th>
            <th className="px-3 py-2">条数</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.movieId} className="border-b border-natural-border/60 last:border-0 hover:bg-natural-sidebar/20">
              <td className="max-w-[200px] px-3 py-2 font-medium text-natural-text">
                {r.title}
                {r.releaseYear != null && <span className="ml-1 text-natural-muted">({r.releaseYear})</span>}
              </td>
              <td className="px-3 py-2">{r.userAvgOnTen.toFixed(2)}</td>
              <td className="px-3 py-2">{r.tmdbAvg.toFixed(2)}</td>
              <td
                className={`px-3 py-2 font-semibold ${
                  tone === 'high' ? 'text-emerald-700' : 'text-orange-800'
                }`}
              >
                {r.delta > 0 ? `+${r.delta.toFixed(2)}` : r.delta.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-natural-muted">{r.ratingCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RatingsVsTmdbPanel() {
  const [higher, setHigher] = useState<Row[]>([]);
  const [lower, setLower] = useState<Row[]>([]);
  const [meta, setMeta] = useState<ApiResponse['meta'] | null>(null);
  const [limit, setLimit] = useState(12);
  const [minCount, setMinCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const q = new URLSearchParams({ limit: String(limit), minCount: String(minCount) });
    try {
      const j = await fetchApiJson<ApiResponse>(`/api/ratings/vs-tmdb?${q}`);
      setHigher(j.platformHigher);
      setLower(j.platformLower);
      setMeta(j.meta);
    } catch (e) {
      const raw = e instanceof Error ? e.message : '加载失败';
      if (raw.includes('timeout') || raw.length > 200) {
        setErr('首次加载需从 MovieLens 明细表聚合评分，可能需 1–3 分钟，请稍后再点刷新。');
      } else {
        setErr(raw.length > 280 ? `${raw.slice(0, 280)}…` : raw);
      }
      setHigher([]);
      setLower([]);
    } finally {
      setLoading(false);
    }
  }, [limit, minCount]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          每侧条数 limit
          <input
            type="number"
            min={1}
            max={50}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-20 rounded-xl border border-natural-border bg-white px-2 py-1.5 text-natural-text"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          最少评分条数
          <input
            type="number"
            min={1}
            value={minCount}
            onChange={(e) => setMinCount(Number(e.target.value))}
            className="w-20 rounded-xl border border-natural-border bg-white px-2 py-1.5 text-natural-text"
          />
        </label>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-natural-border bg-natural-sidebar px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-natural-primary"
        >
          刷新
        </button>
      </div>
      {meta && <p className="mb-6 text-[10px] leading-relaxed text-natural-muted">{meta.scaleNote}</p>}

      {loading && <div className="py-12 text-center text-sm text-natural-muted">加载对比数据…</div>}
      {!loading && err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      )}

      {!loading && !err && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-800">
              我们更「宽容」Δ &gt; 0
            </h4>
            <p className="mb-2 text-[10px] text-natural-muted">平台映射分高于 TMDB，用户相对更买账</p>
            <RowTable rows={higher} tone="high" />
          </div>
          <div>
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-900">
              我们更「严苛」Δ &lt; 0
            </h4>
            <p className="mb-2 text-[10px] text-natural-muted">平台映射分低于 TMDB，相对更挑剔</p>
            <RowTable rows={lower} tone="low" />
          </div>
        </div>
      )}
    </div>
  );
}
