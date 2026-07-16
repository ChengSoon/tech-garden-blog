import type { PostType } from './types';

export interface SearchDocument {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  type: PostType;
  body: string;
}

export interface RankedSearchDocument extends SearchDocument {
  score: number;
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('zh-CN');
}

export function stripMarkdown(value: string): string {
  return value
    .replace(/```[^\n]*\n?/g, ' ')
    .replace(/```/g, ' ')
    .replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, '$1')
    .replace(/[`*_>#~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreDocument(document: SearchDocument, query: string): number {
  const title = normalize(document.title);
  const summary = normalize(document.summary);
  const body = normalize(document.body);
  const tagHit = document.tags.some((tag) => normalize(tag).includes(query));

  return (
    (title.includes(query) ? 100 : 0) +
    (tagHit ? 60 : 0) +
    (summary.includes(query) ? 30 : 0) +
    (body.includes(query) ? 10 : 0)
  );
}

function tokenizeQuery(query: string): string[] {
  return normalize(query)
    .split(/[\s,，、/+|]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function rankSearch(
  documents: SearchDocument[],
  query: string,
): RankedSearchDocument[] {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return [];

  return documents
    .map((document) => {
      const score = tokens.reduce((sum, token) => sum + scoreDocument(document, token), 0);
      // 全部 token 至少命中一次时给予额外加权，避免“只沾边一个词”排太前
      const haystack = normalize(
        `${document.title} ${document.summary} ${document.tags.join(' ')} ${document.body}`,
      );
      const covered = tokens.filter((token) => haystack.includes(token)).length;
      const coverageBonus = covered === tokens.length ? 40 : covered * 5;
      return {
        ...document,
        score: score + coverageBonus,
      };
    })
    .filter((document) => document.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.title.localeCompare(right.title, 'zh-CN'),
    );
}
