# 本地阅读闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在无账号和后端的条件下，提供收藏、阅读历史、进度恢复、字号与栏宽偏好、继续阅读和归档筛选。

**Architecture:** 所有本地状态通过一个可校验、可版本化的纯 TypeScript 模块读写；页面脚本只调用该模块并通过 `reader-state-change` 事件同步。无 JavaScript或 localStorage 失败时，文章和完整归档仍以静态 HTML 可用。

**Tech Stack:** TypeScript、Astro client scripts、localStorage、URLSearchParams、Vitest。

---

## 文件结构

- Create: `src/lib/reader-state.ts` — 状态类型、解析、读写和纯更新函数。
- Create: `tests/reader-state.test.ts` — 损坏数据、进度、历史和收藏测试。
- Create: `src/lib/archive-filter.ts` — 归档筛选纯函数。
- Create: `tests/archive-filter.test.ts` — 类型、标签、年份与稍后读测试。
- Create: `src/components/reader/ReadingSession.astro` — 记录进度与恢复提示。
- Create: `src/components/reader/ContinueReading.astro` — 首页继续阅读。
- Create: `src/styles/reader.css` — 阅读工具、恢复条和继续阅读样式。
- Create: `src/styles/archive.css` — 筛选控件与归档行。
- Modify: `src/components/post/ReadingTools.astro` — 收藏、设置、复制与分享。
- Modify: `src/layouts/PostLayout.astro` — 摘要、阅读会话和工具参数。
- Modify: `src/pages/index.astro` — 在 Hero 后插入继续阅读。
- Modify: `src/components/home/SeriesShelf.astro` — 本地章节进度和下一章入口。
- Modify: `src/pages/articles/index.astro` — 渐进增强筛选和阅读进度。

### Task 1: 阅读状态纯函数

- [ ] **Step 1: 写失败测试**

Create `tests/reader-state.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadReaderState, parseReaderState, recordProgress, toggleSaved } from '../src/lib/reader-state';

describe('parseReaderState', () => {
  it('returns defaults for missing, malformed, or unsupported data', () => {
    expect(parseReaderState(null).savedSlugs).toEqual([]);
    expect(loadReaderState(null).history).toEqual([]);
    expect(parseReaderState('{bad').history).toEqual([]);
    expect(parseReaderState('{"version":2}').version).toBe(1);
  });
  it('clamps progress and keeps at most 50 history entries', () => {
    const history = Array.from({ length: 55 }, (_, i) => ({ slug: `p${i}`, visitedAt: `2026-07-${String(i + 1).padStart(2, '0')}`, progress: 2 }));
    const state = parseReaderState(JSON.stringify({ version: 1, savedSlugs: [], history, preferences: {} }));
    expect(state.history).toHaveLength(50);
    expect(state.history.every((item) => item.progress === 1)).toBe(true);
  });
});

describe('reader state updates', () => {
  it('moves an updated slug to the front', () => {
    const first = recordProgress(parseReaderState(null), 'a', 0.2, '2026-07-14T10:00:00Z');
    const next = recordProgress(first, 'b', 0.4, '2026-07-14T11:00:00Z');
    expect(next.history.map((item) => item.slug)).toEqual(['b', 'a']);
  });
  it('toggles saved slugs without duplicates', () => {
    const once = toggleSaved(parseReaderState(null), 'a');
    expect(toggleSaved(once, 'a').savedSlugs).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/reader-state.test.ts`

Expected: FAIL because `src/lib/reader-state.ts` does not exist.

- [ ] **Step 3: 实现状态模块**

Create `src/lib/reader-state.ts` with these exports and exact bounds:

