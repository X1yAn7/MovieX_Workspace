import Papa from 'papaparse';

export type EntityType = 'Movie' | 'Person' | 'Genre' | 'Company' | 'User';
export type RelationType = 'ACTED_IN' | 'DIRECTED' | 'HAS_GENRE' | 'PRODUCED_BY' | 'RATED';

export interface KgNodeRow {
  id: string;
  label: string;
  type: EntityType;
  sizeScore: number;
  year: number | null;
  voteAverage: number | null;
}

export interface KgEdgeRow {
  source: string;
  target: string;
  rel: RelationType;
  weight: number;
  desc: string;
}

export interface KgBuild {
  nodes: Map<string, KgNodeRow>;
  edges: KgEdgeRow[];
  adj: Map<string, { nbr: string; edge: KgEdgeRow }[]>;
  actors: Set<string>;
  directors: Set<string>;
  /** 与电影相关边（ACTED_IN / DIRECTED）的参与次数，用于人员节点大小 */
  personMovieTies: Map<string, number>;
}

interface RawNode {
  node_id: string;
  label: string;
  type: string;
  size_score: string;
  year: string;
  vote_average: string;
}

interface RawEdge {
  source: string;
  target: string;
  rel: string;
  weight: string;
  desc?: string;
  edge_desc?: string;
}

/** 将 862.0、147.0 等与节点表中的整型 id 对齐；保留 user_1 等非数字 id */
export function normalizeKgId(raw: string): string {
  const s = String(raw ?? '').trim();
  if (!s) return s;
  if (/^user[_-]/i.test(s)) return s;
  const n = Number(s);
  if (Number.isFinite(n) && /^-?\d+(\.\d+)?$/.test(s)) {
    return String(Math.round(n));
  }
  return s;
}

function parseEntityType(t: string): EntityType | null {
  const x = t.trim() as EntityType;
  if (x === 'Movie' || x === 'Person' || x === 'Genre' || x === 'Company' || x === 'User') return x;
  return null;
}

function parseRel(r: string): RelationType | null {
  const x = r.trim() as RelationType;
  if (
    x === 'ACTED_IN' ||
    x === 'DIRECTED' ||
    x === 'HAS_GENRE' ||
    x === 'PRODUCED_BY' ||
    x === 'RATED'
  ) {
    return x;
  }
  return null;
}

/** 合并导出时同一 node_id 跨类型复用，需拆成独立内部 id（边表按角色 remap） */
const KG_COMPANY_SUFFIX = '__kg_co';
const KG_PERSON_SUFFIX = '__kg_pe';
const KG_MOVIE_SUFFIX = '__kg_mv';

function rawNodeToKgRow(row: RawNode, resolvedId: string): KgNodeRow | null {
  const type = parseEntityType(row.type);
  if (!type) return null;
  const year = row.year?.trim() ? Number(row.year) : null;
  const vote = row.vote_average?.trim() ? Number(row.vote_average) : null;
  return {
    id: resolvedId,
    label: (row.label || resolvedId).trim(),
    type,
    sizeScore: Math.max(0, Number(row.size_score) || 0),
    year: Number.isFinite(year) ? year : null,
    voteAverage: Number.isFinite(vote) ? vote : null,
  };
}

function firstRowOfType(group: RawNode[], type: EntityType): RawNode | undefined {
  return group.find((r) => parseEntityType(r.type) === type);
}

function computeRoleCounts(edgeRows: RawEdge[]): {
  asPersonSrc: Map<string, number>;
  asMovieInv: Map<string, number>;
} {
  const asPersonSrc = new Map<string, number>();
  const asMovieInv = new Map<string, number>();
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const row of edgeRows) {
    if (!row?.source || !row?.target || !row.rel) continue;
    const s = normalizeKgId(row.source);
    const t = normalizeKgId(row.target);
    const rel = parseRel(row.rel);
    if (!rel) continue;
    if (rel === 'ACTED_IN' || rel === 'DIRECTED') {
      bump(asPersonSrc, s);
      bump(asMovieInv, t);
    } else if (rel === 'PRODUCED_BY' || rel === 'HAS_GENRE') {
      bump(asMovieInv, s);
    } else if (rel === 'RATED') {
      bump(asMovieInv, t);
    }
  }
  return { asPersonSrc, asMovieInv };
}

