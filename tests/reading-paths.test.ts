import { describe, expect, it } from 'vitest';
import { resolveReadingPaths } from '../src/lib/reading-paths';

const paths = [
  {
    id: 'systems',
    title: '构建系统',
    description: '从架构到实现',
    slugs: ['a', 'missing', 'b'],
  },
  {
    id: 'empty',
    title: '空路径',
    description: '应被过滤',
    slugs: ['missing'],
  },
];

const items = new Map([
  ['a', { slug: 'a', title: 'A' }],
  ['b', { slug: 'b', title: 'B' }],
]);

describe('resolveReadingPaths', () => {
  it('keeps curated order and drops missing slugs', () => {
    expect(resolveReadingPaths(paths, items)[0].items.map((item) => item.slug)).toEqual([
      'a',
      'b',
    ]);
  });

  it('drops paths with no published items', () => {
    expect(resolveReadingPaths(paths, items).map((path) => path.id)).toEqual(['systems']);
  });
});
