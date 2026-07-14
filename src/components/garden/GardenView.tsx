import { useEffect, useMemo, useState } from 'react';
import type { GraphData, GraphNode, PostType, GrowthStatus } from '../../lib/types';
import { neighborsOf } from '../../lib/graph';
import GardenTimeline from './GardenTimeline';
import GardenBookshelf from './GardenBookshelf';
import NodePreview from './NodePreview';

interface Props {
  graph: GraphData;
}

type ViewMode = 'timeline' | 'shelf';

const STATUS_OPTS: { id: 'all' | GrowthStatus; label: string }[] = [
  { id: 'all', label: '全部状态' },
  { id: 'seedling', label: '萌芽' },
  { id: 'growing', label: '生长中' },
  { id: 'evergreen', label: '常青' },
];

export default function GardenView({ graph }: Props) {
  const [view, setView] = useState<ViewMode>('timeline');
  const [type, setType] = useState<'all' | PostType>('all');
  const [status, setStatus] = useState<'all' | GrowthStatus>('all');
  const [tag, setTag] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('gardenView');
    if (saved === 'timeline' || saved === 'shelf') setView(saved);
    else if (saved === 'board' || saved === 'graph' || saved === 'grid') setView('timeline');
  }, []);

  useEffect(() => {
    localStorage.setItem('gardenView', view);
  }, [view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tags = useMemo(() => {
    return [...new Set(graph.nodes.flatMap((n) => n.tags))].sort();
  }, [graph.nodes]);

  const nodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return graph.nodes.filter((n) => {
      if (type !== 'all' && n.type !== type) return false;
      if (status !== 'all' && n.status !== status) return false;
      if (tag !== 'all' && !n.tags.includes(tag)) return false;
      if (q) {
        const hay = `${n.title} ${n.summary} ${n.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [graph.nodes, type, status, tag, query]);

  const selectedNode: GraphNode | null =
    graph.nodes.find((n) => n.slug === selected) ?? null;

  const selectedNeighbors = useMemo(() => {
    if (!selected) return [] as GraphNode[];
    const slugs = neighborsOf(selected, graph, 8);
    return slugs
      .map((s) => graph.nodes.find((n) => n.slug === s))
      .filter(Boolean) as GraphNode[];
  }, [selected, graph]);

  const hasFilters =
    type !== 'all' || status !== 'all' || tag !== 'all' || query.trim() !== '';

  function resetFilters() {
    setType('all');
    setStatus('all');
    setTag('all');
    setQuery('');
  }

  return (
    <div className="garden-view">
      <div className="toolbar card">
        <div className="toolbar__row">
          <div className="segmented" role="group" aria-label="视图切换">
            <button
              type="button"
              className={view === 'timeline' ? 'active' : ''}
              onClick={() => setView('timeline')}
            >
              时间线
            </button>
            <button
              type="button"
              className={view === 'shelf' ? 'active' : ''}
              onClick={() => setView('shelf')}
            >
              主题书架
            </button>
          </div>

          <div className="type-tabs" role="group" aria-label="类型">
            {(
              [
                ['all', '全部'],
                ['essay', '长文'],
                ['note', '笔记'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={type === id ? 'active' : ''}
                onClick={() => setType(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="search">
            <span className="sr-only">搜索节点</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索标题 / 标签…"
            />
          </label>

          <span className="count">
            <strong>{nodes.length}</strong>
            <span> / {graph.nodes.length}</span>
          </span>
        </div>

        <div className="toolbar__row toolbar__row--filters">
          <div className="chips" role="group" aria-label="生长状态">
            {STATUS_OPTS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={status === s.id ? 'chip active' : 'chip'}
                onClick={() => setStatus(s.id)}
              >
                {s.id !== 'all' ? <i className="dot" data-status={s.id} /> : null}
                {s.label}
              </button>
            ))}
          </div>

          <div className="chips" role="group" aria-label="标签">
            <button
              type="button"
              className={tag === 'all' ? 'chip active' : 'chip'}
              onClick={() => setTag('all')}
            >
              全部标签
            </button>
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                className={tag === t ? 'chip active' : 'chip'}
                onClick={() => setTag(t)}
              >
                #{t}
              </button>
            ))}
          </div>

          {hasFilters ? (
            <button type="button" className="btn reset" onClick={resetFilters}>
              清除筛选
            </button>
          ) : null}
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="empty card">
          <p className="eyebrow">No matches</p>
          <strong className="display">没有匹配的节点</strong>
          <p className="muted">试试放宽类型、状态、标签或搜索词。</p>
          <button type="button" className="btn btn-primary" onClick={resetFilters}>
            重置筛选
          </button>
        </div>
      ) : view === 'timeline' ? (
        <GardenTimeline nodes={nodes} graph={graph} onSelect={setSelected} />
      ) : (
        <GardenBookshelf nodes={nodes} graph={graph} onSelect={setSelected} />
      )}

      <NodePreview
        node={selectedNode}
        neighbors={selectedNeighbors}
        onClose={() => setSelected(null)}
        onOpenNeighbor={(slug) => setSelected(slug)}
      />

      <style>{`
        .garden-view { display: grid; gap: 1rem; }
        .toolbar {
          display: grid;
          gap: 0.85rem;
          padding: 0.9rem 1rem;
        }
        .toolbar__row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          align-items: center;
        }
        .toolbar__row--filters {
          padding-top: 0.15rem;
          border-top: 1px solid var(--border);
        }
        .segmented,
        .type-tabs {
          display: inline-flex;
          border: 1px solid var(--border);
          border-radius: 999px;
          overflow: hidden;
          background: var(--bg);
        }
        .segmented button,
        .type-tabs button {
          border: 0;
          background: transparent;
          color: var(--text-muted);
          padding: 0.48rem 0.95rem;
          cursor: pointer;
          font: inherit;
          font-family: var(--font-ui);
          font-size: 0.86rem;
          letter-spacing: 0.03em;
          transition:
            color var(--motion-fast) var(--ease-inout),
            background-color var(--motion-fast) var(--ease-inout),
            transform var(--motion-fast) var(--ease-out);
        }
        .segmented button:hover,
        .type-tabs button:hover {
          color: var(--text);
        }
        .segmented button.active,
        .type-tabs button.active {
          background: var(--accent-soft);
          color: var(--text);
        }
        .segmented button:active,
        .type-tabs button:active {
          transform: scale(0.97);
        }
        .search input {
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          border-radius: 999px;
          padding: 0.5rem 0.9rem;
          min-width: min(220px, 48vw);
          font: inherit;
          font-family: var(--font-ui);
          font-size: 0.88rem;
          transition:
            border-color var(--motion-fast) var(--ease-inout),
            box-shadow var(--motion-fast) var(--ease-out);
        }
        .search input:focus {
          outline: 1.5px solid var(--brass);
          outline-offset: 2px;
          box-shadow: 0 0 0 3px var(--brass-soft);
        }
        .count {
          margin-left: auto;
          font-family: var(--font-ui);
          font-size: 0.86rem;
          color: var(--text-muted);
        }
        .count strong {
          color: var(--text);
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .chip {
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          border-radius: 999px;
          padding: 0.32rem 0.7rem;
          cursor: pointer;
          font: inherit;
          font-family: var(--font-ui);
          font-size: 0.78rem;
          letter-spacing: 0.03em;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition:
            border-color var(--motion-fast) var(--ease-inout),
            background-color var(--motion-fast) var(--ease-inout),
            color var(--motion-fast) var(--ease-inout),
            transform var(--motion-fast) var(--ease-out);
        }
        .chip:hover {
          transform: translate3d(0, -1px, 0);
          color: var(--text);
        }
        .chip .dot {
          width: 0.4rem;
          height: 0.4rem;
          border-radius: 999px;
          background: var(--growing);
        }
        .chip .dot[data-status="seedling"] { background: var(--seedling); }
        .chip .dot[data-status="growing"] { background: var(--growing); }
        .chip .dot[data-status="evergreen"] { background: var(--evergreen); }
        .chip.active {
          border-color: color-mix(in oklab, var(--brass) 55%, var(--border));
          background: var(--brass-soft);
          color: var(--text);
        }
        .reset {
          padding: 0.35rem 0.8rem;
          font-size: 0.8rem;
          margin-left: auto;
        }
        .empty {
          display: grid;
          gap: 0.55rem;
          justify-items: start;
          padding: 1.6rem 1.4rem;
        }
        .empty .display { font-size: 1.7rem; }
        .empty p { margin: 0; }
        .sr-only {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0); border: 0;
        }
      `}</style>
    </div>
  );
}