```ts
export const READER_STATE_KEY = 'reader-state:v1';
export type LineWidth = 'narrow' | 'normal' | 'wide';
export interface ReaderStateV1 {
  version: 1;
  savedSlugs: string[];
  history: Array<{ slug: string; visitedAt: string; progress: number }>;
  preferences: { fontScale: number; lineWidth: LineWidth; gardenView: 'map' | 'timeline' };
}
export const DEFAULT_READER_STATE: ReaderStateV1 = {
  version: 1,
  savedSlugs: [],
  history: [],
  preferences: { fontScale: 1, lineWidth: 'normal', gardenView: 'map' },
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function parseReaderState(raw: string | null): ReaderStateV1 {
  if (!raw) return structuredClone(DEFAULT_READER_STATE);
  try {
    const value = JSON.parse(raw) as Partial<ReaderStateV1>;
    if (value.version !== 1) return structuredClone(DEFAULT_READER_STATE);
    const savedSlugs = [...new Set((value.savedSlugs ?? []).filter((x): x is string => typeof x === 'string'))];
    const history = (value.history ?? [])
      .filter((x) => x && typeof x.slug === 'string' && typeof x.visitedAt === 'string')
      .map((x) => ({ ...x, progress: clamp(Number(x.progress) || 0, 0, 1) }))
      .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt)).slice(0, 50);
    const p = value.preferences ?? DEFAULT_READER_STATE.preferences;
    return { version: 1, savedSlugs, history, preferences: {
      fontScale: clamp(Number(p.fontScale) || 1, .9, 1.25),
      lineWidth: ['narrow', 'normal', 'wide'].includes(p.lineWidth) ? p.lineWidth : 'normal',
      gardenView: p.gardenView === 'timeline' ? 'timeline' : 'map',
    } };
  } catch { return structuredClone(DEFAULT_READER_STATE); }
}

export function recordProgress(state: ReaderStateV1, slug: string, progress: number, visitedAt: string): ReaderStateV1 {
  const entry = { slug, visitedAt, progress: clamp(progress, 0, 1) };
  return { ...state, history: [entry, ...state.history.filter((item) => item.slug !== slug)]
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt)).slice(0, 50) };
}
export function toggleSaved(state: ReaderStateV1, slug: string): ReaderStateV1 {
  const savedSlugs = state.savedSlugs.includes(slug)
    ? state.savedSlugs.filter((item) => item !== slug)
    : [slug, ...state.savedSlugs];
  return { ...state, savedSlugs };
}
export function updatePreferences(state: ReaderStateV1, patch: Partial<ReaderStateV1['preferences']>): ReaderStateV1 {
  return parseReaderState(JSON.stringify({ ...state, preferences: { ...state.preferences, ...patch } }));
}
type ReaderStorage = Pick<Storage, 'getItem' | 'setItem'>;
export function getReaderStorage(): ReaderStorage | null {
  try { return window.localStorage; } catch { return null; }
}
export function loadReaderState(storage: ReaderStorage | null) {
  if (!storage) return structuredClone(DEFAULT_READER_STATE);
  try { return parseReaderState(storage.getItem(READER_STATE_KEY)); }
  catch { return structuredClone(DEFAULT_READER_STATE); }
}
export function saveReaderState(storage: ReaderStorage | null, state: ReaderStateV1) {
  if (!storage) return false;
  try {
    storage.setItem(READER_STATE_KEY, JSON.stringify(state));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('reader-state-change', { detail: state }));
    return true;
  } catch { return false; }
}
```

- [ ] **Step 4: 运行定向测试**

Run: `npm test -- tests/reader-state.test.ts`

Expected: `4 passed`.

### Task 2: 文章阅读会话与工具

- [ ] **Step 1: 创建阅读会话组件**

Create `src/components/reader/ReadingSession.astro` with a hidden resume bar and a bundled Astro script. Use this event lifecycle so View Transitions do not duplicate listeners:

```ts
let abort: AbortController | undefined;
function startSession() {
  abort?.abort();
  abort = new AbortController();
  const article = document.querySelector<HTMLElement>('[data-article]');
  if (!article) return;
  const slug = article.dataset.slug;
  if (!slug) return;
  const storage = getReaderStorage();
  const state = loadReaderState(storage);
  const prior = state.history.find((item) => item.slug === slug);
  let queued = false;
  const save = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    saveReaderState(storage, recordProgress(loadReaderState(storage), slug, scrollY / max, new Date().toISOString()));
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; save(); });
  };
  addEventListener('scroll', schedule, { passive: true, signal: abort.signal });
  addEventListener('pagehide', save, { signal: abort.signal });
  const bar = document.querySelector<HTMLElement>('[data-resume]');
  const button = bar?.querySelector<HTMLButtonElement>('button');
  if (bar && button && prior && prior.progress >= .05 && prior.progress <= .95) {
    bar.hidden = false;
    button.onclick = () => scrollTo({ top: prior.progress * Math.max(1, document.documentElement.scrollHeight - innerHeight), behavior: 'smooth' });
  }
}
document.addEventListener('astro:page-load', startSession);
startSession();
```

The component markup must expose `<aside data-resume hidden>` with one “继续” button; no automatic scrolling is allowed.

- [ ] **Step 2: 重写阅读工具**

Modify `src/components/post/ReadingTools.astro` to accept `slug` and `title`. Render bookmark, share and settings icon buttons plus a settings panel containing `A− / A+` and `窄 / 标准 / 宽`. Use `toggleSaved()` and `updatePreferences()`; catch rejected native share, then try clipboard; if clipboard also fails, reveal a selectable URL field.

- [ ] **Step 3: 集成文章页**

