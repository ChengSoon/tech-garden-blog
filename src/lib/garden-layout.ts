import type { GraphNode } from './types';

export interface Point {
  x: number;
  y: number;
}

export const GARDEN_VIEWBOX = { w: 1000, h: 640, cx: 500, cy: 328 };

/** Truncate carefully for compact chips (full title still in aria/title). */
export function shortLabel(title: string, max = 14): string {
  const chars = [...title];
  if (chars.length <= max) return title;
  return `${chars.slice(0, max).join('')}…`;
}

/** Stable 0..1 hash from string (layout jitter / starfield). */
export function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

/**
 * Constellation layout in fixed coordinate space (0..1000 × 0..640).
 * Nodes cluster by primary tag; within a cluster they form irregular
 * star polygons rather than perfect geometric rings.
 */
export function layoutNodes(nodes: GraphNode[]): Record<string, Point> {
  const { w: W, h: H, cx, cy } = GARDEN_VIEWBOX;
  const pos: Record<string, Point> = {};

  if (nodes.length === 0) return pos;

  if (nodes.length === 1) {
    pos[nodes[0].slug] = { x: cx, y: cy };
    return pos;
  }

  const groups = groupByPrimaryTag(nodes);
  const keys = [...groups.keys()].sort((a, b) => {
    const diff = (groups.get(b)?.length ?? 0) - (groups.get(a)?.length ?? 0);
    return diff !== 0 ? diff : a.localeCompare(b, 'zh-CN');
  });

  // Single theme or very few nodes: one irregular constellation.
  if (keys.length === 1 || nodes.length <= 3) {
    placeConstellation(nodes, pos, cx, cy, nodes.length <= 3 ? 175 : 210);
    return clampAll(pos, W, H);
  }

  // Multiple themes: each tag is its own small constellation.
  const clusterR = keys.length <= 2 ? 168 : keys.length <= 4 ? 210 : 235;
  keys.forEach((key, i) => {
    const list = groups.get(key) ?? [];
    const a = -Math.PI / 2 + (i / keys.length) * Math.PI * 2 + hash01(key) * 0.28;
    const jitter = 18 + hash01(`c:${key}`) * 24;
    const centerX = cx + Math.cos(a) * (clusterR + jitter * 0.35);
    const centerY = cy + Math.sin(a) * (clusterR * 0.82 + jitter * 0.2);
    const localR = list.length === 1 ? 0 : list.length === 2 ? 72 : list.length <= 4 ? 96 : 118;
    placeConstellation(list, pos, centerX, centerY, localR);
  });

  return clampAll(pos, W, H);
}

function groupByPrimaryTag(nodes: GraphNode[]): Map<string, GraphNode[]> {
  const map = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    const key = node.tags[0] ?? 'misc';
    const list = map.get(key) ?? [];
    list.push(node);
    map.set(key, list);
  }
  // Stable order inside cluster: essays first, then slug
  for (const [key, list] of map) {
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'essay' ? -1 : 1;
      return a.slug.localeCompare(b.slug);
    });
    map.set(key, list);
  }
  return map;
}

/** Irregular polygon around a center — looks like a real star group. */
function placeConstellation(
  list: GraphNode[],
  pos: Record<string, Point>,
  cx: number,
  cy: number,
  baseR: number,
) {
  const n = list.length;
  if (n === 1) {
    pos[list[0].slug] = {
      x: cx + (hash01(list[0].slug) - 0.5) * 12,
      y: cy + (hash01(`${list[0].slug}:y`) - 0.5) * 12,
    };
    return;
  }

  const start = -Math.PI / 2 + hash01(list.map((n) => n.slug).join('|')) * 0.9;
  list.forEach((node, i) => {
    const base = start + (i / n) * Math.PI * 2;
    // Angular + radial jitter so edges aren't a regular polygon
    const angJitter = (hash01(`${node.slug}:a`) - 0.5) * (Math.PI * 2) / n * 0.55;
    const rScale = 0.72 + hash01(`${node.slug}:r`) * 0.48;
    // Essays sit slightly brighter / outer
    const typeBoost = node.type === 'essay' ? 1.08 : 1;
    const r = Math.max(42, baseR * rScale * typeBoost);
    const a = base + angJitter;
    const squash = 0.88;
    pos[node.slug] = {
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r * squash,
    };
  });

  // Soft separation pass so labels don't collide
  separate(list, pos, 128);
}

function separate(list: GraphNode[], pos: Record<string, Point>, minDist: number) {
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = pos[list[i].slug];
        const b = pos[list[j].slug];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        if (d >= minDist) continue;
        const push = ((minDist - d) / 2) * 0.85;
        const ux = dx / d;
        const uy = dy / d;
        a.x -= ux * push;
        a.y -= uy * push;
        b.x += ux * push;
        b.y += uy * push;
      }
    }
  }
}

function clampAll(pos: Record<string, Point>, W: number, H: number): Record<string, Point> {
  const pad = 56;
  for (const p of Object.values(pos)) {
    p.x = Math.min(W - pad, Math.max(pad, p.x));
    p.y = Math.min(H - pad, Math.max(pad, p.y));
  }
  return pos;
}

export function clusterCenters(
  nodes: GraphNode[],
  pos: Record<string, Point>,
): { key: string; x: number; y: number; count: number }[] {
  const map = new Map<string, { x: number; y: number; n: number }>();
  for (const n of nodes) {
    const key = n.tags[0] ?? 'misc';
    const p = pos[n.slug];
    if (!p) continue;
    const cur = map.get(key) ?? { x: 0, y: 0, n: 0 };
    map.set(key, { x: cur.x + p.x, y: cur.y + p.y, n: cur.n + 1 });
  }
  return [...map.entries()].map(([key, v]) => ({
    key,
    x: v.x / v.n,
    y: v.y / v.n,
    count: v.n,
  }));
}

/** Deterministic background starfield for constellation canvas. */
export function makeStarfield(
  count = 64,
  seed = 'garden-sky',
): { x: number; y: number; r: number; o: number; delay: number }[] {
  const { w, h } = GARDEN_VIEWBOX;
  const stars = [];
  for (let i = 0; i < count; i++) {
    const s = `${seed}:${i}`;
    stars.push({
      x: hash01(`${s}:x`) * w,
      y: hash01(`${s}:y`) * h,
      r: 0.6 + hash01(`${s}:r`) * 1.8,
      o: 0.18 + hash01(`${s}:o`) * 0.55,
      delay: hash01(`${s}:d`) * 4.5,
    });
  }
  return stars;
}
