import { useEffect, useMemo, useState } from 'react';
import type { SearchItem } from '../../lib/types';

interface Props {
  items: SearchItem[];
}

export default function SearchDialog({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items.slice(0, 8);
    return items
      .filter((item) => {
        const hay = `${item.title} ${item.tags.join(' ')} ${item.summary}`.toLowerCase();
        return hay.includes(query);
      })
      .slice(0, 12);
  }, [items, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  function go(slug: string) {
    window.location.href = `/posts/${slug}/`;
  }

  return (
    <>
      <button type="button" className="btn search-trigger" onClick={() => setOpen(true)}>
        搜索
        <kbd>⌘K</kbd>
      </button>
      {open ? (
        <div className="search-overlay" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="搜索文章"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-dialog__head">
              <span className="eyebrow">Search</span>
              <span className="muted count">{results.length} results</span>
            </div>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="标题、标签或摘要…"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                }
                if (e.key === 'Enter' && results[active]) go(results[active].slug);
              }}
            />
            <ul>
              {results.map((item, i) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    className={i === active ? 'active' : undefined}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item.slug)}
                  >
                    <span className="row">
                      <strong>{item.title}</strong>
                      <em>{item.type === 'essay' ? 'Essay' : 'Note'}</em>
                    </span>
                    <span className="sub">
                      {item.tags.map((t) => `#${t}`).join('  ')}
                    </span>
                  </button>
                </li>
              ))}
              {results.length === 0 ? <li className="empty">没有匹配内容</li> : null}
            </ul>
          </div>
        </div>
      ) : null}
      <style>{`
        .search-trigger kbd {
          font-size: 0.68rem;
          opacity: 0.7;
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 0.05rem 0.28rem;
          font-family: var(--font-ui);
        }
        .search-overlay {
          position: fixed;
          inset: 0;
          background: color-mix(in oklab, #14110e 42%, transparent);
          display: grid;
          place-items: start center;
          padding-top: 11vh;
          z-index: 60;
          animation: motion-fade var(--motion-base) var(--ease-out) both;
        }
        .search-dialog {
          width: min(580px, calc(100vw - 2rem));
          background: var(--bg-elevated);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow);
          animation: motion-scale-in var(--motion-slow) var(--ease-spring) both;
          will-change: transform, opacity;
        }
        .search-dialog__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem 1rem 0.35rem;
        }
        .search-dialog__head .count {
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .search-dialog input {
          width: 100%;
          border: 0;
          border-bottom: 1px solid var(--border);
          background: transparent;
          color: var(--text);
          font: inherit;
          font-family: var(--font-display);
          font-size: 1.35rem;
          padding: 0.65rem 1rem 0.95rem;
          outline: none;
        }
        .search-dialog ul {
          list-style: none;
          margin: 0;
          padding: 0.45rem;
          max-height: 340px;
          overflow: auto;
        }
        .search-dialog li button {
          transition:
            background-color var(--motion-fast) var(--ease-inout),
            transform var(--motion-fast) var(--ease-out);
          width: 100%;
          text-align: left;
          border: 0;
          background: transparent;
          color: var(--text);
          border-radius: 3px;
          padding: 0.75rem 0.8rem;
          cursor: pointer;
          display: grid;
          gap: 0.2rem;
          font: inherit;
        }
        .search-dialog .row {
          display: flex;
          justify-content: space-between;
          gap: 0.8rem;
          align-items: baseline;
        }
        .search-dialog .row strong {
          font-family: var(--font-display);
          font-size: 1.12rem;
          font-weight: 600;
        }
        .search-dialog .row em {
          font-style: normal;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--brass);
          font-family: var(--font-ui);
        }
        .search-dialog .sub {
          color: var(--text-muted);
          font-size: 0.82rem;
        }
        .search-dialog li button.active,
        .search-dialog li button:hover {
          background: var(--accent-soft);
        }
        .search-dialog .empty {
          color: var(--text-muted);
          padding: 0.9rem;
          font-size: 0.92rem;
        }
        @media (max-width: 760px) {
          .search-trigger kbd { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .search-overlay, .search-dialog { animation: none; }
        }
      `}</style>
    </>
  );
}
