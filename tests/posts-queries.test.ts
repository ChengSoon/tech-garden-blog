import { describe, expect, it } from 'vitest';
import {
  autoReadingPathsFromTags,
  resolveReadingPaths,
} from '../src/lib/reading-paths';
import {
  pickFeaturedPosts,
  pickLeadPost,
  deriveTopics,
  type PostLike,
} from '../src/lib/post-select';

function mockPost(
  id: string,
  data: Partial<PostLike['data']> & Pick<PostLike['data'], 'title' | 'summary' | 'date' | 'type'>,
): PostLike {
  return {
    id,
    data: {
      status: 'growing',
      tags: [],
      featured: false,
      lead: false,
      ...data,
    },
  };
}

const sample: PostLike[] = [
  mockPost('old-note', {
    title: '旧笔记',
    summary: '',
    date: new Date('2026-01-01'),
    type: 'note',
    tags: ['meta'],
  }),
  mockPost('ai-guide', {
    title: 'AI 指南',
    summary: '',
    date: new Date('2026-07-15'),
    type: 'essay',
    tags: ['ai', 'guide'],
    featured: true,
    featuredOrder: 1,
    lead: true,
  }),
  mockPost('side-essay', {
    title: '另一篇',
    summary: '',
    date: new Date('2026-07-10'),
    type: 'essay',
    tags: ['ai'],
    featured: true,
    featuredOrder: 2,
  }),
];

describe('pickFeaturedPosts / pickLeadPost', () => {
  it('orders featured by featuredOrder', () => {
    expect(pickFeaturedPosts(sample).map((p) => p.id)).toEqual(['ai-guide', 'side-essay']);
  });

  it('prefers lead for hero', () => {
    expect(pickLeadPost(sample)?.id).toBe('ai-guide');
  });

  it('falls back when nothing marked', () => {
    const plain = sample.map((p) =>
      mockPost(p.id, { ...p.data, featured: false, lead: false }),
    );
    expect(pickFeaturedPosts(plain, 1)[0]?.id).toBe('ai-guide');
    expect(pickLeadPost(plain)?.id).toBe('ai-guide');
  });
});

describe('deriveTopics / auto paths', () => {
  it('uses preferred interests when provided', () => {
    expect(deriveTopics(sample, ['系统设计', 'AI'], 2)).toEqual(['系统设计', 'AI']);
  });

  it('derives topics from tags when preferred empty', () => {
    expect(deriveTopics(sample, [], 2)).toEqual(['ai', 'guide']);
  });

  it('builds tag paths with published slugs only', () => {
    const defs = autoReadingPathsFromTags(sample, 2, 2);
    const items = new Map(sample.map((p) => [p.id, p]));
    const resolved = resolveReadingPaths(defs, items);
    expect(resolved.length).toBeGreaterThan(0);
    expect(resolved.every((p) => p.items.length > 0)).toBe(true);
  });
});
