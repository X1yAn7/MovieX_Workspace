import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchApiJson } from '../lib/fetchApiJson';
import RechartsSized from './RechartsSized';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const HIST_H = 260;
const ATTRIB_H = 320;

type ModelResponse = {
  n: number;
  r2: number;
  residualMean: number;
  residualStd: number;
  histogram: { from: number; to: number; count: number }[];
  coefficients: { name: string; coef: number }[];
  definition: string;
};

type RankingRow = {
  movieId: string;
  title: string;
  year: number | null;
  voteAverage: number;
  revenue: number;
  budget: number;
  logRevenue: number;
  predictedLogRevenue: number;
  residual: number;
};

type RankingsResponse = {
  overPerformers: RankingRow[];
  underPerformers: RankingRow[];
};

type ExplainResponse = {
  movieId: string;
  title: string;
  year: number | null;
  voteAverage: number;
  revenue: number;
  budget: number;
  actualLogRevenue: number;
  predictedLogRevenue: number;
  residual: number;
  r2: number;
  factors: { name: string; contribution: number; pct: number }[];
  note: string;
};

function fmtRev(n: number) {
  const m = n / 1_000_000;
  return m >= 0.1 ? `${m.toFixed(1)}M` : `${(n / 1000).toFixed(0)}k`;
}

