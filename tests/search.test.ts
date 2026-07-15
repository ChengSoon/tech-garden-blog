import { describe, expect, it } from 'vitest';
import { rankSearch, stripMarkdown } from '../src/lib/search';

const documents = [
  {
    slug: 'title',
    title: 'Astro 岛屿',
    summary: '架构',
    tags: ['web'],
    type: 'essay' as const,
    body: '普通正文',
  },
  {
    slug: 'body',
    title: '其他文章',
    summary: '说明',
    tags: ['notes'],
    type: 'note' as const,
    body: '正文提到 Astro 岛屿',
  },
];

describe('stripMarkdown', () => {
  it('removes links, code fences, and heading markers', () => {
    const markdown = '# 标题\n[链接](/posts/a)\n```ts\nconst a = 1\n```';
    expect(stripMarkdown(markdown)).toBe('标题 链接 const a = 1');
  });
});

describe('rankSearch', () => {
  it('ranks title hits before body hits', () => {
    expect(rankSearch(documents, 'Astro').map((item) => item.slug)).toEqual([
      'title',
      'body',
    ]);
  });

  it('returns no items for a blank query', () => {
    expect(rankSearch(documents, '  ')).toEqual([]);
  });
});
