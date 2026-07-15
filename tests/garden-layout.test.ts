import { describe, expect, it } from 'vitest';
import { hash01, layoutNodes, makeStarfield, shortLabel } from '../src/lib/garden-layout';
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

describe('hash01 / starfield', () => {
  it('is stable and bounded', () => {
    expect(hash01('alpha')).toBe(hash01('alpha'));
    expect(hash01('alpha')).not.toBe(hash01('beta'));
    expect(hash01('alpha')).toBeGreaterThanOrEqual(0);
    expect(hash01('alpha')).toBeLessThan(1);
  });

  it('builds a deterministic starfield', () => {
    const a = makeStarfield(12, 'sky');
    const b = makeStarfield(12, 'sky');
    expect(a).toEqual(b);
    expect(a).toHaveLength(12);
    expect(a[0].x).toBeGreaterThanOrEqual(0);
    expect(a[0].x).toBeLessThanOrEqual(1000);
  });
});

describe('clustered constellation layout', () => {
  it('keeps multi-tag nodes near the canvas center', () => {
    const many: GraphNode[] = Array.from({ length: 8 }, (_, i) => ({
      slug: `n${i}`,
      title: `节点 ${i}`,
      type: i % 3 === 0 ? 'essay' : 'note',
      status: 'growing',
      tags: [i % 2 === 0 ? 'alpha' : 'beta'],
      summary: '',
      date: '2026-07-01T00:00:00.000Z',
    }));
    const pos = layoutNodes(many);
    const xs = Object.values(pos).map((p) => p.x);
    const ys = Object.values(pos).map((p) => p.y);
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
    expect(midX).toBeGreaterThan(350);
    expect(midX).toBeLessThan(650);
    expect(midY).toBeGreaterThan(180);
    expect(midY).toBeLessThan(480);
  });
});
