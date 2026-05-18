import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { fetchApiJson } from '../lib/fetchApiJson';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Label,
  Cell,
} from 'recharts';

const CHART_H = 420;

interface QuadrantPoint {
  id: string;
  title: string;
  year: number;
  voteAverage: number;
  voteCount: number;
  budget: number;
  revenue: number;
  roi: number;
  roiLog: number;
  genres: string[];
}

type ApiResponse = {
  points: QuadrantPoint[];
  medians: { roiLog: number; voteAverage: number };
  genreOptions: string[];
  meta: { yearFrom: number; yearTo: number; genre: string | null; minVotes: number };
};

function quadrantColor(p: QuadrantPoint, mx: number, my: number): string {
  const hiR = p.roiLog >= mx;
  const hiV = p.voteAverage >= my;
  if (hiR && hiV) return '#2f855a';
  if (!hiR && hiV) return '#2b6cb0';
  if (hiR && !hiV) return '#c05621';
  return '#718096';
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: QuadrantPoint }[];
}) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const revM = d.revenue / 1_000_000;
  const budM = d.budget / 1_000_000;
  return (
    <div className="max-w-[240px] rounded-2xl border border-natural-border bg-white px-3 py-2 text-[11px] shadow-soft">
      <div className="font-bold text-natural-text">{d.title}</div>
      <div className="mt-1 text-natural-muted">
        {d.year} · TMDB ★{d.voteAverage.toFixed(1)} · {Math.round(d.voteCount)} 票
      </div>
      <div className="mt-1 text-natural-text">
        票房 {revM.toFixed(1)}M / 预算 {budM.toFixed(1)}M · ROI ×{d.roi.toFixed(2)}
      </div>
      {d.genres.length > 0 && (
        <div className="mt-1 text-[10px] text-natural-muted">{d.genres.slice(0, 5).join(' · ')}</div>
      )}
    </div>
  );
};

export default function BoxOfficeQuadrantChart() {
  const [data, setData] = useState<QuadrantPoint[]>([]);
  const [medians, setMedians] = useState({ roiLog: 0, voteAverage: 7 });
  const [genreOptions, setGenreOptions] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState(1990);
  const [yearTo, setYearTo] = useState(2015);
  const [genre, setGenre] = useState('');
  const [minVotes, setMinVotes] = useState(40);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const chartBoxRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(640);

  useLayoutEffect(() => {
    const el = chartBoxRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setChartWidth(Math.max(280, Math.floor(w)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const q = new URLSearchParams({
      yearFrom: String(yearFrom),
      yearTo: String(yearTo),
      minVotes: String(minVotes),
    });
    if (genre) q.set('genre', genre);
    try {
      const j = await fetchApiJson<ApiResponse>(`/api/analysis/box-office-quadrant?${q}`);
      setData(j.points);
      setMedians(j.medians);
      setGenreOptions(j.genreOptions);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '加载失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [yearFrom, yearTo, genre, minVotes]);

  useEffect(() => {
    load();
  }, [load]);

  const scatterData = useMemo(
    () =>
      data.map((p) => ({
        ...p,
        fill: quadrantColor(p, medians.roiLog, medians.voteAverage),
      })),
    [data, medians.roiLog, medians.voteAverage]
  );

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          起年
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(Number(e.target.value))}
            className="w-24 rounded-xl border border-natural-border bg-white px-2 py-1.5 text-natural-text"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          止年
          <input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(Number(e.target.value))}
            className="w-24 rounded-xl border border-natural-border bg-white px-2 py-1.5 text-natural-text"
          />
        </label>
        <label className="flex min-w-[140px] flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          类型
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="rounded-xl border border-natural-border bg-white px-2 py-1.5 text-natural-text"
          >
            <option value="">全部</option>
            {genreOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          最少票数
          <input
            type="number"
            min={0}
            value={minVotes}
            onChange={(e) => setMinVotes(Number(e.target.value))}
            className="w-24 rounded-xl border border-natural-border bg-white px-2 py-1.5 text-natural-text"
          />
        </label>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-natural-border bg-natural-sidebar px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-natural-primary"
        >
          刷新
        </button>
        <span className="text-[10px] text-natural-muted">
          当前 {scatterData.length} 部（预算≥1万、有票房、API 与后续入库逻辑一致）
        </span>
      </div>

      {loading && <div className="py-20 text-center text-sm text-natural-muted">加载四象限数据…</div>}
      {!loading && err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      )}

      {!loading && !err && scatterData.length === 0 && (
        <div className="py-16 text-center text-sm text-natural-muted">筛选条件下没有数据，请放宽年份或降低最少票数。</div>
      )}

      {!loading && !err && scatterData.length > 0 && (
        <div ref={chartBoxRef} className="w-full min-w-0" style={{ height: CHART_H }}>
          {chartWidth > 0 && (
            <ScatterChart width={chartWidth} height={CHART_H} margin={{ top: 16, right: 24, bottom: 48, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5de" />
              <XAxis
                type="number"
                dataKey="roiLog"
                name="log₁₀(ROI)"
                tick={{ fontSize: 10, fill: '#8A8A82' }}
                label={{ value: 'log₁₀(票房/预算) → 商业回报', position: 'bottom', offset: 26, fill: '#8A8A82', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="voteAverage"
                name="评分"
                domain={[0, 10]}
                tick={{ fontSize: 10, fill: '#8A8A82' }}
                label={{ value: 'TMDB 均分', angle: -90, position: 'insideLeft', fill: '#8A8A82', fontSize: 11 }}
              />
              <ZAxis type="number" dataKey="voteCount" range={[40, 400]} name="票数" />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <ReferenceLine
                x={medians.roiLog}
                stroke="#4A5D4E"
                strokeDasharray="6 4"
                strokeOpacity={0.85}
              >
                <Label value="回报中位数" position="top" fill="#4A5D4E" fontSize={10} />
              </ReferenceLine>
              <ReferenceLine
                y={medians.voteAverage}
                stroke="#4A5D4E"
                strokeDasharray="6 4"
                strokeOpacity={0.85}
              >
                <Label value="口碑中位数" position="right" fill="#4A5D4E" fontSize={10} />
              </ReferenceLine>
              <Scatter name="影片" data={scatterData} fill="#4A5D4E">
                {scatterData.map((entry) => (
                  <Cell key={entry.id} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-3 text-[10px] text-natural-muted sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['bg-emerald-700', '右上', '高回报 · 高口碑', '叫好又叫座'],
          ['bg-blue-700', '左上', '低回报 · 高口碑', '叫好不叫座'],
          ['bg-orange-700', '右下', '高回报 · 低口碑', '叫座不叫好'],
          ['bg-gray-600', '左下', '低回报 · 低口碑', '双弱区'],
        ].map(([dot, pos, axis, note]) => (
          <div key={pos} className="flex items-start gap-2 rounded-2xl border border-natural-border bg-natural-sidebar/30 p-3">
            <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
            <span>
              <span className="font-bold text-natural-text">{String(pos)}</span> {String(axis)}
              <span className="block text-natural-muted">{String(note)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
