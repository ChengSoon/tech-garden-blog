export type PostType = 'essay' | 'note';
export type GrowthStatus = 'seedling' | 'growing' | 'evergreen';
export type RelationReason = 'link' | 'series' | 'tag';

export interface RankedNeighbor {
  slug: string;
  score: number;
  reasons: RelationReason[];
}

export interface GraphNode {
  slug: string;
  title: string;
  type: PostType;
  status: GrowthStatus;
  tags: string[];
  summary: string;
  series?: string;
  /** ISO date string for timeline sorting/display */
  date: string;
}

export type NeighborNode = GraphNode & Pick<RankedNeighbor, 'score' | 'reasons'>;

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  backlinks: Record<string, string[]>;
}

export interface SearchItem {
  slug: string;
  title: string;
  tags: string[];
  summary: string;
  type: PostType;
}