/**
 * 将节点表按 id 分组并消解跨类型复用：
 * - Person+Company / Movie+Company：主体保留原 id，公司 → `${id}${KG_COMPANY_SUFFIX}`，PRODUCED_BY 的 target 重映射。
 * - Person+Movie：按边统计「作人物端次数 / 作影片端次数」较少的一侧改为带后缀 id，并分别 remap 人物 source、影片各角色。
 */
function buildNodeMaps(
  nodeRows: RawNode[],
  roleCounts: { asPersonSrc: Map<string, number>; asMovieInv: Map<string, number> }
): {
  nodes: Map<string, KgNodeRow>;
  producedByCompanyRemap: Map<string, string>;
  idAsPersonRemap: Map<string, string>;
  idAsMovieRemap: Map<string, string>;
} {
  const grouped = new Map<string, RawNode[]>();
  for (const row of nodeRows) {
    if (!row?.node_id || !row.type) continue;
    const id = normalizeKgId(row.node_id);
    if (!id) continue;
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id)!.push(row);
  }

  const nodes = new Map<string, KgNodeRow>();
  const producedByCompanyRemap = new Map<string, string>();
  const idAsPersonRemap = new Map<string, string>();
  const idAsMovieRemap = new Map<string, string>();

  const { asPersonSrc, asMovieInv } = roleCounts;

  const place = (row: RawNode | undefined, resolvedId: string) => {
    if (!row) return;
    const kg = rawNodeToKgRow(row, resolvedId);
    if (kg) nodes.set(resolvedId, kg);
  };

  for (const [id, group] of grouped) {
    if (group.length === 1) {
      const kg = rawNodeToKgRow(group[0], id);
      if (kg) nodes.set(id, kg);
      continue;
    }

    const distinctTypes = new Set(
      group.map((r) => parseEntityType(r.type)).filter((t): t is EntityType => t != null)
    );
    if (distinctTypes.size === 1) {
      const kg = rawNodeToKgRow(group[0], id);
      if (kg) nodes.set(id, kg);
      continue;
    }

    const pr = firstRowOfType(group, 'Person');
    const mr = firstRowOfType(group, 'Movie');
    const cr = firstRowOfType(group, 'Company');
    const gr = firstRowOfType(group, 'Genre');
    const ur = firstRowOfType(group, 'User');

    if (!pr && !mr && !cr) {
      const first = ur ?? gr ?? group[0];
      const kg = rawNodeToKgRow(first, id);
      if (kg) nodes.set(id, kg);
      continue;
    }

    let personId = id;
    let movieId = id;
    const coId = `${id}${KG_COMPANY_SUFFIX}`;
    const hasPM = Boolean(pr && mr);

    if (hasPM) {
      const ps = asPersonSrc.get(id) ?? 0;
      const mv = asMovieInv.get(id) ?? 0;
      if (ps > 0 && mv > 0) {
        if (ps <= mv) {
          personId = `${id}${KG_PERSON_SUFFIX}`;
          movieId = id;
          idAsPersonRemap.set(id, personId);
          idAsMovieRemap.set(id, movieId);
        } else {
          personId = id;
          movieId = `${id}${KG_MOVIE_SUFFIX}`;
          idAsPersonRemap.set(id, personId);
          idAsMovieRemap.set(id, movieId);
        }
      } else if (ps > 0) {
        personId = id;
        movieId = `${id}${KG_MOVIE_SUFFIX}`;
        idAsMovieRemap.set(id, movieId);
      } else if (mv > 0) {
        movieId = id;
        personId = `${id}${KG_PERSON_SUFFIX}`;
        idAsPersonRemap.set(id, personId);
      } else {
        movieId = id;
        personId = `${id}${KG_PERSON_SUFFIX}`;
        idAsPersonRemap.set(id, personId);
        idAsMovieRemap.set(id, movieId);
      }
    }

    if (cr && (pr || mr)) {
      producedByCompanyRemap.set(id, coId);
    }

    if (pr) place(pr, hasPM ? personId : id);
    if (mr) place(mr, hasPM ? movieId : id);
    if (cr) place(cr, cr && (pr || mr) ? coId : id);
    if (gr && !pr && !mr && !cr) place(gr, id);
    if (ur && !pr && !mr && !cr) place(ur, id);
  }

  return { nodes, producedByCompanyRemap, idAsPersonRemap, idAsMovieRemap };
}

