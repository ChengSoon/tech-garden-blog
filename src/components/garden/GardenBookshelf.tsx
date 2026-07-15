import { useMemo, useState } from 'react';
import type { GraphData, GraphNode } from '../../lib/types';
import { neighborsOf } from '../../lib/graph';

interface Props {
  nodes: GraphNode[];
  graph: GraphData;
  onSelect: (slug: string) => void;
}

const statusLabel: Record<string, string> = {
  seedling: '萌芽',
  growing: '生长中',
  evergreen: '常青',
};

export default function GardenBookshelf({ nodes, graph, onSelect }: Props) {
  const [openShelf, setOpenShelf] = useState<string | null>(null);

  const shelves = useMemo(() => {
    const map = new Map<string, GraphNode[]>();
    for (const n of nodes) {
      const keys = n.tags.length ? n.tags : ['untagged'];
      for (const tag of keys) {
        map.set(tag, [...(map.get(tag) ?? []), n]);
      }
    }
    return [...map.entries()]
      .map(([tag, list]) => {
        // unique by slug, sort by date desc
        const uniq = [...new Map(list.map((x) => [x.slug, x])).values()].sort(
          (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf(),
        );
        return [tag, uniq] as const;
      })
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'zh'));
  }, [nodes]);

  return (
    <div className="shelf">
      <div className="shelf__intro">
        <p className="eyebrow">Topic Bookshelf</p>
        <p className="muted">按主题分架。同一笔记可出现在多个书架上——知识本就交叉生长。</p>
      </div>

      <div className="shelf__stack">
        {shelves.map(([tag, list], shelfIndex) => {
          const expanded = openShelf === null || openShelf === tag;
          return (
            <section key={tag} className="shelf__row" data-expanded={expanded}>
              <header className="shelf__head">
                <button
                  type="button"
                  className="shelf__title-btn"
                  onClick={() => setOpenShelf((cur) => (cur === tag ? null : tag))}
                  aria-expanded={openShelf === tag || openShelf === null}
                >
                  <span className="shelf__no">{String(shelfIndex + 1).padStart(2, '0')}</span>
                  <h2 className="display">
                    {tag === 'untagged' ? '未分类' : `#${tag}`}
                  </h2>
                  <span className="shelf__count">{list.length} 册</span>
                </button>
                <div className="shelf__wood" aria-hidden="true" />
              </header>

              {(openShelf === null || openShelf === tag) && (
                <div className="shelf__books">
                  {list.map((n, i) => {
                    const degree = neighborsOf(n.slug, graph, 50).length;
                    return (
                      <button
                        key={`${tag}-${n.slug}`}
                        type="button"
                        className={`book book--${n.type}`}
                        onClick={() => onSelect(n.slug)}
                        style={{ ['--i' as string]: String(i) }}
                      >
                        <span className="book__spine" aria-hidden="true" />
                        <span className="book__body">
                          <span className="book__meta">
                            <span>{n.type === 'essay' ? 'Essay' : 'Note'}</span>
                            <span className="dot" data-status={n.status} />
                            <span>{statusLabel[n.status] ?? n.status}</span>
                          </span>
                          <strong className="display">{n.title}</strong>
                          <span className="book__summary">{n.summary}</span>
                          <span className="book__foot">
                            <span>
                              {new Date(n.date).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span>{degree} 链</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <style>{`
        .shelf { display: grid; gap: 1.25rem; }
        .shelf__intro {
          padding: 0.95rem 1.05rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-elevated);
        }
        .shelf__intro .eyebrow { margin-bottom: 0.35rem; }
        .shelf__intro p:last-child {
          margin: 0;
          max-width: 40rem;
          line-height: 1.6;
          font-size: 0.95rem;
        }
        .shelf__stack {
          display: grid;
          gap: 1.6rem;
        }
        .shelf__row {
          animation: motion-fade var(--motion-slow) var(--ease-out) both;
        }
        .shelf__head {
          display: grid;
          gap: 0.45rem;
          margin-bottom: 0.75rem;
        }
        .shelf__title-btn {
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
          display: flex;
          align-items: baseline;
          gap: 0.7rem;
          padding: 0;
          text-align: left;
          width: 100%;
        }
        .shelf__no {
          font-family: var(--font-display);
          color: var(--brass);
          font-size: 1.3rem;
          line-height: 1;
        }
        .shelf__title-btn h2 {
          margin: 0;
          font-size: 1.55rem;
          line-height: 1.1;
        }
        .shelf__count {
          margin-left: auto;
          font-family: var(--font-ui);
          font-size: 0.8rem;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }
        .shelf__wood {
          height: 7px;
          border-radius: 999px;
          background: var(--border-strong);
          box-shadow: 0 1px 0 color-mix(in oklab, white 25%, transparent);
        }

        .shelf__books {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.85rem;
          padding: 0.2rem 0.15rem 0.4rem;
        }

        .book {
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-elevated);
          text-align: left;
          color: inherit;
          font: inherit;
          cursor: pointer;
          display: grid;
          grid-template-columns: 10px 1fr;
          min-height: 168px;
          overflow: hidden;
          box-shadow: var(--shadow-soft);
          transition:
            transform var(--motion-base) var(--ease-out),
            border-color var(--motion-base) var(--ease-inout);
          animation: motion-rise var(--motion-enter) var(--ease-out) both;
          animation-delay: min(
            calc(var(--i, 0) * var(--motion-stagger)),
            calc(var(--motion-stagger-max) * var(--motion-stagger))
          );
        }
        .book:hover {
          transform: translate3d(0, -3px, 0);
          border-color: color-mix(in oklab, var(--brass) 50%, var(--border));
        }
        .book__spine {
          display: block;
          width: 10px;
          min-height: 100%;
          background: var(--brass);
          transition: transform var(--motion-base) var(--ease-out);
          transform-origin: center bottom;
        }
        .book--essay .book__spine {
          background: var(--accent);
        }
        .book__body {
          display: grid;
          gap: 0.4rem;
          align-content: start;
          padding: 0.85rem 0.9rem 0.8rem;
        }
        .book__meta {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--font-ui);
          font-size: 0.66rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .book__meta .dot {
          width: 0.35rem;
          height: 0.35rem;
          border-radius: 999px;
          background: var(--growing);
        }
        .book__meta .dot[data-status="seedling"] { background: var(--seedling); }
        .book__meta .dot[data-status="growing"] { background: var(--growing); }
        .book__meta .dot[data-status="evergreen"] { background: var(--evergreen); }
        .book__body strong {
          font-size: 1.12rem;
          line-height: 1.25;
          letter-spacing: -0.015em;
        }
        .book__summary {
          color: var(--text-muted);
          font-size: 0.86rem;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .book__foot {
          margin-top: auto;
          padding-top: 0.35rem;
          display: flex;
          justify-content: space-between;
          gap: 0.5rem;
          font-family: var(--font-ui);
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .book:hover .book__spine {
          transform: scaleY(1.02);
        }
        .book:active {
          transform: translate3d(0, 0, 0);
        }
        @media (prefers-reduced-motion: reduce) {
          .book {
            animation: none !important;
            transition: none;
          }
          .book:hover,
          .book:hover .book__spine,
          .book:active {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
