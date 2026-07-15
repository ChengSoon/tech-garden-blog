import { useMemo } from 'react';
import { clusterCenters, layoutNodes, shortLabel } from '../../lib/garden-layout';
import type { GraphData, GraphNode } from '../../lib/types';

interface Props {
  nodes: GraphNode[];
  graph: GraphData;
  onSelect: (slug: string) => void;
}

export default function GardenMap({ nodes, graph, onSelect }: Props) {
  const positions = useMemo(() => layoutNodes(nodes), [nodes]);
  const clusters = useMemo(() => clusterCenters(nodes, positions), [nodes, positions]);
  const visible = useMemo(() => new Set(nodes.map((node) => node.slug)), [nodes]);
  const edges = graph.edges.filter((edge) => visible.has(edge.source) && visible.has(edge.target));
  return (
    <section className="garden-map" aria-label="知识主题地图">
      <header className="garden-map__intro">
        <p className="eyebrow">Knowledge Map</p>
        <p>节点按内容类型排布，连线来自正文引用。选择节点可查看推荐路径。</p>
      </header>
      <svg viewBox="0 0 1000 640" role="img" aria-label={`${nodes.length} 个知识节点的关系地图`}>
        <g className="garden-map__edges" aria-hidden="true">
          {edges.map((edge) => {
            const source = positions[edge.source];
            const target = positions[edge.target];
            return source && target ? <line key={`${edge.source}-${edge.target}`}
              x1={source.x} y1={source.y} x2={target.x} y2={target.y} /> : null;
          })}
        </g>
        <g className="garden-map__clusters" aria-hidden="true">
          {clusters.map((cluster) => <text key={cluster.key} x={cluster.x} y={cluster.y - 44}>
            #{cluster.key} · {cluster.count}
          </text>)}
        </g>
        <g className="garden-map__nodes">
          {nodes.map((node) => {
            const point = positions[node.slug];
            if (!point) return null;
            return <g key={node.slug} className={`garden-node garden-node--${node.type}`}
              transform={`translate(${point.x} ${point.y})`} role="button" tabIndex={0}
              aria-label={`查看 ${node.title}`} onClick={() => onSelect(node.slug)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault(); onSelect(node.slug);
                }
              }}>
              <title>{node.title}</title><circle r={node.type === 'essay' ? 32 : 25} />
              <text y={node.type === 'essay' ? 48 : 41}>{shortLabel(node.title, 12)}</text>
            </g>;
          })}
        </g>
      </svg>
    </section>
  );
}
