# 搜索与花园发现 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提供按需全文搜索、可解释的关联推荐，以及可在主题地图和时间线之间切换的知识花园。

**Architecture:** 搜索索引和图谱数据在 Astro 构建期生成；搜索弹窗首次打开时才加载正文索引。关系排序使用显式链接、同系列和共同标签的确定性分数，花园 SVG 使用现有构建期布局，不运行物理模拟。

**Tech Stack:** Astro static endpoints、React islands、TypeScript、SVG、Vitest。

---

## 文件结构

- Create: `src/lib/search.ts` — Markdown 去标记、规范化和加权排序。
- Create: `tests/search.test.ts` — 排名和正文清理测试。
- Create: `src/pages/search-index.json.ts` — 静态全文索引。
- Create: `src/components/site/search-dialog.css` — 搜索弹窗样式。
- Modify: `src/components/site/SearchDialog.tsx` — 按需加载、图标和焦点管理。
- Modify: `src/lib/types.ts` — GraphNode series 与关联结果类型。
- Modify: `src/lib/build-graph.ts` — 将 series 加入节点。
- Modify: `src/lib/graph.ts` — 可解释关联排序。
- Modify: `tests/graph.test.ts` — 显式链接、系列、标签排序。
- Create: `src/components/garden/GardenToolbar.tsx` — 视图和筛选控件。
- Create: `src/components/garden/GardenMap.tsx` — 轻量可访问 SVG 地图。
- Create: `src/components/garden/GardenMapBoundary.tsx` — 地图渲染失败时回退时间线。
- Create: `src/components/garden/garden-map.css` — 地图视觉。
- Create: `src/components/garden/garden-view.css` — 工具栏与容器。
- Create: `src/components/garden/garden-timeline.css` — 时间线样式。
- Modify: `src/components/garden/GardenView.tsx` — 组合地图、时间线和预览。
- Modify: `src/components/garden/GardenTimeline.tsx` — 移出内联 CSS。
- Modify: `src/components/garden/NodePreview.tsx` — 展示关联原因。
- Modify: `src/components/post/NeighborCards.astro` — 展示关联原因。
- Modify: `src/pages/posts/[slug].astro` — 使用加权关联结果。
- Modify: `src/pages/garden.astro` — 延后 hydrate 花园岛屿。

### Task 1: 全文索引与排序

- [ ] **Step 1: 写失败测试**

Create `tests/search.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { rankSearch, stripMarkdown } from '../src/lib/search';

const docs = [
  { slug: 'title', title: 'Astro 岛屿', summary: '架构', tags: ['web'], type: 'essay' as const, body: '普通正文' },
  { slug: 'body', title: '其他文章', summary: '说明', tags: ['notes'], type: 'note' as const, body: '正文提到 Astro 岛屿' },
];

describe('stripMarkdown', () => {
  it('removes links, code fences, and heading markers', () => {
    expect(stripMarkdown('# 标题\n[链接](/posts/a)\n```ts\nconst a = 1\n```')).toBe('标题 链接 const a = 1');
  });
});

describe('rankSearch', () => {
  it('ranks title hits before body hits', () => {
    expect(rankSearch(docs, 'Astro').map((x) => x.slug)).toEqual(['title', 'body']);
  });
  it('returns no items for a blank query', () => {
    expect(rankSearch(docs, '  ')).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/search.test.ts`

Expected: FAIL because `src/lib/search.ts` does not exist.

- [ ] **Step 3: 实现搜索纯函数**

Create `src/lib/search.ts`:

