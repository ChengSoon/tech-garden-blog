import { describe, expect, it } from 'vitest';
import {
  absoluteUrl,
  blogPostingJsonLd,
  jsonLdScriptContent,
  personJsonLd,
  websiteJsonLd,
} from '../src/lib/seo';

describe('absoluteUrl', () => {
  it('joins relative paths to origin', () => {
    expect(absoluteUrl('https://blog.lzch.eu.org', '/avatar.webp')).toBe(
      'https://blog.lzch.eu.org/avatar.webp',
    );
    expect(absoluteUrl('https://blog.lzch.eu.org/', 'covers/a.svg')).toBe(
      'https://blog.lzch.eu.org/covers/a.svg',
    );
  });

  it('keeps absolute http(s) urls', () => {
    expect(absoluteUrl('https://blog.lzch.eu.org', 'https://cdn.example/x.png')).toBe(
      'https://cdn.example/x.png',
    );
  });

  it('normalizes empty path to site root', () => {
    expect(absoluteUrl('https://blog.lzch.eu.org', '')).toBe('https://blog.lzch.eu.org/');
  });
});

describe('json-ld builders', () => {
  it('builds website and person nodes', () => {
    const site = websiteJsonLd({
      origin: 'https://blog.lzch.eu.org',
      name: 'Cheng · 技术刊',
      description: 'tagline',
      authorName: 'Cheng',
      authorUrl: 'https://blog.lzch.eu.org/about/',
    });
    expect(site['@type']).toBe('WebSite');
    expect(site.url).toBe('https://blog.lzch.eu.org/');

    const person = personJsonLd({
      name: 'Cheng',
      jobTitle: 'Engineer / Writer',
      url: 'https://blog.lzch.eu.org/about/',
      sameAs: ['https://github.com/ChengSoon'],
    });
    expect(person['@type']).toBe('Person');
    expect(person.sameAs).toEqual(['https://github.com/ChengSoon']);
  });

  it('builds blog posting with ISO date', () => {
    const post = blogPostingJsonLd({
      headline: '标题',
      description: '摘要',
      datePublished: new Date('2026-07-15T00:00:00.000Z'),
      url: 'https://blog.lzch.eu.org/posts/x/',
      image: 'https://blog.lzch.eu.org/covers/x.svg',
      authorName: 'Cheng',
    });
    expect(post['@type']).toBe('BlogPosting');
    expect(post.datePublished).toBe('2026-07-15T00:00:00.000Z');
    expect(post.image).toEqual(['https://blog.lzch.eu.org/covers/x.svg']);
  });

  it('stringifies single node without wrapping array', () => {
    const raw = jsonLdScriptContent({ '@type': 'WebSite', name: 'x' });
    expect(JSON.parse(raw)).toEqual({ '@type': 'WebSite', name: 'x' });
  });
});
