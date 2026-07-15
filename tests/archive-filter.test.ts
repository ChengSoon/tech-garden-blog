import { describe, expect, it } from 'vitest';
import { filterArchiveItems } from '../src/lib/archive-filter';

const items = [
  { slug: 'a', type: 'essay', status: 'growing', tags: ['tag-a'], year: 2026 },
  { slug: 'b', type: 'note', status: 'seedling', tags: ['tag-b'], year: 2025 },
];

describe('filterArchiveItems', () => {
  it('combines filters', () => {
    expect(filterArchiveItems(items, { type: 'essay', year: 2026 }, [])).toEqual([items[0]]);
  });

  it('keeps all items without filters', () => {
    expect(filterArchiveItems(items, {}, [])).toEqual(items);
  });

  it('filters saved items', () => {
    expect(filterArchiveItems(items, { savedOnly: true }, ['b'])).toEqual([items[1]]);
  });
});