```ts
import type { PostType } from './types';
export interface SearchDocument { slug: string; title: string; summary: string; tags: string[]; type: PostType; body: string; }
const norm = (value: string) => value.normalize('NFKC').toLocaleLowerCase('zh-CN');
export function stripMarkdown(value: string) {
  return value
    .replace(/```\w*\n?/g, ' ').replace(/```/g, ' ')
    .replace(/!?[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#~-]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function rankSearch(docs: SearchDocument[], query: string) {
  const q = norm(query.trim());
  if (!q) return [];
  return docs.map((doc) => {
    const title = norm(doc.title), summary = norm(doc.summary), body = norm(doc.body);
    const tagHit = doc.tags.some((tag) => norm(tag).includes(q));
    const score = (title.includes(q) ? 100 : 0) + (tagHit ? 60 : 0) +
      (summary.includes(q) ? 30 : 0) + (body.includes(q) ? 10 : 0);
    return { ...doc, score };
  }).filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'zh-CN'));
}
```

- [ ] **Step 4: 生成静态索引端点**

Create `src/pages/search-index.json.ts`:

```ts
import { getPublishedPosts, postSlug } from '../lib/posts';
import { stripMarkdown, type SearchDocument } from '../lib/search';
export const prerender = true;
export async function GET() {
  const posts = await getPublishedPosts();
  const documents: SearchDocument[] = posts.map((post) => ({
    slug: postSlug(post), title: post.data.title, summary: post.data.summary,
    tags: post.data.tags, type: post.data.type, body: stripMarkdown(post.body ?? ''),
  }));
  return new Response(JSON.stringify(documents), { headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=3600',
  } });
}
```

- [ ] **Step 5: 运行测试和构建**

Run: `npm test -- tests/search.test.ts && npm run build`

Expected: `3 passed`; `dist/search-index.json` exists and contains no drafts.

### Task 2: 可访问搜索弹窗

- [ ] **Step 1: 拆分样式**

Move the `<style>` block from `src/components/site/SearchDialog.tsx` to `src/components/site/search-dialog.css` and import it. Replace the text trigger with a search icon from `/icons/ui.svg#search`; keep `aria-label="搜索"` and `title="搜索（⌘K）"`.

- [ ] **Step 2: 按需加载正文索引**

Add `documents`, `loading`, and `loadFailed` state. On the first transition to open, fetch `/search-index.json`; use `rankSearch(documents, q)` when loaded and the existing metadata filter when loading fails. Never fetch during initial page render.

- [ ] **Step 3: 实现焦点闭环**

Add refs for trigger, dialog and input. When opened, remember `document.activeElement`, focus input, trap Tab between dialog focusables, close on Escape or overlay click, and restore the remembered element after closing. Set `aria-busy` while loading and announce the result count through an `aria-live="polite"` region.

- [ ] **Step 4: 验证键盘行为**

Test `⌘/Ctrl+K → 输入 → ArrowDown → Enter`, `Escape`, forward Tab and reverse Tab. Expected: focus never escapes an open dialog and returns to the trigger after close.

### Task 3: 可解释关联排序

- [ ] **Step 1: 扩展类型**

Modify `src/lib/types.ts`:

```ts
export type RelationReason = 'link' | 'series' | 'tag';
export interface RankedNeighbor { slug: string; score: number; reasons: RelationReason[]; }
// Add to GraphNode:
series?: string;
```

- [ ] **Step 2: 写关联排序失败测试**

Extend `tests/graph.test.ts` with four nodes: `a→b`, `a/c` same series, `a/d` common tag. Assert `rankNeighbors('a', graph)` returns `b, c, d` and reasons `link`, `series`, `tag` respectively.

- [ ] **Step 3: 实现确定性排序**

Add `rankNeighbors(slug, graph, limit = 6)` to `src/lib/graph.ts`:

```ts
export function rankNeighbors(slug: string, graph: GraphData, limit = 6): RankedNeighbor[] {
  const origin = graph.nodes.find((node) => node.slug === slug);
  if (!origin) return [];
  const linked = new Set(neighborsOf(slug, graph, graph.nodes.length));
  return graph.nodes.flatMap((node) => {
    if (node.slug === slug) return [];
    const reasons: RelationReason[] = [];
    let score = 0;
    if (linked.has(node.slug)) { reasons.push('link'); score += 100; }
    if (origin.series && node.series === origin.series) { reasons.push('series'); score += 50; }
    const sharedTags = node.tags.filter((tag) => origin.tags.includes(tag));
    if (sharedTags.length) { reasons.push('tag'); score += sharedTags.length * 10; }
    return score ? [{ slug: node.slug, score, reasons }] : [];
  }).sort((a, b) => b.score - a.score ||
    Date.parse(graph.nodes.find((n) => n.slug === b.slug)?.date ?? '') -
    Date.parse(graph.nodes.find((n) => n.slug === a.slug)?.date ?? '')).slice(0, limit);
}
```

- [ ] **Step 4: 把 series 写入图节点**

Modify `src/lib/build-graph.ts` node mapping with `series: p.data.series`.

- [ ] **Step 5: 集成文章关联原因**

Modify `src/pages/posts/[slug].astro` to call `rankNeighbors`, join results with GraphNode data, and pass reasons to `NeighborCards.astro`. Render labels `正文链接 / 同系列 / 共同主题` beside each neighbor title.

- [ ] **Step 6: 运行图谱测试**

Run: `npm test -- tests/graph.test.ts`

Expected: old graph tests and the new ranking test pass.

### Task 4: 主题地图与时间线

- [ ] **Step 1: 创建地图组件**

Create `src/components/garden/GardenMap.tsx`. Use `layoutNodes(nodes)` and `clusterCenters(nodes, positions)`; render visible graph edges, cluster labels, and one focusable `<g role="button" tabIndex={0}>` per node. Enter/Space calls `onSelect(slug)`; every node exposes its full title through `<title>` and visible `shortLabel()` text.

- [ ] **Step 2: 创建渲染失败边界**

Create `GardenMapBoundary.tsx` as a React class error boundary accepting `fallback: ReactNode`; `getDerivedStateFromError()` sets `failed: true`, and a failed boundary renders the supplied `GardenTimeline` fallback.

- [ ] **Step 3: 拆分工具栏与样式**

Move view/type/status/tag/query controls into `GardenToolbar.tsx`. Move GardenView inline CSS to `garden-view.css`; move GardenTimeline inline CSS to `garden-timeline.css`; create `garden-map.css`. Replace all gradient backgrounds in these files with solid tokens and borders.

- [ ] **Step 4: 精简 GardenView**

Keep `GardenView.tsx` under 220 lines. Supported views are `map | timeline`. Restore `ReaderStateV1.preferences.gardenView`; without saved preference use map on wide screens and timeline for `(max-width: 760px)` or reduced motion. Keep existing filter logic and NodePreview.

- [ ] **Step 5: 延后 hydrate 并展示关联原因**

Use `rankNeighbors` for `selectedNeighbors`; update `NodePreview.tsx` to display reason labels and preserve keyboard close behavior. Keep the direct “阅读全文” link. Change `src/pages/garden.astro` from `client:load` to `client:visible`.

- [ ] **Step 6: 验证降级**

Disable JavaScript and confirm the server-rendered initial garden remains readable. Emulate `390×844` and reduced motion; expected initial client view is timeline. Restore a saved `map` preference on desktop; expected map is selected.

### Task 5: 验证与提交

- [ ] Run: `npm test && npx tsc --noEmit && npm run build`.
- [ ] Expected: all tests pass, TypeScript exits 0, Astro build succeeds.
- [ ] Run: `wc -l src/components/garden/* src/components/site/SearchDialog.tsx src/components/site/search-dialog.css`.
- [ ] Expected: every changed file is at most 300 lines.
- [ ] 请求授权后提交：

```bash
git add src/lib/search.ts tests/search.test.ts src/pages/search-index.json.ts src/components/site/SearchDialog.tsx src/components/site/search-dialog.css src/lib/types.ts src/lib/build-graph.ts src/lib/graph.ts tests/graph.test.ts src/components/garden src/components/post/NeighborCards.astro 'src/pages/posts/[slug].astro'
git commit -m "feat(discovery): 强化搜索与花园探索"
```
