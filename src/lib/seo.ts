/**
 * 分享元数据与 JSON-LD 纯函数（构建期 / 布局使用）。
 */

export function absoluteUrl(base: string | URL | undefined | null, pathOrUrl: string): string {
  const rawBase = (base?.toString() ?? 'https://blog.lzch.eu.org').replace(/\/$/, '');
  const value = pathOrUrl.trim();
  if (!value) return `${rawBase}/`;
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${rawBase}${path}`;
}

export function websiteJsonLd(input: {
  origin: string;
  name: string;
  description: string;
  authorName: string;
  authorUrl: string;
}) {
  const origin = input.origin.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url: `${origin}/`,
    description: input.description,
    author: {
      '@type': 'Person',
      name: input.authorName,
      url: input.authorUrl,
    },
  };
}

export function personJsonLd(input: {
  name: string;
  jobTitle?: string;
  url: string;
  image?: string;
  sameAs?: string[];
  description?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: input.name,
    ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    url: input.url,
    ...(input.image ? { image: input.image } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };
}

export function blogPostingJsonLd(input: {
  headline: string;
  description: string;
  datePublished: string | Date;
  url: string;
  image?: string;
  authorName: string;
  authorUrl?: string;
}) {
  const date =
    input.datePublished instanceof Date
      ? input.datePublished.toISOString()
      : input.datePublished;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    datePublished: date,
    mainEntityOfPage: input.url,
    url: input.url,
    ...(input.image ? { image: [input.image] } : {}),
    author: {
      '@type': 'Person',
      name: input.authorName,
      ...(input.authorUrl ? { url: input.authorUrl } : {}),
    },
  };
}

export type JsonLd = Record<string, unknown>;

export function jsonLdScriptContent(nodes: JsonLd | JsonLd[]): string {
  const payload = Array.isArray(nodes) ? nodes : [nodes];
  return JSON.stringify(payload.length === 1 ? payload[0] : payload);
}
