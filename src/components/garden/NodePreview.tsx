import type { GraphNode } from '../../lib/types';

interface Props {
  node: GraphNode | null;
  neighbors?: GraphNode[];
  onClose: () => void;
  onOpenNeighbor?: (slug: string) => void;
}

const statusLabel: Record<string, string> = {
  seedling: '萌芽',
  growing: '生长中',
  evergreen: '常青',
};

export default function NodePreview({
  node,
  neighbors = [],
  onClose,
  onOpenNeighbor,
}: Props) {
  if (!node) return null;
  return (
    <div className="preview-overlay" role="presentation" onClick={onClose}>
      <aside
        className="preview-panel"
        role="dialog"
        aria-modal="true"
        aria-label={node.title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="preview-panel__head">
          <p className="eyebrow">Node preview</p>
          <button type="button" className="btn" onClick={onClose} aria-label="关闭预览">
            关闭
          </button>
        </header>

        <div className="preview-panel__meta">
          <span className="badge">{node.type === 'essay' ? '长文' : '笔记'}</span>
          <span className="badge">
            <span className="dot" data-status={node.status} />
            {statusLabel[node.status] ?? node.status}
          </span>
        </div>

        <h2 className="display">{node.title}</h2>
        <p className="summary">{node.summary}</p>

        <div className="tags">
          {node.tags.map((t) => (
            <span key={t} className="badge">
              #{t}
            </span>
          ))}
        </div>

        {neighbors.length > 0 ? (
          <div className="neighbors">
            <p className="neighbors__title">相邻节点 · {neighbors.length}</p>
            <ul>
              {neighbors.map((n) => (
                <li key={n.slug}>
                  <button type="button" onClick={() => onOpenNeighbor?.(n.slug)}>
                    <span className="n-type">{n.type === 'essay' ? 'Essay' : 'Note'}</span>
                    <span className="n-title">{n.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="lonely muted">这个节点还没有邻居，去正文加几条链接吧。</p>
        )}

        <div className="actions">
          <a className="btn btn-primary" href={`/posts/${node.slug}/`}>
            阅读全文
          </a>
          <button type="button" className="btn" onClick={onClose}>
            继续漫游
          </button>
        </div>
      </aside>
      <style>{`
        .preview-overlay {
          position: fixed;
          inset: 0;
          background: color-mix(in oklab, #14110e 40%, transparent);
          z-index: 55;
          display: flex;
          justify-content: flex-end;
          animation: motion-fade var(--motion-base) var(--ease-out) both;
        }
        .preview-panel {
          width: min(420px, 100%);
          height: 100%;
          background:
            linear-gradient(180deg, color-mix(in oklab, var(--brass) 6%, var(--bg-elevated)), var(--bg-elevated) 28%);
          border-left: 1px solid var(--border-strong);
          padding: 1.15rem 1.25rem 1.8rem;
          display: grid;
          align-content: start;
          gap: 0.85rem;
          box-shadow: var(--shadow);
          overflow: auto;
          animation: motion-slide-in-right var(--motion-slow) var(--ease-spring) both;
          will-change: transform, opacity;
        }
        .preview-panel__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .preview-panel__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .preview-panel h2 {
          margin: 0;
          font-size: clamp(1.55rem, 3vw, 1.9rem);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .summary {
          margin: 0;
          color: var(--text-muted);
          line-height: 1.7;
          font-size: 0.98rem;
        }
        .tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .neighbors {
          border-top: 1px solid var(--border);
          padding-top: 0.9rem;
          margin-top: 0.2rem;
        }
        .neighbors__title {
          margin: 0 0 0.55rem;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--brass);
          font-family: var(--font-ui);
        }
        .neighbors ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.4rem;
        }
        .neighbors button {
          width: 100%;
          text-align: left;
          border: 1px solid var(--border);
          background: color-mix(in oklab, var(--bg) 80%, transparent);
          color: var(--text);
          border-radius: var(--radius-lg);
          padding: 0.6rem 0.7rem;
          cursor: pointer;
          font: inherit;
          display: grid;
          gap: 0.15rem;
          transition:
            border-color var(--motion-fast) var(--ease-inout),
            background-color var(--motion-fast) var(--ease-inout),
            transform var(--motion-fast) var(--ease-out);
        }
        .neighbors button:hover {
          border-color: color-mix(in oklab, var(--brass) 50%, var(--border));
          background: var(--brass-soft);
          transform: translate3d(-2px, 0, 0);
        }
        .n-type {
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          font-family: var(--font-ui);
        }
        .n-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          line-height: 1.25;
        }
        .lonely {
          margin: 0;
          font-size: 0.9rem;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          margin-top: 0.4rem;
        }
        @media (prefers-reduced-motion: reduce) {
          .preview-overlay, .preview-panel { animation: none; }
          .neighbors button { transition: none; }
          .neighbors button:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}
