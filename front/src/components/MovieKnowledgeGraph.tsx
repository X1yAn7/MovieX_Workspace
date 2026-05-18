import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject } from 'react-force-graph-2d';
import {
  type KgBuild,
  type KgNodeRow,
  type RelationType,
  fetchKgBuild,
  moviePassesFilters,
  oneHopIds,
} from '../utils/kgData';

const HUB_MOVIE = '__kg_hub_movie__';
const HUB_ACTOR = '__kg_hub_actor__';
const HUB_DIRECTOR = '__kg_hub_director__';

const TOP_HUB_CHILDREN = 48;

type Route = 'roots' | 'hub' | 'drill';
type HubKind = 'movie' | 'actor' | 'director';
type LayoutMode = 'force' | 'radial' | 'tree';

type DisplayNode = NodeObject & {
  id: string;
  label: string;
  val: number;
  color: string;
  hub?: HubKind;
  entityType?: KgNodeRow['type'];
  isActor?: boolean;
  isDirector?: boolean;
};

type DisplayLink = {
  source: string;
  target: string;
  rel: RelationType | '__VIRTUAL__';
  weight: number;
  desc: string;
  dashed?: boolean;
};

const REL_LABEL: Record<RelationType, string> = {
  ACTED_IN: '参演',
  DIRECTED: '执导',
  HAS_GENRE: '类型',
  PRODUCED_BY: '出品',
  RATED: '评分',
};

