import type { GraphData, GraphEdge, GraphNode } from './types';

export function buildGraph(
  nodes: GraphNode[],
  outbound: Record<string, string[]>,
): GraphData {
  const slugs = new Set(nodes.map((n) => n.slug));
  const edgeKey = new Set<string>();
  const edges: GraphEdge[] = [];
  const backlinks: Record<string, string[]> = Object.fromEntries(
    nodes.map((n) => [n.slug, [] as string[]]),
  );

  for (const [source, targets] of Object.entries(outbound)) {
    if (!slugs.has(source)) continue;
    for (const target of targets) {
      if (!slugs.has(target)) continue;
      const key = [source, target].sort().join('->');
      if (!edgeKey.has(key)) {
        edgeKey.add(key);
        edges.push({ source, target });
      }
      if (!backlinks[target].includes(source)) {
        backlinks[target].push(source);
      }
    }
  }

  return { nodes, edges, backlinks };
}

export function neighborsOf(slug: string, graph: GraphData, limit = 6): string[] {
  const set = new Set<string>();
  for (const e of graph.edges) {
    if (e.source === slug) set.add(e.target);
    if (e.target === slug) set.add(e.source);
  }
  for (const b of graph.backlinks[slug] ?? []) set.add(b);
  return [...set].filter((s) => s !== slug).slice(0, limit);
}