Modify `src/layouts/PostLayout.astro`:

```astro
<ReadingSession slug={props.slug} />
<article class="container post" data-article data-slug={props.slug}>
<p class="post__summary">{props.description}</p>
<ReadingTools slug={props.slug} title={props.title} />
```

Apply `data-line-width` on `<article>` from the saved preference and keep the existing desktop TOC and mobile TOC behavior.

- [ ] **Step 4: 创建阅读样式**

Create `src/styles/reader.css` with three width mappings: `narrow = 60ch`, `normal = 68ch`, `wide = 76ch`; a non-overlapping resume bar; and `44px` icon targets. Import it from `PostLayout.astro`.

### Task 3: 继续阅读与归档筛选

- [ ] **Step 1: 写归档筛选失败测试**

Create `tests/archive-filter.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { filterArchiveItems } from '../src/lib/archive-filter';
const items = [
  { slug: 'a', type: 'essay', status: 'growing', tags: ['tag-a'], year: 2026 },
  { slug: 'b', type: 'note', status: 'seedling', tags: ['tag-b'], year: 2025 },
];
describe('filterArchiveItems', () => {
  it('combines filters', () => expect(filterArchiveItems(items, { type: 'essay', year: 2026 }, [])).toEqual([items[0]]));
  it('keeps all items without filters', () => expect(filterArchiveItems(items, {}, [])).toEqual(items));
  it('filters saved items', () => expect(filterArchiveItems(items, { savedOnly: true }, ['b'])).toEqual([items[1]]));
});
```

- [ ] **Step 2: 实现归档筛选纯函数**

Create `src/lib/archive-filter.ts`:

```ts
export interface ArchiveItem { slug: string; type: string; status: string; tags: string[]; year: number; }
export interface ArchiveFilters { type?: string; status?: string; tag?: string; year?: number; savedOnly?: boolean; }
export function filterArchiveItems(items: ArchiveItem[], filters: ArchiveFilters, saved: string[]) {
  return items.filter((item) =>
    (!filters.type || item.type === filters.type) &&
    (!filters.status || item.status === filters.status) &&
    (!filters.tag || item.tags.includes(filters.tag)) &&
    (!filters.year || item.year === filters.year) &&
    (!filters.savedOnly || saved.includes(item.slug))
  );
}
```

- [ ] **Step 3: 创建首页继续阅读**

Create `src/components/reader/ContinueReading.astro`. Server-render every candidate row with `hidden`; on page load, read at most three history entries whose progress is between `0.02` and `0.98`, reveal matching rows in history order, set their progress text, and reveal the section. Insert it immediately after `Hero` in `src/pages/index.astro`.

- [ ] **Step 4: 增强系列进度**

Modify `SeriesShelf.astro` to render chapter slugs in `data-chapters`. Read history after page load, count entries with progress at least `.95`, and point “继续系列” to the first incomplete chapter; without JavaScript keep the first chapter link.

- [ ] **Step 5: 重构阅读中心**

Modify `src/pages/articles/index.astro` to render all posts once with `data-slug/type/status/tags/year`. Add native select controls for type, status, tag and year plus a “稍后读” checkbox. A bundled Astro script calls `filterArchiveItems`, updates `hidden`, writes URL query parameters, and never removes the static list from the HTML. When zero rows remain, reveal an empty state containing one “清除筛选” button.

- [ ] **Step 6: 创建归档样式**

Create `src/styles/archive.css`; use a compact toolbar and horizontal editorial rows. Do not use one card per article. Import the file from `src/pages/articles/index.astro`.

### Task 4: 验证与提交

- [ ] **Step 1: 运行定向和完整测试**

Run: `npm test -- tests/reader-state.test.ts tests/archive-filter.test.ts && npm test`

Expected: both new suites and all existing suites pass.

- [ ] **Step 2: 检查存储降级**

In the browser, override `Storage.prototype.setItem` to throw, then verify article reading, archive browsing and navigation still work;收藏与继续阅读可以不显示，但页面不可报错。

- [ ] **Step 3: 构建验证**

Run: `npx tsc --noEmit && npm run build`

Expected: both commands exit 0.

- [ ] **Step 4: 请求授权后提交**

```bash
git add src/lib/reader-state.ts src/lib/archive-filter.ts tests/reader-state.test.ts tests/archive-filter.test.ts src/components/reader src/components/home/SeriesShelf.astro src/components/post/ReadingTools.astro src/layouts/PostLayout.astro src/pages/index.astro src/pages/articles/index.astro src/styles/reader.css src/styles/archive.css
git commit -m "feat(reader): 完善本地阅读闭环"
```
