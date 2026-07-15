import type {
  GraphData,
  GraphEdge,
  GraphNode,
  RankedNeighbor,
  RelationReason,
} from './types';

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

function nodeDate(slug: string, graph: GraphData): number {
  const date = graph.nodes.find((node) => node.slug === slug)?.date;
  return date ? Date.parse(date) : 0;
}

function scoreNeighbor(origin: GraphNode, node: GraphNode, linked: Set<string>) {
  const reasons: RelationReason[] = [];
  let score = 0;

  if (linked.has(node.slug)) {
    reasons.push('link');
    score += 100;
  }
  if (origin.series && node.series === origin.series) {
    reasons.push('series');
    score += 50;
  }
  const sharedTagCount = node.tags.filter((tag) => origin.tags.includes(tag)).length;
  if (sharedTagCount) {
    reasons.push('tag');
    score += sharedTagCount * 10;
  }
  return { slug: node.slug, score, reasons };
}

export function rankNeighbors(
  slug: string,
  graph: GraphData,
  limit = 6,
): RankedNeighbor[] {
  const origin = graph.nodes.find((node) => node.slug === slug);
  if (!origin) return [];
  const linked = new Set(neighborsOf(slug, graph, graph.nodes.length));

  return graph.nodes
    .filter((node) => node.slug !== slug)
    .map((node) => scoreNeighbor(origin, node, linked))
    .filter((neighbor) => neighbor.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        nodeDate(right.slug, graph) - nodeDate(left.slug, graph),
    )
    .slice(0, limit);
}
