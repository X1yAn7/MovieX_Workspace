import React, { useEffect, useState } from 'react';
import { fetchApiJson } from '../lib/fetchApiJson';

interface DirectorRow {
  director: string;
  avg_roi: number;
  avg_rating: number;
  movie_count: number;
  total_revenue: number;
}

export default function DirectorLeaderboard() {
  const [data, setData] = useState<DirectorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);
  const [minCount, setMinCount] = useState(3);

  useEffect(() => {
    setLoading(true);
    fetchApiJson<DirectorRow[]>(
      `/api/analysis/director-leaderboard?limit=${limit}&minCount=${minCount}`
    ).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [limit, minCount]);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          显示条数
          <input type="number" min={5} max={50} value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="w-20 rounded-xl border border-natural-border bg-white px-2 py-1.5 text-xs" />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          最少作品数
          <input type="number" min={1} max={20} value={minCount}
            onChange={e => setMinCount(Number(e.target.value))}
            className="w-20 rounded-xl border border-natural-border bg-white px-2 py-1.5 text-xs" />
        </label>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-natural-muted">加载中...</div>
      ) : (
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto rounded-2xl border border-natural-border">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-natural-border bg-natural-sidebar/40 text-[9px] font-bold uppercase tracking-widest text-natural-muted">
                <th className="px-3 py-2">排名</th>
                <th className="px-3 py-2">导演</th>
                <th className="px-3 py-2">作品数</th>
                <th className="px-3 py-2">平均 ROI</th>
                <th className="px-3 py-2">平均评分</th>
                <th className="px-3 py-2">总票房</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.director} className="border-b border-natural-border/60 hover:bg-natural-sidebar/20 transition-colors">
                  <td className="px-3 py-2">
                    <span className={`font-serif text-lg italic ${i < 3 ? 'text-natural-accent' : 'text-natural-muted/60'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-bold text-natural-text">{r.director}</td>
                  <td className="px-3 py-2">{r.movie_count}</td>
                  <td className="px-3 py-2 font-semibold text-natural-primary">{r.avg_roi.toFixed(2)}x</td>
                  <td className="px-3 py-2">{r.avg_rating.toFixed(1)}</td>
                  <td className="px-3 py-2 text-natural-muted">${(r.total_revenue / 1_000_000).toFixed(0)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