function RankingTable({
  rows,
  tone,
  selectedId,
  onSelect,
}: {
  rows: RankingRow[];
  tone: 'over' | 'under';
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!rows.length) {
    return <p className="py-6 text-center text-[11px] text-natural-muted">暂无排行数据</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-natural-border">
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-natural-border bg-natural-sidebar/40 text-[9px] font-bold uppercase tracking-widest text-natural-muted">
            <th className="px-3 py-2">影片</th>
            <th className="px-3 py-2">残差</th>
            <th className="px-3 py-2">预测 log</th>
            <th className="px-3 py-2">TMDB</th>
            <th className="px-3 py-2">票房</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const active = selectedId === r.movieId;
            return (
              <tr
                key={r.movieId}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(r.movieId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(r.movieId);
                  }
                }}
                className={`cursor-pointer border-b border-natural-border/60 last:border-0 ${
                  active ? 'bg-emerald-500/10' : 'hover:bg-natural-sidebar/20'
                }`}
              >
                <td className="max-w-[200px] px-3 py-2 font-medium text-natural-text">
                  {r.title}
                  {r.year != null && <span className="ml-1 text-natural-muted">({r.year})</span>}
                </td>
                <td
                  className={`px-3 py-2 font-semibold ${
                    tone === 'over' ? 'text-emerald-700' : 'text-orange-800'
                  }`}
                >
                  {r.residual > 0 ? `+${r.residual.toFixed(3)}` : r.residual.toFixed(3)}
                </td>
                <td className="px-3 py-2 text-natural-muted">{r.predictedLogRevenue.toFixed(2)}</td>
                <td className="px-3 py-2">{r.voteAverage.toFixed(1)}</td>
                <td className="px-3 py-2 text-natural-muted">{fmtRev(r.revenue)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ResidualAnalysisPanel() {
  const [model, setModel] = useState<ModelResponse | null>(null);
  const [modelErr, setModelErr] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  const [over, setOver] = useState<RankingRow[]>([]);
  const [under, setUnder] = useState<RankingRow[]>([]);
  const [rankErr, setRankErr] = useState<string | null>(null);
  const [rankLoading, setRankLoading] = useState(true);
  const [limit, setLimit] = useState(12);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [explain, setExplain] = useState<ExplainResponse | null>(null);
  const [explainErr, setExplainErr] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  const loadModel = useCallback(async (refresh = false) => {
    setModelLoading(true);
    setModelErr(null);
    const q = refresh ? '?refresh=1' : '';
    try {
      const j = await fetchApiJson<ModelResponse>(`/api/analysis/residual-model${q}`);
      setModel(j);
    } catch (e) {
      setModelErr(e instanceof Error ? e.message : '模型加载失败');
      setModel(null);
    } finally {
      setModelLoading(false);
    }
  }, []);

  const loadRankings = useCallback(async () => {
    setRankLoading(true);
    setRankErr(null);
    const q = new URLSearchParams({ limit: String(limit) });
    try {
      const j = await fetchApiJson<RankingsResponse>(`/api/analysis/residual-rankings?${q}`);
      setOver(j.overPerformers);
      setUnder(j.underPerformers);
    } catch (e) {
      setRankErr(e instanceof Error ? e.message : '排行榜加载失败');
      setOver([]);
      setUnder([]);
    } finally {
      setRankLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void loadModel(false);
  }, [loadModel]);

  useEffect(() => {
    void loadRankings();
  }, [loadRankings]);

  const loadExplain = useCallback(async (movieId: string) => {
    setExplainLoading(true);
    setExplainErr(null);
    setExplain(null);
    const q = new URLSearchParams({ movieId });
    try {
      const j = await fetchApiJson<ExplainResponse>(`/api/analysis/residual-explain?${q}`);
      setExplain(j);
    } catch (e) {
      setExplainErr(e instanceof Error ? e.message : '归因加载失败');
    } finally {
      setExplainLoading(false);
    }
  }, []);

  const onSelectRow = useCallback(
    (id: string) => {
      setSelectedId(id);
      void loadExplain(id);
    },
    [loadExplain]
  );

  const histData = useMemo(() => {
    if (!model?.histogram?.length) return [];
    return model.histogram.map((b) => ({
      ...b,
      label:
        (b.to - b.from) < 0.02
          ? b.from.toFixed(3)
          : `${b.from.toFixed(2)}–${b.to.toFixed(2)}`,
    }));
  }, [model]);

  const attribData = useMemo(() => {
    if (!explain?.factors?.length) return [];
    const top = [...explain.factors].slice(0, 10);
    return top.map((f) => ({
      name: f.name,
      pct: f.pct,
      contribution: f.contribution,
      signed: f.contribution >= 0 ? 1 : -1,
    }));
  }, [explain]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          每侧条数 limit
          <input
            type="number"
            min={1}
            max={50}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 12)}
            className="w-24 rounded-xl border border-natural-border bg-white px-3 py-2 text-[11px] text-natural-text"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadRankings()}
            disabled={rankLoading}
            className="rounded-xl border border-natural-border bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-natural-text hover:bg-natural-sidebar/30 disabled:opacity-50"
          >
            刷新排行
          </button>
          <button
            type="button"
            onClick={() => void loadModel(true)}
            disabled={modelLoading}
            className="rounded-xl border border-natural-border bg-natural-sidebar/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-natural-muted hover:bg-natural-sidebar/60 disabled:opacity-50"
          >
            重算模型
          </button>
        </div>
      </div>

      {modelLoading && !model && (
        <p className="text-[11px] text-natural-muted">正在拟合岭回归模型…</p>
      )}
      {modelErr && <p className="text-[11px] text-red-700">{modelErr}</p>}

      {model && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
              残差分布（5%–95% 分位内分箱）
            </p>
            <p className="mb-3 text-[11px] leading-relaxed text-natural-text">{model.definition}</p>
            <div className="mb-2 flex flex-wrap gap-4 text-[11px] text-natural-muted">
              <span>
                样本 n = <strong className="text-natural-text">{model.n}</strong>
              </span>
              <span>
                R² ≈ <strong className="text-natural-text">{model.r2}</strong>
              </span>
              <span>
                残差 μ = {model.residualMean} · σ = {model.residualStd}
              </span>
            </div>
            <RechartsSized height={HIST_H}>
              {({ width, height }) => (
                <BarChart width={width} height={height} data={histData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 8 }}
                    angle={-40}
                    textAnchor="end"
                    height={52}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} width={36} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0' }}
                    formatter={(v: number) => [v, '部数']}
                  />
                  <Bar dataKey="count" fill="#319795" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </RechartsSized>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
              岭回归系数（参考）
            </p>
            <div className="max-h-[260px] overflow-y-auto rounded-2xl border border-natural-border">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="sticky top-0 border-b border-natural-border bg-natural-sidebar/50 text-[9px] font-bold uppercase tracking-widest text-natural-muted">
                    <th className="px-3 py-2">特征</th>
                    <th className="px-3 py-2">β</th>
                  </tr>
                </thead>
                <tbody>
                  {model.coefficients.map((c) => (
                    <tr key={c.name} className="border-b border-natural-border/50 last:border-0">
                      <td className="px-3 py-1.5 text-natural-text">{c.name}</td>
                      <td className="px-3 py-1.5 font-mono text-natural-muted">{c.coef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {rankErr && <p className="text-[11px] text-red-700">{rankErr}</p>}
      {rankLoading && over.length === 0 && under.length === 0 && (
        <p className="text-[11px] text-natural-muted">加载排行榜…</p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-800">
            相对更卖座（残差高）
          </h4>
          <RankingTable rows={over} tone="over" selectedId={selectedId} onSelect={onSelectRow} />
        </div>
        <div>
          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-orange-900">
            相对未达预期（残差低）
          </h4>
          <RankingTable rows={under} tone="under" selectedId={selectedId} onSelect={onSelectRow} />
        </div>
      </div>

      <div className="rounded-2xl border border-natural-border bg-natural-sidebar/10 p-6">
        <h4 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-natural-muted">
          单片因素占比（点击上表一行）
        </h4>
        {!selectedId && !explainLoading && (
          <p className="text-[11px] text-natural-muted">请选择一部电影查看归因条形图。</p>
        )}
        {explainLoading && <p className="text-[11px] text-natural-muted">加载归因…</p>}
        {explainErr && <p className="text-[11px] text-red-700">{explainErr}</p>}
        {explain && (
          <>
            <div className="mb-4 text-[11px] text-natural-text">
              <span className="font-semibold">{explain.title}</span>
              {explain.year != null && <span className="ml-1 text-natural-muted">({explain.year})</span>}
              <span className="ml-3 text-natural-muted">
                实际 log {explain.actualLogRevenue} · 预测 {explain.predictedLogRevenue} · 残差{' '}
                <strong className={explain.residual >= 0 ? 'text-emerald-700' : 'text-orange-800'}>
                  {explain.residual > 0 ? `+${explain.residual}` : explain.residual}
                </strong>
              </span>
              <span className="ml-3 text-natural-muted">
                票房 {fmtRev(explain.revenue)} · 预算 {fmtRev(explain.budget)} · TMDB {explain.voteAverage.toFixed(1)}
              </span>
            </div>
            <p className="mb-2 text-[10px] text-natural-muted">{explain.note}</p>
            <RechartsSized height={ATTRIB_H}>
              {({ width, height }) => (
                <BarChart
                  layout="vertical"
                  width={width}
                  height={height}
                  data={attribData}
                  margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={108} tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0' }}
                    formatter={(pct: number, _n, item) => {
                      const c = item?.payload as { contribution?: number } | undefined;
                      const contrib = c?.contribution;
                      return [
                        `${pct}%（贡献 ${typeof contrib === 'number' ? contrib.toFixed(4) : '—'}）`,
                        '占比',
                      ];
                    }}
                  />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                    {attribData.map((e) => (
                      <Cell key={e.name} fill={e.signed >= 0 ? '#2f855a' : '#c05621'} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </RechartsSized>
          </>
        )}
      </div>
    </div>
  );
}
