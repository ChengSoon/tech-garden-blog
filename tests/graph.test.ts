import { describe, expect, it } from 'vitest';
import { buildGraph, neighborsOf, rankNeighbors } from '../src/lib/graph';
import type { GraphNode } from '../src/lib/types';

const nodes: GraphNode[] = [
  { slug: 'a', title: 'A', type: 'essay', status: 'evergreen', tags: ['t'], summary: 'a', date: '2026-07-01T00:00:00.000Z' },
  { slug: 'b', title: 'B', type: 'note', status: 'growing', tags: ['t'], summary: 'b', date: '2026-07-01T00:00:00.000Z' },
  { slug: 'c', title: 'C', type: 'note', status: 'seedling', tags: ['x'], summary: 'c', date: '2026-07-01T00:00:00.000Z' },
];

describe('buildGraph', () => {
  it('builds edges and backlinks from outbound map', () => {
    const outbound = { a: ['b', 'c'], b: ['a'], c: [] as string[] };
    const g = buildGraph(nodes, outbound);
    expect(g.edges).toEqual(
      expect.arrayContaining([
        { source: 'a', target: 'b' },
        { source: 'a', target: 'c' },
      ]),
    );
    expect(g.backlinks.b).toContain('a');
    expect(g.backlinks.a).toContain('b');
  });

  it('drops edges to missing nodes', () => {
    const g = buildGraph(nodes, { a: ['missing', 'b'] });
    expect(g.edges).toEqual([{ source: 'a', target: 'b' }]);
  });
});

describe('neighborsOf', () => {
  it('returns unique neighbor slugs', () => {
    const g = buildGraph(nodes, { a: ['b'], b: ['c'], c: [] });
    expect(neighborsOf('b', g).sort()).toEqual(['a', 'c']);
  });
});

describe('rankNeighbors', () => {
  it('explains and ranks links before series and shared tags', () => {
    const rankedNodes: GraphNode[] = [
      { ...nodes[0], series: 'guide' },
      { ...nodes[1], tags: ['other'] },
      { ...nodes[2], series: 'guide' },
      {
        slug: 'd',
        title: 'D',
        type: 'note',
        status: 'growing',
        tags: ['t'],
        summary: 'd',
        date: '2026-07-02T00:00:00.000Z',
      },
    ];
    const graph = buildGraph(rankedNodes, { a: ['b'] });

    expect(rankNeighbors('a', graph)).toEqual([
      { slug: 'b', score: 100, reasons: ['link'] },
      { slug: 'c', score: 50, reasons: ['series'] },
      { slug: 'd', score: 10, reasons: ['tag'] },
    ]);
  });
});
