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

export function rankSearch(
  documents: SearchDocument[],
  query: string,
): RankedSearchDocument[] {
  const normalizedQuery = normalize(query.trim());
  if (!normalizedQuery) return [];

  return documents
    .map((document) => ({
      ...document,
      score: scoreDocument(document, normalizedQuery),
    }))
    .filter((document) => document.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.title.localeCompare(right.title, 'zh-CN'),
    );
}
