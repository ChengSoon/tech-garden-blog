import { describe, expect, it } from 'vitest';
import { layoutNodes, shortLabel } from '../src/lib/garden-layout';
import type { GraphNode } from '../src/lib/types';

const nodes: GraphNode[] = [
  { slug: 'a', title: '欢迎来到这座技术刊', type: 'essay', status: 'evergreen', tags: ['meta'], summary: '', date: '2026-07-01T00:00:00.000Z' },
  { slug: 'b', title: '图谱基础：节点、边与反链', type: 'note', status: 'growing', tags: ['garden'], summary: '', date: '2026-07-01T00:00:00.000Z' },
  { slug: 'c', title: '阅读版式：72ch 与章节轨', type: 'note', status: 'growing', tags: ['meta'], summary: '', date: '2026-07-01T00:00:00.000Z' },
  { slug: 'd', title: 'Astro 岛屿：静态骨、交互皮', type: 'note', status: 'seedling', tags: ['garden'], summary: '', date: '2026-07-01T00:00:00.000Z' },
];

describe('shortLabel', () => {
  it('truncates long CJK titles', () => {
    expect(shortLabel('欢迎来到这座技术刊', 6)).toBe('欢迎来到这座…');
  });
});

describe('layoutNodes', () => {
  it('centers the constellation in the viewbox', () => {
    const pos = layoutNodes(nodes);
    expect(Object.keys(pos)).toHaveLength(4);
    const xs = Object.values(pos).map((p) => p.x);
    const ys = Object.values(pos).map((p) => p.y);
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
    // should sit near canvas center (500, ~328)
    expect(midX).toBeGreaterThan(400);
    expect(midX).toBeLessThan(600);
    expect(midY).toBeGreaterThan(200);
    expect(midY).toBeLessThan(450);
  });

  it('keeps nodes separated on the ring', () => {
    const pos = layoutNodes(nodes);
    const pairs: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = pos[nodes[i].slug];
        const b = pos[nodes[j].slug];
        pairs.push(Math.hypot(a.x - b.x, a.y - b.y));
      }
    }
    expect(Math.min(...pairs)).toBeGreaterThan(120);
  });
});
