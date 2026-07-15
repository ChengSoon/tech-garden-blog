import { useEffect, useMemo, useState } from 'react';
import {
  clusterCenters,
  GARDEN_VIEWBOX,
  hash01,
  layoutNodes,
  makeStarfield,
  shortLabel,
} from '../../lib/garden-layout';
import type { GraphData, GraphNode } from '../../lib/types';

interface Props {
  nodes: GraphNode[];
  graph: GraphData;
  onSelect: (slug: string) => void;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function GardenMap({ nodes, graph, onSelect }: Props) {
  const reduced = usePrefersReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  const positions = useMemo(() => layoutNodes(nodes), [nodes]);
  const clusters = useMemo(
    () => clusterCenters(nodes, positions),
    [nodes, positions],
  );
  const visible = useMemo(() => new Set(nodes.map((node) => node.slug)), [nodes]);
  const edges = useMemo(
    () => graph.edges.filter((edge) => visible.has(edge.source) && visible.has(edge.target)),
    [graph.edges, visible],
  );
  const starfield = useMemo(() => makeStarfield(78), []);

  const linked = useMemo(() => {
    if (!hovered) return new Set<string>();
    const set = new Set<string>([hovered]);
    for (const edge of edges) {
      if (edge.source === hovered) set.add(edge.target);
      if (edge.target === hovered) set.add(edge.source);
    }
    return set;
  }, [edges, hovered]);

  return (
    <section
      className={`garden-map${reduced ? ' garden-map--static' : ''}`}
      aria-label="知识星座图"
    >
      <header className="garden-map__intro">
        <div>
          <p className="eyebrow">Constellation</p>
          <p>主题聚成星座，连线来自正文引用。悬停可点亮邻近星轨。</p>
        </div>
        <p className="garden-map__hint" aria-hidden="true">
          {nodes.length} 星 · {edges.length} 轨
        </p>
      </header>
      <div className="garden-map__stage">
        <svg
          viewBox={`0 0 ${GARDEN_VIEWBOX.w} ${GARDEN_VIEWBOX.h}`}
          role="img"
          aria-label={`${nodes.length} 个知识节点的星座关系图`}
        >
          <defs>
            <radialGradient id="garden-sky" cx="50%" cy="42%" r="68%">
              <stop offset="0%" stopColor="#1a2822" />
              <stop offset="55%" stopColor="#0f1613" />
              <stop offset="100%" stopColor="#080c0a" />
            </radialGradient>
            <radialGradient id="star-glow-accent" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
              <stop offset="40%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="star-glow-signal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.95" />
              <stop offset="40%" stopColor="var(--signal)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
            </radialGradient>
            <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="star-bloom" x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            className="garden-map__sky"
            width={GARDEN_VIEWBOX.w}
            height={GARDEN_VIEWBOX.h}
            fill="url(#garden-sky)"
          />

          <g className="garden-map__guides" aria-hidden="true">
            <circle
              className="garden-map__orbit garden-map__orbit--outer"
              cx={GARDEN_VIEWBOX.cx}
              cy={GARDEN_VIEWBOX.cy}
              r={210}
              fill="none"
            />
            <circle
              className="garden-map__orbit garden-map__orbit--inner"
              cx={GARDEN_VIEWBOX.cx}
              cy={GARDEN_VIEWBOX.cy}
              r={120}
              fill="none"
            />
            <line
              x1={GARDEN_VIEWBOX.cx}
              y1={48}
              x2={GARDEN_VIEWBOX.cx}
              y2={GARDEN_VIEWBOX.h - 48}
            />
            <line
              x1={72}
              y1={GARDEN_VIEWBOX.cy}
              x2={GARDEN_VIEWBOX.w - 72}
              y2={GARDEN_VIEWBOX.cy}
            />
          </g>

          <g className="garden-map__starfield" aria-hidden="true">
            {starfield.map((star, i) => (
              <circle
                key={i}
                className="garden-map__dust"
                cx={star.x}
                cy={star.y}
                r={star.r}
                style={{
                  ['--dust-o' as string]: String(star.o),
                  animationDelay: `${star.delay}s`,
                  animationDuration: `${3.2 + hash01(`dur:${i}`) * 3.8}s`,
                }}
              />
            ))}
          </g>

          {/* Living layer: whole constellation drifts so edges stay locked to stars */}
          <g className="garden-map__living">
            <g className="garden-map__edges" aria-hidden="true" filter="url(#edge-glow)">
              {edges.map((edge, index) => {
                const source = positions[edge.source];
                const target = positions[edge.target];
                if (!source || !target) return null;
                const active =
                  !hovered || edge.source === hovered || edge.target === hovered;
                const dim = Boolean(hovered) && !active;
                return (
                  <line
                    key={`${edge.source}-${edge.target}`}
                    className={[
                      'garden-map__edge',
                      dim ? 'is-dim' : '',
                      active && hovered ? 'is-hot' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    style={{
                      animationDelay: `${index * 0.18}s`,
                    }}
                  />
                );
              })}
            </g>

            <g className="garden-map__clusters" aria-hidden="true">
              {clusters.map((cluster) => (
                <text
                  key={cluster.key}
                  className={hovered ? 'is-soft' : undefined}
                  x={cluster.x}
                  y={cluster.y - (cluster.count > 1 ? 58 : 36)}
                >
                  #{cluster.key} · {cluster.count}
                </text>
              ))}
            </g>

            <g className="garden-map__nodes">
              {nodes.map((node, index) => {
                const point = positions[node.slug];
                if (!point) return null;
                const isEssay = node.type === 'essay';
                const isHot = !hovered || linked.has(node.slug);
                const isFocus = hovered === node.slug;
                const coreR = isEssay ? 5.2 : 3.8;
                const glowR = isEssay ? 28 : 20;
                const phase = hash01(node.slug);

                return (
                  <g
                    key={node.slug}
                    className={[
                      'garden-node',
                      `garden-node--${node.type}`,
                      isFocus ? 'is-focus' : '',
                      hovered && !isHot ? 'is-dim' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    transform={`translate(${point.x} ${point.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`查看 ${node.title}`}
                    style={{
                      ['--star-delay' as string]: `${phase * 2.4}s`,
                      ['--star-dur' as string]: `${2.8 + phase * 2.2}s`,
                      ['--float-delay' as string]: `${phase * 3.5}s`,
                      ['--float-dur' as string]: `${7 + phase * 5}s`,
                      ['--enter-delay' as string]: `${index * 0.07}s`,
                    }}
                    onClick={() => onSelect(node.slug)}
                    onMouseEnter={() => setHovered(node.slug)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(node.slug)}
                    onBlur={() => setHovered(null)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelect(node.slug);
                      }
                    }}
                  >
                    <title>{node.title}</title>
                    <g className="garden-node__float">
                      <circle
                        className="garden-node__halo"
                        r={glowR}
                        fill={isEssay ? 'url(#star-glow-accent)' : 'url(#star-glow-signal)'}
                      />
                      <circle
                        className="garden-node__ring"
                        r={isEssay ? 11 : 8.5}
                        fill="none"
                      />
                      <path
                        className="garden-node__spike"
                        d={starSpikePath(isEssay ? 14 : 11)}
                      />
                      <circle
                        className="garden-node__core"
                        r={coreR}
                        filter="url(#star-bloom)"
                      />
                    </g>
                    <text className="garden-node__label" y={isEssay ? 34 : 28}>
                      {shortLabel(node.title, 12)}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>
    </section>
  );
}

function starSpikePath(size: number): string {
  const arm = size;
  const core = size * 0.12;
  return [
    `M 0 ${-arm}`,
    `L ${core} ${-core}`,
    `L ${arm} 0`,
    `L ${core} ${core}`,
    `L 0 ${arm}`,
    `L ${-core} ${core}`,
    `L ${-arm} 0`,
    `L ${-core} ${-core}`,
    'Z',
  ].join(' ');
}
