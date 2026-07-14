import type { GraphNode } from './types';

export interface Point {
  x: number;
  y: number;
}

/** Truncate carefully for compact chips (full title still in aria/title). */
export function shortLabel(title: string, max = 14): string {
  const chars = [...title];
  if (chars.length <= max) return title;
  return `${chars.slice(0, max).join('')}…`;
}

/**
 * Centered orbital layout in a fixed coordinate space (0..1000 × 0..640).
 * - 1 node: center
 * - 2–8: single ring
 * - 9+: essays on outer ring, notes on inner (or balanced split)
 */
export function layoutNodes(nodes: GraphNode[]): Record<string, Point> {
  const W = 1000;
  const H = 640;
  const cx = W / 2;
  const cy = H / 2 + 8;
  const pos: Record<string, Point> = {};

  if (nodes.length === 0) return pos;

  if (nodes.length === 1) {
    pos[nodes[0].slug] = { x: cx, y: cy };
    return pos;
  }

  if (nodes.length <= 8) {
    const r = nodes.length <= 3 ? 168 : nodes.length <= 5 ? 200 : 228;
    placeOnRing(nodes, pos, cx, cy, r, -Math.PI / 2);
    return pos;
  }

  const essays = nodes.filter((n) => n.type === 'essay');
  const notes = nodes.filter((n) => n.type !== 'essay');
  // Prefer type rings; fall back to half-split if one type empty
  const outer = essays.length ? essays : nodes.slice(0, Math.ceil(nodes.length / 2));
  const inner = essays.length ? notes : nodes.slice(Math.ceil(nodes.length / 2));

  if (outer.length) placeOnRing(outer, pos, cx, cy, 250, -Math.PI / 2);
  if (inner.length) placeOnRing(inner, pos, cx, cy, 150, -Math.PI / 2 + 0.35);

  // any missing (shouldn't) put center-adjacent
  for (const n of nodes) {
    if (!pos[n.slug]) pos[n.slug] = { x: cx, y: cy };
  }
  return pos;
}

function placeOnRing(
  list: GraphNode[],
  pos: Record<string, Point>,
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
) {
  const n = list.length;
  // Slight vertical squash so stage feels wider / more editorial
  const ry = r * 0.86;
  list.forEach((node, i) => {
    const a = startAngle + (i / n) * Math.PI * 2;
    pos[node.slug] = {
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * ry,
    };
  });
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

export const GARDEN_VIEWBOX = { w: 1000, h: 640, cx: 500, cy: 328 };
