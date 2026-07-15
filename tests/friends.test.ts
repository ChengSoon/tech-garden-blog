import { describe, expect, it } from 'vitest';
import {
  categoryLabel,
  friendExchange,
  friendMonogram,
  friendsByCategory,
  type Friend,
} from '../src/lib/friends';

const sample: Friend = {
  id: 't',
  name: '轨道日志',
  url: 'https://example.com',
  description: 'x',
  category: 'regular',
  tags: [],
  order: 0,
};

const list: Friend[] = [
  sample,
  {
    id: 'a',
    name: '同频站',
    url: 'https://example.org',
    description: 'y',
    category: 'affinity',
    tags: ['笔记'],
    order: 1,
  },
];

describe('friends helpers', () => {
  it('uses explicit monogram when provided', () => {
    expect(friendMonogram({ ...sample, monogram: '轨' })).toBe('轨');
  });

  it('falls back to first character of name', () => {
    expect(friendMonogram(sample)).toBe('轨');
  });

  it('filters friends by category', () => {
    const regular = friendsByCategory(list, 'regular');
    expect(regular).toHaveLength(1);
    expect(regular[0].id).toBe('t');
    expect(friendsByCategory(list, 'all')).toHaveLength(2);
  });

  it('maps category labels', () => {
    expect(categoryLabel('affinity')).toBe('同频');
  });

  it('points issue submissions to the blog repo', () => {
    expect(friendExchange.issuesUrl).toBe(
      'https://github.com/ChengSoon/tech-garden-blog/issues',
    );
  });
});
