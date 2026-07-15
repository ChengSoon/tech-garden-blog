import { useEffect, useMemo, useRef, useState } from 'react';
import { rankSearch, type SearchDocument } from '../../lib/search';
import type { SearchItem } from '../../lib/types';
import './search-dialog.css';

interface Props {
  items: SearchItem[];
}

function filterMetadata(items: SearchItem[], query: string): SearchItem[] {
  const normalized = query.trim().toLocaleLowerCase('zh-CN');
  if (!normalized) return items.slice(0, 8);
  return items
    .filter((item) => {
      const text = `${item.title} ${item.tags.join(' ')} ${item.summary}`;
      return text.toLocaleLowerCase('zh-CN').includes(normalized);
    })
    .slice(0, 12);
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  const selector = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]';
  return [...container.querySelectorAll<HTMLElement>(selector)].filter(
    (element) => !element.hasAttribute('hidden'),
  );
}

export default function SearchDialog({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [documents, setDocuments] = useState<SearchDocument[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const results = useMemo(() => {
    if (documents && query.trim()) return rankSearch(documents, query).slice(0, 12);
    return filterMetadata(items, query);
  }, [documents, items, query]);

  function close() {
    setOpen(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }

  function show() {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (documents || loading || loadFailed) return;
    setLoading(true);
    fetch('/search-index.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Search index returned ${response.status}`);
        return response.json() as Promise<SearchDocument[]>;
      })
      .then(setDocuments)
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, [documents, loadFailed, loading, open]);

  useEffect(() => setActive(0), [query, open]);

  function handleDialogKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusables = focusableElements(dialogRef.current);
    const first = focusables[0];
    const last = focusables.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function handleInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && results[active]) {
      window.location.href = `/posts/${results[active].slug}/`;
    }
  }

  return (
    <>
      <button
        type="button"
        className="icon-button search-trigger"
        aria-label="搜索"
        title="搜索（⌘K）"
        onClick={show}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
      {open ? (
        <div className="search-overlay" role="presentation" onMouseDown={close}>
          <div
            ref={dialogRef}
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="搜索文章"
            aria-busy={loading}
            onKeyDown={handleDialogKey}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="search-dialog__head">
              <span className="eyebrow">Search / 全文检索</span>
              <button type="button" className="search-close" onClick={close} aria-label="关闭搜索">
                Esc
              </button>
            </header>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKey}
              placeholder="搜索标题、主题与正文…"
              aria-controls="search-results"
            />
            <div className="sr-only" aria-live="polite">
              {loading ? '正在加载全文索引' : `找到 ${results.length} 条结果`}
              {loadFailed ? '，全文索引不可用，已切换到标题和摘要搜索' : ''}
            </div>
            <ul id="search-results">
              {results.map((item, index) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    className={index === active ? 'active' : undefined}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => (window.location.href = `/posts/${item.slug}/`)}
                  >
                    <span className="search-result__row">
                      <strong>{item.title}</strong>
                      <em>{item.type === 'essay' ? 'Essay' : 'Note'}</em>
                    </span>
                    <span className="search-result__tags">
                      {item.tags.map((tag) => `#${tag}`).join('  ')}
                    </span>
                  </button>
                </li>
              ))}
              {!results.length ? <li className="search-empty">没有匹配内容，换个关键词试试。</li> : null}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
