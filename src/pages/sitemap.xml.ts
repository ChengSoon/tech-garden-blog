import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedPosts, postSlug } from '../lib/posts';

function abs(base: string, path: string): string {
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.toString() ?? 'https://example.com').replace(/\/$/, '');
  const posts = await getPublishedPosts();
  const series = await getCollection('series');
  const tags = [...new Set(posts.flatMap((p) => p.data.tags))];

  const paths = [
    '/',
    '/articles/',
    '/garden/',
    '/series/',
    '/about/',
    '/now/',
    '/subscribe/',
    ...posts.map((p) => `/posts/${postSlug(p)}/`),
    ...series.map((s) => `/series/${s.id}/`),
    ...tags.map((t) => `/tags/${encodeURIComponent(t)}/`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (path) => `  <url>
    <loc>${abs(base, path)}</loc>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
