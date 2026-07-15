import { buildGraph } from './graph';
import { extractPostLinks, mergeLinks } from './links';
import { getPublishedPosts, postSlug } from './posts';
import type { GraphData, GraphNode } from './types';

export async function getGraph(): Promise<GraphData> {
  const posts = await getPublishedPosts();
  const nodes: GraphNode[] = posts.map((p) => ({
    slug: postSlug(p),
    title: p.data.title,
    type: p.data.type,
    status: p.data.status,
    tags: p.data.tags,
    summary: p.data.summary,
    series: p.data.series,
    date: p.data.date.toISOString(),
  }));

  const outbound: Record<string, string[]> = {};
  for (const p of posts) {
    const slug = postSlug(p);
    const body = typeof p.body === 'string' ? p.body : '';
    outbound[slug] = mergeLinks(extractPostLinks(body), p.data.links ?? []);
  }
  return buildGraph(nodes, outbound);
}
