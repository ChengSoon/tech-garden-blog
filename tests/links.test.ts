import { describe, expect, it } from 'vitest';
import { extractPostLinks, mergeLinks } from '../src/lib/links';

describe('extractPostLinks', () => {
  it('extracts /posts/slug links from markdown', () => {
    const md = 'See [A](/posts/alpha) and [B](/posts/beta/).';
    expect(extractPostLinks(md).sort()).toEqual(['alpha', 'beta']);
  });

  it('ignores external and non-post links', () => {
    const md = '[x](https://example.com) [y](/about) [z](/posts/ok)';
    expect(extractPostLinks(md)).toEqual(['ok']);
  });
});

describe('mergeLinks', () => {
  it('dedupes body and frontmatter links', () => {
    expect(mergeLinks(['a', 'b'], ['b', 'c']).sort()).toEqual(['a', 'b', 'c']);
  });
});
