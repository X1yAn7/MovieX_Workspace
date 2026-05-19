import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { fetchApiJson } from '../lib/fetchApiJson';

interface GenreRow {
  genre: string;
  movie_count: number;
  avg_revenue: number;
  avg_budget: number;
  avg_roi: number;
  avg_rating: number;
  total_revenue: number;
}

const COLORS = ['#4A5D4E', '#A3B18A', '#588157', '#3A5A40', '#D4A373', '#8A8A82', '#6B705C', '#DAD7CD'];

export default function GenrePerformance() {
  const [data, setData] = useState<GenreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFrom, setYearFrom] = useState(1980);
  const [yearTo, setYearTo] = useState(2025);
  const [metric, setMetric] = useState<'avg_roi' | 'avg_rating' | 'movie_count'>('avg_roi');
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setLoading(true);
    fetchApiJson<GenreRow[]>(
      `/api/analysis/genre-performance?yearFrom=${yearFrom}&yearTo=${yearTo}`
    ).then(rows => {
      const sorted = sortBy === 'desc'
        ? rows.sort((a, b) => b[metric] - a[metric])
        : rows.sort((a, b) => a[metric] - b[metric]);
      setData(sorted.slice(0, 15));
    }).catch(console.error).finally(() => setLoading(false));
  }, [yearFrom, yearTo, metric, sortBy]);

  const metricLabel = metric === 'avg_roi' ? '平均 ROI' : metric === 'avg_rating' ? '平均评分' : '电影数量';

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          年份
          <div className="flex gap-2">
            <input type="number" value={yearFrom} onChange={e => setYearFrom(Number(e.target.value))}
              className="w-20 rounded-xl border border-natural-border bg-white px-2 py-1.5 text-xs" />
            <span className="self-center text-natural-muted">-</span>
            <input type="number" value={yearTo} onChange={e => setYearTo(Number(e.target.value))}
              className="w-20 rounded-xl border border-natural-border bg-white px-2 py-1.5 text-xs" />
          </div>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          指标
          <select value={metric} onChange={e => setMetric(e.target.value as any)}
            className="rounded-xl border border-natural-border bg-white px-3 py-1.5 text-xs">
            <option value="avg_roi">平均 ROI</option>
            <option value="avg_rating">平均评分</option>
            <option value="movie_count">电影数量</option>
          </select>
        </label>
        <button onClick={() => setSortBy(sortBy === 'desc' ? 'asc' : 'desc')}
          className="mt-5 rounded-xl border border-natural-border bg-white px-3 py-1.5 text-[10px] font-bold uppercase">
          {sortBy === 'desc' ? '↓ 降序' : '↑ 升序'}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-natural-muted">加载中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-natural-border bg-natural-sidebar/40 text-[9px] font-bold uppercase tracking-widest text-natural-muted">
                <th className="px-3 py-2">类型</th>
                <th className="px-3 py-2">电影数</th>
                <th className="px-3 py-2">平均票房</th>
                <th className="px-3 py-2">平均评分</th>
                <th className="px-3 py-2">平均 ROI</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.genre} className="border-b border-natural-border/60 hover:bg-natural-sidebar/20">
                  <td className="px-3 py-2 font-bold text-natural-text">{r.genre}</td>
                  <td className="px-3 py-2">{r.movie_count}</td>
                  <td className="px-3 py-2 text-natural-muted">${(r.avg_revenue / 1_000_000).toFixed(1)}M</td>
                  <td className="px-3 py-2">{r.avg_rating.toFixed(1)}</td>
                  <td className="px-3 py-2 font-semibold text-natural-primary">{r.avg_roi.toFixed(2)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
