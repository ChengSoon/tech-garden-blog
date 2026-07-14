import { useMemo } from 'react';
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

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-');
  return `${y} 年 ${Number(m)} 月`;
}

export default function GardenTimeline({ nodes, graph, onSelect }: Props) {
  const groups = useMemo(() => {
    const sorted = [...nodes].sort(
      (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf(),
    );
    const map = new Map<string, GraphNode[]>();
    for (const n of sorted) {
      const k = monthKey(n.date);
      map.set(k, [...(map.get(k) ?? []), n]);
    }
    return [...map.entries()];
  }, [nodes]);

  let running = 0;

  return (
    <div className="timeline">
      <div className="timeline__intro">
        <p className="eyebrow">Growth Timeline</p>
        <p className="muted">按写作时间回看花园如何生长；节点上的链接显示当时织进网络的邻居。</p>
      </div>

      <div className="timeline__rail">
        {groups.map(([key, list]) => (
          <section key={key} className="timeline__month">
            <header className="timeline__month-head">
              <span className="timeline__pin" aria-hidden="true" />
              <h2 className="display">{monthLabel(key)}</h2>
              <span className="muted">{list.length} 篇</span>
            </header>

            <ol className="timeline__list">
              {list.map((n) => {
                running += 1;
                const idx = running;
                const links = neighborsOf(n.slug, graph, 6)
                  .map((s) => graph.nodes.find((x) => x.slug === s))
                  .filter(Boolean) as GraphNode[];
                const day = new Date(n.date).toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <li
                    key={n.slug}
                    className="timeline__item"
                    style={{ ['--i' as string]: String(idx - 1) }}
                  >
                    <div className="timeline__spine" aria-hidden="true">
                      <span className={`timeline__dot timeline__dot--${n.status}`} />
                    </div>
                    <article className={`timeline__card timeline__card--${n.type}`}>
                      <button
                        type="button"
                        className="timeline__main"
                        onClick={() => onSelect(n.slug)}
                      >
                        <div className="timeline__meta">
                          <span className="timeline__idx">{String(idx).padStart(2, '0')}</span>
                          <time dateTime={n.date}>{day}</time>
                          <span className="badge">{n.type === 'essay' ? '长文' : '笔记'}</span>
                          <span className="badge">
                            <span className="dot" data-status={n.status} />
                            {statusLabel[n.status] ?? n.status}
                          </span>
                        </div>
                        <h3 className="display">{n.title}</h3>
                        <p>{n.summary}</p>
                        <div className="timeline__tags">
                          {n.tags.map((t) => (
                            <span key={t}>#{t}</span>
                          ))}
                        </div>
                      </button>
                      {links.length > 0 ? (
                        <div className="timeline__links">
                          <span className="links-label">织入</span>
                          {links.map((l) => (
                            <button
                              key={l.slug}
                              type="button"
                              className="link-chip"
                              onClick={() => onSelect(l.slug)}
                            >
                              {l.title}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      <style>{`
        .timeline { display: grid; gap: 1.25rem; }
        .timeline__intro {
          padding: 0.95rem 1.05rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: linear-gradient(120deg, color-mix(in oklab, var(--brass) 8%, var(--bg-elevated)), var(--bg-elevated));
        }
        .timeline__intro .eyebrow { margin-bottom: 0.35rem; }
        .timeline__intro p:last-child {
          margin: 0;
          max-width: 40rem;
          line-height: 1.6;
          font-size: 0.95rem;
        }
        .timeline__rail {
          display: grid;
          gap: 1.8rem;
        }
        .timeline__month-head {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.9rem;
          position: relative;
        }
        .timeline__pin {
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 999px;
          background: var(--brass);
          box-shadow: 0 0 0 4px var(--brass-soft);
          flex: 0 0 auto;
        }
        .timeline__month-head h2 {
          margin: 0;
          font-size: 1.45rem;
          line-height: 1.1;
        }
        .timeline__list {
          list-style: none;
          margin: 0;
          padding: 0 0 0 0.85rem;
          display: grid;
          gap: 0.85rem;
          border-left: 1px solid var(--border-strong);
          margin-left: 0.3rem;
        }
        .timeline__item {
          display: grid;
          grid-template-columns: 1rem 1fr;
          gap: 0.75rem;
          align-items: start;
        }
        .timeline__spine {
          position: relative;
          display: grid;
          justify-items: center;
          padding-top: 1.25rem;
        }
        .timeline__dot {
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 999px;
          border: 2px solid var(--bg-elevated);
          background: var(--growing);
          box-shadow: 0 0 0 1px var(--border);
          margin-left: -1.2rem;
          transition: transform var(--motion-base) var(--ease-spring);
        }
        .timeline__dot--seedling { background: var(--seedling); }
        .timeline__dot--growing { background: var(--growing); }
        .timeline__dot--evergreen { background: var(--evergreen); }

        .timeline__item {
          animation: motion-rise var(--motion-enter) var(--ease-out) both;
          animation-delay: min(
            calc(var(--i, 0) * var(--motion-stagger)),
            calc(var(--motion-stagger-max) * var(--motion-stagger))
          );
        }
        .timeline__card {
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-elevated);
          overflow: hidden;
          box-shadow: var(--shadow-soft);
          transition:
            border-color var(--motion-base) var(--ease-inout),
            transform var(--motion-base) var(--ease-out);
        }
        .timeline__card:hover {
          border-color: color-mix(in oklab, var(--brass) 45%, var(--border));
          transform: translate3d(0, -2px, 0);
        }
        .timeline__card--essay {
          background: linear-gradient(145deg, color-mix(in oklab, var(--accent) 7%, var(--bg-elevated)), var(--bg-elevated));
        }
        .timeline__main {
          width: 100%;
          border: 0;
          background: transparent;
          text-align: left;
          color: inherit;
          font: inherit;
          cursor: pointer;
          display: grid;
          gap: 0.5rem;
          padding: 1rem 1.1rem 0.9rem;
        }
        .timeline__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
        }
        .timeline__idx {
          font-family: var(--font-display);
          color: var(--brass);
          font-size: 1.15rem;
          line-height: 1;
        }
        .timeline__meta time {
          font-family: var(--font-ui);
          font-size: 0.82rem;
          color: var(--text-muted);
          min-width: 3.5rem;
        }
        .timeline__main h3 {
          margin: 0;
          font-size: clamp(1.25rem, 2.2vw, 1.6rem);
          line-height: 1.22;
        }
        .timeline__main p {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.94rem;
          line-height: 1.6;
        }
        .timeline__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--brass);
        }
        .timeline__links {
          border-top: 1px solid var(--border);
          padding: 0.65rem 1rem 0.8rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
          background: color-mix(in oklab, var(--bg) 50%, var(--bg-elevated));
        }
        .links-label {
          font-family: var(--font-ui);
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-right: 0.2rem;
        }
        .link-chip {
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text);
          border-radius: 999px;
          padding: 0.25rem 0.65rem;
          font: inherit;
          font-family: var(--font-ui);
          font-size: 0.78rem;
          cursor: pointer;
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition:
            border-color var(--motion-fast) var(--ease-inout),
            background-color var(--motion-fast) var(--ease-inout),
            transform var(--motion-fast) var(--ease-out);
        }
        .link-chip:hover {
          border-color: color-mix(in oklab, var(--brass) 50%, var(--border));
          background: var(--brass-soft);
          transform: translate3d(0, -1px, 0);
        }
        .timeline__item:hover .timeline__dot {
          transform: scale(1.18);
        }
        @media (prefers-reduced-motion: reduce) {
          .timeline__item { animation: none; }
          .timeline__card,
          .link-chip,
          .timeline__dot { transition: none; }
          .timeline__card:hover,
          .link-chip:hover,
          .timeline__item:hover .timeline__dot { transform: none; }
        }
      `}</style>
    </div>
  );
}