export async function fetchKgBuild(): Promise<KgBuild> {
  const [nodeResp, edgeResp] = await Promise.all([
    fetch('/api/kg/nodes'),
    fetch('/api/kg/edges'),
  ]);
  if (!nodeResp.ok) throw new Error('无法加载图谱节点（/api/kg/nodes）');
  if (!edgeResp.ok) throw new Error('无法加载图谱边（/api/kg/edges）');
  const nodeText = await nodeResp.text();
  const edgeText = await edgeResp.text();
  return buildKgFromText(nodeText, edgeText);
}

export function buildKgFromText(nodeText: string, edgeText: string): KgBuild {
  const stripBom = (t: string) => t.replace(/^\uFEFF/, '');
  const nodeRows = Papa.parse<RawNode>(stripBom(nodeText), { header: true, skipEmptyLines: true }).data;
  const edgeRows = Papa.parse<RawEdge>(stripBom(edgeText), { header: true, skipEmptyLines: true }).data;

  const roleCounts = computeRoleCounts(edgeRows);
  const { nodes, producedByCompanyRemap, idAsPersonRemap, idAsMovieRemap } = buildNodeMaps(nodeRows, roleCounts);

  const edges: KgEdgeRow[] = [];
  const actors = new Set<string>();
  const directors = new Set<string>();
  const personMovieTies = new Map<string, number>();

  const bumpPerson = (personId: string) => {
    personMovieTies.set(personId, (personMovieTies.get(personId) ?? 0) + 1);
  };

  for (const row of edgeRows) {
    if (!row?.source || !row?.target || !row.rel) continue;
    let s = normalizeKgId(row.source);
    let t = normalizeKgId(row.target);
    const rel = parseRel(row.rel);
    if (!rel) continue;
    if (rel === 'PRODUCED_BY') {
      const co = producedByCompanyRemap.get(t);
      if (co) t = co;
      s = idAsMovieRemap.get(s) ?? s;
    } else if (rel === 'ACTED_IN' || rel === 'DIRECTED') {
      s = idAsPersonRemap.get(s) ?? s;
      t = idAsMovieRemap.get(t) ?? t;
    } else if (rel === 'HAS_GENRE') {
      s = idAsMovieRemap.get(s) ?? s;
    } else if (rel === 'RATED') {
      t = idAsMovieRemap.get(t) ?? t;
    }
    if (!nodes.has(s) || !nodes.has(t)) continue;
    const weight = Number(row.weight);
    const edge: KgEdgeRow = {
      source: s,
      target: t,
      rel,
      weight: Number.isFinite(weight) ? weight : 1,
      desc: (row.desc ?? row.edge_desc ?? '').trim(),
    };
    edges.push(edge);
    if (rel === 'ACTED_IN') {
      actors.add(s);
      bumpPerson(s);
    } else if (rel === 'DIRECTED') {
      directors.add(s);
      bumpPerson(s);
    }
  }

  const adj = new Map<string, { nbr: string; edge: KgEdgeRow }[]>();
  const addAdj = (a: string, b: string, edge: KgEdgeRow) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push({ nbr: b, edge });
  };
  for (const e of edges) {
    addAdj(e.source, e.target, e);
    addAdj(e.target, e.source, e);
  }

  return { nodes, edges, adj, actors, directors, personMovieTies };
}

export function moviePassesFilters(
  m: KgNodeRow,
  voteMin: number,
  voteMax: number,
  yearMin: number,
  yearMax: number
): boolean {
  if (m.voteAverage != null && (m.voteAverage < voteMin || m.voteAverage > voteMax)) return false;
  if (m.year != null && (m.year < yearMin || m.year > yearMax)) return false;
  return true;
}

/** 中心节点及其在邻接表中的一跳邻居（不考虑过滤，由调用方裁剪） */
export function oneHopIds(kg: KgBuild, centerId: string): Set<string> {
  const out = new Set<string>([centerId]);
  for (const { nbr } of kg.adj.get(centerId) ?? []) out.add(nbr);
  return out;
}