export default function MovieKnowledgeGraph({ height = 450 }: { height?: number }) {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 600, h: height });

  const [kg, setKg] = useState<KgBuild | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const [route, setRoute] = useState<Route>('roots');
  const [hubKind, setHubKind] = useState<HubKind | null>(null);
  const [drillId, setDrillId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');

  const [showMovie, setShowMovie] = useState(true);
  const [showActor, setShowActor] = useState(true);
  const [showDirector, setShowDirector] = useState(true);
  const [showGenre, setShowGenre] = useState(true);
  const [showCompany, setShowCompany] = useState(true);
  const [showUser, setShowUser] = useState(false);

  const [relOn, setRelOn] = useState<Record<RelationType, boolean>>({
    ACTED_IN: true,
    DIRECTED: true,
    HAS_GENRE: true,
    PRODUCED_BY: true,
    RATED: true,
  });

  const [voteMin, setVoteMin] = useState(0);
  const [voteMax, setVoteMax] = useState(10);
  const [yearMin, setYearMin] = useState(1980);
  const [yearMax, setYearMax] = useState(2020);

  useEffect(() => {
    let ok = true;
    setBusy(true);
    fetchKgBuild()
      .then((b) => {
        if (ok) setKg(b);
      })
      .catch((e: Error) => {
        if (ok) setLoadErr(e.message);
      })
      .finally(() => {
        if (ok) setBusy(false);
      });
    return () => {
      ok = false;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.max(320, el.clientWidth);
      const ch = el.clientHeight;
      setDims({ w, h: Math.max(240, ch > 0 ? ch : height) });
    });
    ro.observe(el);
    setDims({
      w: Math.max(320, el.clientWidth),
      h: Math.max(240, el.clientHeight > 0 ? el.clientHeight : height),
    });
    return () => ro.disconnect();
  }, [height]);

  const effVote = voteMin <= voteMax ? ([voteMin, voteMax] as const) : ([voteMax, voteMin] as const);
  const effYear = yearMin <= yearMax ? ([yearMin, yearMax] as const) : ([yearMax, yearMin] as const);

  const personShown = useCallback(
    (id: string) => {
      if (!kg) return false;
      const a = kg.actors.has(id);
      const d = kg.directors.has(id);
      if (a && d) return showActor || showDirector;
      if (a) return showActor;
      if (d) return showDirector;
      return showActor;
    },
    [kg, showActor, showDirector]
  );

  const nodeAllowed = useCallback(
    (id: string, row: KgNodeRow) => {
      switch (row.type) {
        case 'Movie':
          return (
            showMovie &&
            moviePassesFilters(row, effVote[0], effVote[1], effYear[0], effYear[1])
          );
        case 'Person':
          return personShown(id);
        case 'Genre':
          return showGenre;
        case 'Company':
          return showCompany;
        case 'User':
          return showUser;
        default:
          return false;
      }
    },
    [showMovie, showGenre, showCompany, showUser, voteMin, voteMax, yearMin, yearMax, personShown]
  );

  const realNodeVisual = useCallback(
    (id: string, row: KgNodeRow): Pick<DisplayNode, 'val' | 'color' | 'entityType' | 'isActor' | 'isDirector'> => {
      const ties = kg?.personMovieTies.get(id) ?? 0;
      const isAct = kg?.actors.has(id) ?? false;
      const isDir = kg?.directors.has(id) ?? false;
      let color: string;
      if (row.type === 'Movie') color = '#22543d';
      else if (row.type === 'Person') {
        if (isAct && isDir) color = '#805ad5';
        else if (isDir) color = '#c53030';
        else color = '#c05621';
      } else if (row.type === 'Genre') color = '#38a169';
      else if (row.type === 'Company') color = '#b7791f';
      else if (row.type === 'User') color = '#718096';

      let val = 3;
      if (row.type === 'Movie') val = 3 + row.sizeScore * 28;
      else if (row.type === 'Person') val = 3 + Math.min(ties * 0.55, 18);
      else if (row.type === 'Genre') val = 5;
      else if (row.type === 'Company') val = 4;
      else val = 3;

      return { val, color, entityType: row.type, isActor: isAct, isDirector: isDir };
    },
    [kg]
  );

  const makeRealDisplayNode = useCallback(
    (id: string): DisplayNode | null => {
      if (!kg) return null;
      const row = kg.nodes.get(id);
      if (!row) return null;
      return {
        id,
        label: row.label,
        ...realNodeVisual(id, row),
      };
    },
    [kg, realNodeVisual]
  );

  const hubNode = useCallback((kind: HubKind): DisplayNode => {
    if (kind === 'movie') {
      return {
        id: HUB_MOVIE,
        label: '电影',
        val: 22,
        color: '#1a5650',
        hub: 'movie',
      };
    }
    if (kind === 'actor') {
      return {
        id: HUB_ACTOR,
        label: '演员',
        val: 22,
        color: '#2c5282',
        hub: 'actor',
      };
    }
    return {
      id: HUB_DIRECTOR,
      label: '导演',
      val: 22,
      color: '#9b2c2c',
      hub: 'director',
    };
  }, []);

  const topMovieIds = useMemo(() => {
    if (!kg) return [] as string[];
    const [vm, vx] = effVote;
    const [ym, yx] = effYear;
    return [...kg.nodes.values()]
      .filter((m) => m.type === 'Movie' && moviePassesFilters(m, vm, vx, ym, yx))
      .sort((a, b) => b.sizeScore - a.sizeScore)
      .slice(0, TOP_HUB_CHILDREN)
      .map((m) => m.id);
  }, [kg, effVote, effYear]);

  const topActorIds = useMemo(() => {
    if (!kg) return [] as string[];
    return [...kg.actors]
      .map((id) => ({ id, t: kg.personMovieTies.get(id) ?? 0 }))
      .sort((a, b) => b.t - a.t)
      .slice(0, TOP_HUB_CHILDREN)
      .map((x) => x.id);
  }, [kg]);

  const topDirectorIds = useMemo(() => {
    if (!kg) return [] as string[];
    return [...kg.directors]
      .map((id) => ({ id, t: kg.personMovieTies.get(id) ?? 0 }))
      .sort((a, b) => b.t - a.t)
      .slice(0, TOP_HUB_CHILDREN)
      .map((x) => x.id);
  }, [kg]);

  const graphData = useMemo(() => {
    if (!kg) return { nodes: [] as DisplayNode[], links: [] as DisplayLink[] };

    if (route === 'roots') {
      return {
        nodes: [hubNode('movie'), hubNode('actor'), hubNode('director')],
        links: [] as DisplayLink[],
      };
    }

    if (route === 'hub' && hubKind === 'movie') {
      const nodes: DisplayNode[] = [hubNode('movie')];
      const links: DisplayLink[] = [];
      for (const mid of topMovieIds) {
        const n = makeRealDisplayNode(mid);
        if (n) {
          nodes.push(n);
          links.push({
            source: HUB_MOVIE,
            target: mid,
            rel: '__VIRTUAL__',
            weight: 0.2,
            desc: '',
          });
        }
      }
      return { nodes, links };
    }

    if (route === 'hub' && hubKind === 'actor') {
      const nodes: DisplayNode[] = [hubNode('actor')];
      const links: DisplayLink[] = [];
      for (const pid of topActorIds) {
        if (!personShown(pid)) continue;
        const n = makeRealDisplayNode(pid);
        if (n) {
          nodes.push(n);
          links.push({
            source: HUB_ACTOR,
            target: pid,
            rel: '__VIRTUAL__',
            weight: 0.2,
            desc: '',
          });
        }
      }
      return { nodes, links };
    }

    if (route === 'hub' && hubKind === 'director') {
      const nodes: DisplayNode[] = [hubNode('director')];
      const links: DisplayLink[] = [];
      for (const pid of topDirectorIds) {
        if (!personShown(pid)) continue;
        const n = makeRealDisplayNode(pid);
        if (n) {
          nodes.push(n);
          links.push({
            source: HUB_DIRECTOR,
            target: pid,
            rel: '__VIRTUAL__',
            weight: 0.2,
            desc: '',
          });
        }
      }
      return { nodes, links };
    }

    if (route === 'drill' && drillId) {
      const raw = oneHopIds(kg, drillId);
      const ids = [...raw].filter((id) => {
        const row = kg.nodes.get(id);
        return row && nodeAllowed(id, row);
      });
      const idSet = new Set(ids);
      const nodes = ids
        .map((id) => makeRealDisplayNode(id))
        .filter((n): n is DisplayNode => n != null);

      const links: DisplayLink[] = [];
      for (const e of kg.edges) {
        if (!relOn[e.rel]) continue;
        if (!idSet.has(e.source) || !idSet.has(e.target)) continue;
        links.push({
          source: e.source,
          target: e.target,
          rel: e.rel,
          weight: e.weight,
          desc: e.desc,
          dashed: e.rel === 'RATED' && e.weight < 0.85,
        });
      }
      return { nodes, links };
    }

    return { nodes: [] as DisplayNode[], links: [] as DisplayLink[] };
  }, [
    kg,
    route,
    hubKind,
    drillId,
    hubNode,
    makeRealDisplayNode,
    topMovieIds,
    topActorIds,
    topDirectorIds,
    personShown,
    nodeAllowed,
    relOn,
  ]);

  const focusSet = useMemo(() => {
    if (!kg || route === 'roots') return null as Set<string> | null;
    const center = focusId ?? drillId;
    if (!center) return null;
    return oneHopIds(kg, center);
  }, [kg, route, focusId, drillId]);

  useEffect(() => {
    if (layoutMode !== 'force' || !fgRef.current || graphData.nodes.length === 0) return;
    graphData.nodes.forEach((n) => {
      n.fx = undefined;
      n.fy = undefined;
    });
    fgRef.current.d3ReheatSimulation?.();
  }, [layoutMode, graphData]);

  const applyRadial = useCallback(() => {
    const nodes = graphData.nodes as DisplayNode[];
    if (!nodes.length || !fgRef.current) return;
    const centerId = focusId ?? drillId ?? nodes[0]?.id;
    const cn = nodes.find((n) => n.id === centerId) ?? nodes[0];
    if (!cn) return;
    const cx = 0;
    const cy = 0;
    cn.fx = cx;
    cn.fy = cy;
    const rest = nodes.filter((n) => n.id !== cn.id);
    rest.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(rest.length, 1) - Math.PI / 2;
      const r = 120 + (n.val ?? 4) * 4;
      n.fx = cx + r * Math.cos(angle);
      n.fy = cy + r * Math.sin(angle);
    });
    fgRef.current.d3ReheatSimulation?.();
  }, [graphData.nodes, focusId, drillId]);

  const applyTree = useCallback(() => {
    const nodes = graphData.nodes as DisplayNode[];
    if (!nodes.length || !fgRef.current) return;
    const layer = (n: DisplayNode) => {
      if (n.hub) return 0;
      const t = n.entityType;
      if (t === 'Company') return 1;
      if (t === 'Movie') return 2;
      if (t === 'Person') return 3;
      if (t === 'Genre') return 4;
      return 5;
    };
    const buckets = new Map<number, DisplayNode[]>();
    for (const n of nodes) {
      const L = layer(n);
      if (!buckets.has(L)) buckets.set(L, []);
      buckets.get(L)!.push(n);
    }
    for (const [, arr] of buckets) {
      arr.forEach((n, i) => {
        n.fx = (i - (arr.length - 1) / 2) * 56;
        n.fy = -160 + layer(n) * 95;
      });
    }
    fgRef.current.d3ReheatSimulation?.();
  }, [graphData.nodes]);

  useEffect(() => {
    if (layoutMode === 'radial') applyRadial();
    else if (layoutMode === 'tree') applyTree();
  }, [layoutMode, applyRadial, applyTree, graphData.nodes.length]);

  const goBack = useCallback(() => {
    if (route === 'drill') {
      setDrillId(null);
      setFocusId(null);
      setRoute('hub');
      setLayoutMode('force');
      return;
    }
    if (route === 'hub') {
      setHubKind(null);
      setRoute('roots');
      setFocusId(null);
      setLayoutMode('force');
    }
  }, [route]);

  const resetAll = useCallback(() => {
    setRoute('roots');
    setHubKind(null);
    setDrillId(null);
    setFocusId(null);
    setLayoutMode('force');
    fgRef.current?.zoomToFit?.(400);
  }, []);

  const handleNodeClick = useCallback(
    (node: DisplayNode) => {
      if (node.hub) {
        setHubKind(node.hub);
        setRoute('hub');
        setDrillId(null);
        setFocusId(null);
        return;
      }
      if (route === 'hub') {
        setDrillId(node.id);
        setRoute('drill');
        setFocusId(node.id);
        return;
      }
      if (route === 'drill') {
        setDrillId(node.id);
        setFocusId(node.id);
      }
    },
    [route]
  );

  const linkEndpointId = useCallback((x: unknown): string => {
    if (x == null) return '';
    if (typeof x === 'object' && 'id' in (x as object)) return String((x as { id: string }).id);
    return String(x);
  }, []);

  const onEngineStop = useCallback(() => {
    fgRef.current?.zoomToFit?.(400, 40);
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full rounded-[inherit] border border-natural-border/60 bg-natural-bg/30 text-natural-text">
      <aside className="w-[220px] shrink-0 overflow-y-auto border-r border-natural-border bg-natural-sidebar/40 p-3 text-[11px]">
        <div className="mb-2 font-bold uppercase tracking-widest text-natural-muted">知识图谱</div>
        <p className="mb-3 leading-relaxed text-natural-muted">
          顶层并列「电影 / 演员 / 导演」。点击一类进入子集；再点节点查看一跳关联（以该节点为中心，淡化一跳外节点与边）。
        </p>
        {(route !== 'roots' || drillId || hubKind) && (
          <button
            type="button"
            onClick={goBack}
            className="mb-2 w-full rounded-xl border border-natural-border bg-white py-2 text-[10px] font-bold uppercase tracking-widest text-natural-primary"
          >
            返回上一层
          </button>
        )}
        <button
          type="button"
          onClick={resetAll}
          className="mb-4 w-full rounded-xl border border-natural-border bg-natural-primary py-2 text-[10px] font-bold uppercase tracking-widest text-white"
        >
          回到顶层三节点
        </button>

        <div className="mb-2 font-semibold text-natural-text">节点类型</div>
        {(
          [
            ['电影', showMovie, setShowMovie],
            ['演员 (Person+参演)', showActor, setShowActor],
            ['导演 (Person+执导)', showDirector, setShowDirector],
            ['类型 Genre', showGenre, setShowGenre],
            ['公司 Company', showCompany, setShowCompany],
            ['用户 User', showUser, setShowUser],
          ] as const
        ).map(([label, on, set]) => (
          <label key={label} className="mb-1 flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={on} onChange={() => set(!on)} />
            <span>{label}</span>
          </label>
        ))}

        <div className="mt-3 font-semibold">关系类型</div>
        {(Object.keys(REL_LABEL) as RelationType[]).map((r) => (
          <label key={r} className="mb-1 flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={relOn[r]} onChange={() => setRelOn((p) => ({ ...p, [r]: !p[r] }))} />
            <span>
              {REL_LABEL[r]} ({r})
            </span>
          </label>
        ))}

        <div className="mt-3 font-semibold">评分 {voteMin} – {voteMax}</div>
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={voteMin}
          onChange={(e) => setVoteMin(Number(e.target.value))}
          className="w-full"
        />
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={voteMax}
          onChange={(e) => setVoteMax(Number(e.target.value))}
          className="w-full"
        />

        <div className="mt-2 font-semibold">
          年份 {yearMin} – {yearMax}
        </div>
        <input
          type="range"
          min={1920}
          max={2026}
          value={yearMin}
          onChange={(e) => setYearMin(Number(e.target.value))}
          className="w-full"
        />
        <input
          type="range"
          min={1920}
          max={2026}
          value={yearMax}
          onChange={(e) => setYearMax(Number(e.target.value))}
          className="w-full"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ['force', '力导向'],
              ['radial', '径向'],
              ['tree', '分层'],
            ] as const
          ).map(([mode, text]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setLayoutMode(mode)}
              className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${
                layoutMode === mode ? 'bg-natural-primary text-white' : 'border border-natural-border bg-white'
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </aside>

      <div ref={wrapRef} className="relative min-h-0 min-w-0 flex-1">
        {(busy || loadErr) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-natural-bg/60 text-sm">
            {loadErr ? `加载失败：${loadErr}` : '加载知识图谱…'}
          </div>
        )}
        <ForceGraph2D
          ref={fgRef}
          width={dims.w}
          height={dims.h}
          graphData={graphData}
          nodeId="id"
          nodeLabel={(n) => {
            const nn = n as DisplayNode;
            if (nn.hub) return nn.label;
            const row = kg?.nodes.get(nn.id);
            if (!row) return nn.label;
            if (row.type === 'Movie') {
              return `${row.label} · ${row.year ?? '—'} · ★${row.voteAverage ?? '—'}`;
            }
            if (row.type === 'Person') {
              const bits = [row.label];
              if (nn.isActor) bits.push('演员');
              if (nn.isDirector) bits.push('导演');
              return bits.join(' · ');
            }
            return `${row.label} (${row.type})`;
          }}
          linkLabel={(l) => {
            const ln = l as DisplayLink;
            if (ln.rel === '__VIRTUAL__') return '';
            if (ln.desc) return `${REL_LABEL[ln.rel as RelationType]} · ${ln.desc}`;
            return REL_LABEL[ln.rel as RelationType] ?? ln.rel;
          }}
          nodeVal={(n) => (n as DisplayNode).val}
          linkWidth={(l) => {
            const ln = l as DisplayLink;
            if (ln.rel === '__VIRTUAL__') return 0.6;
            if (ln.rel === 'RATED') return 0.8 + ln.weight * 3.2;
            return 0.6 + Math.sqrt(ln.weight || 1) * 0.9;
          }}
          linkLineDash={(l) => ((l as DisplayLink).dashed ? [5, 4] : undefined)}
          linkColor={(l) => {
            const ln = l as DisplayLink;
            if (ln.rel === '__VIRTUAL__') return 'rgba(100,120,140,0.35)';
            const s = linkEndpointId(ln.source);
            const t = linkEndpointId(ln.target);
            const dim = focusSet && focusSet.size && (!focusSet.has(s) || !focusSet.has(t));
            return dim ? 'rgba(160,170,160,0.12)' : 'rgba(90,110,100,0.45)';
          }}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          linkCanvasObjectMode={() => 'replace'}
          onEngineStop={onEngineStop}
          onNodeClick={(n) => handleNodeClick(n as DisplayNode)}
          nodeCanvasObjectMode={() => 'replace'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as DisplayNode;
            const r = Math.sqrt(Math.max(n.val ?? 4, 1)) * 2.8;
            const alpha = focusSet == null || focusSet.has(n.id) ? 1 : 0.14;

            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = n.color;
            ctx.fill();
            if (n.hub) {
              ctx.strokeStyle = 'rgba(255,255,255,0.85)';
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }
            const fs = Math.max(10 / globalScale, 8 / globalScale);
            ctx.font = `${fs}px system-ui,sans-serif`;
            ctx.fillStyle = `rgba(40,44,40,${alpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(n.label.length > 14 ? `${n.label.slice(0, 12)}…` : n.label, n.x!, n.y! - r - 6 / globalScale);
            ctx.globalAlpha = 1;
          }}
          linkCanvasObject={(link, ctx, globalScale) => {
            const ln = link as DisplayLink & { source: { x?: number; y?: number }; target: { x?: number; y?: number } };
            const sx = ln.source.x;
            const sy = ln.source.y;
            const tx = ln.target.x;
            const ty = ln.target.y;
            if (sx == null || sy == null || tx == null || ty == null) return;
            const sid = linkEndpointId(ln.source);
            const tid = linkEndpointId(ln.target);
            const dim = Boolean(focusSet?.size && (!focusSet.has(sid) || !focusSet.has(tid)));

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(tx, ty);
            const baseW =
              ln.rel === '__VIRTUAL__'
                ? 0.35
                : ln.rel === 'RATED'
                  ? 0.5 + ln.weight * 2.2
                  : 0.55 + Math.sqrt(ln.weight || 1) * 0.45;
            ctx.lineWidth = baseW / globalScale;
            ctx.strokeStyle =
              ln.rel === '__VIRTUAL__'
                ? dim
                  ? 'rgba(120,130,140,0.06)'
                  : 'rgba(100,120,130,0.25)'
                : dim
                  ? 'rgba(150,155,145,0.1)'
                  : 'rgba(85,110,95,0.5)';
            if (ln.dashed) ctx.setLineDash([6 / globalScale, 5 / globalScale]);
            ctx.stroke();
            ctx.setLineDash([]);
          }}
          d3VelocityDecay={0.22}
          cooldownTicks={layoutMode === 'force' ? 120 : 20}
        />
      </div>
    </div>
  );
}
