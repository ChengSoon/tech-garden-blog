# 首页阅读叙事 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页重组为“品牌 → 阅读入口 → 最新生长 → 知识地图 → 系列 → 回访”的单向内容叙事。

**Architecture:** 首页在 Astro 构建期解析策展路径、文章、图谱和系列数据，组件只负责展示。唱机在本阶段保留为背景岛屿但改为 idle hydrate；完整的静态首页信号和 Now 唱机在 Phase 5 收口。

**Tech Stack:** Astro、Content Collections、TypeScript、Vitest、CSS Grid。

---

## 文件结构

- Create: `src/data/reading-paths.ts` — 三条人工策展路径。
- Create: `src/lib/reading-paths.ts` — 过滤失效 slug 并保持策展顺序的纯函数。
- Create: `tests/reading-paths.test.ts` — 路径解析测试。
- Create: `src/components/home/ReadingPaths.astro` — “从这里开始”。
- Create: `src/components/home/LatestGrowth.astro` — 最新 Essay / Note 编辑列表。
- Create: `src/components/home/SeriesShelf.astro` — 系列章节与入口。
- Create: `src/components/home/ClosingStrip.astro` — Now、Listening、RSS 回访区。
- Create: `src/styles/home.css` — 首页专用布局。
- Modify: `src/components/home/Hero.astro` — 品牌 H1 与唯一主打文章。
- Modify: `src/components/home/GardenGlimpse.astro` — 真实主题簇和代表节点。
- Modify: `src/pages/index.astro` — 新叙事顺序与数据组装。

### Task 1: 策展路径解析

- [ ] **Step 1: 写失败测试**

Create `tests/reading-paths.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveReadingPaths } from '../src/lib/reading-paths';

const paths = [
  { id: 'systems', title: '构建系统', description: '从架构到实现', slugs: ['a', 'missing', 'b'] },
  { id: 'empty', title: '空路径', description: '应被过滤', slugs: ['missing'] },
];
const items = new Map([
  ['a', { slug: 'a', title: 'A' }],
  ['b', { slug: 'b', title: 'B' }],
]);

describe('resolveReadingPaths', () => {
  it('keeps curated order and drops missing slugs', () => {
    expect(resolveReadingPaths(paths, items)[0].items.map((x) => x.slug)).toEqual(['a', 'b']);
  });
  it('drops paths with no published items', () => {
    expect(resolveReadingPaths(paths, items).map((x) => x.id)).toEqual(['systems']);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/reading-paths.test.ts`

Expected: FAIL because `src/lib/reading-paths.ts` does not exist.

- [ ] **Step 3: 实现路径类型与解析器**

Create `src/lib/reading-paths.ts`:

```ts
export interface ReadingPathDefinition {
  id: string;
  title: string;
  description: string;
  slugs: string[];
}

export interface ResolvedReadingPath<T> extends Omit<ReadingPathDefinition, 'slugs'> {
  items: T[];
}

export function resolveReadingPaths<T>(
  paths: ReadingPathDefinition[],
  items: Map<string, T>,
): ResolvedReadingPath<T>[] {
  return paths
    .map(({ slugs, ...path }) => ({
      ...path,
      items: slugs.flatMap((slug) => {
        const item = items.get(slug);
        return item ? [item] : [];
      }),
    }))
    .filter((path) => path.items.length > 0);
}
```

- [ ] **Step 4: 定义真实策展数据**

Create `src/data/reading-paths.ts`:

```ts
import type { ReadingPathDefinition } from '../lib/reading-paths';

export const readingPaths: ReadingPathDefinition[] = [
  {
    id: 'systems',
    title: '构建系统',
    description: '从静态骨架到交互边界，理解技术选择如何落地。',
    slugs: ['welcome-essay', 'note-astro-islands'],
  },
  {
    id: 'knowledge-map',
    title: '编织知识',
    description: '从节点、链接与反链开始，建立可以继续生长的知识网络。',
    slugs: ['note-graph-basics', 'welcome-essay'],
  },
  {
    id: 'reading-design',
    title: '设计阅读',
    description: '让版式、章节轨和阅读节奏服务长内容。',
    slugs: ['note-reading-layout', 'welcome-essay'],
  },
];
```

- [ ] **Step 5: 运行定向测试**

Run: `npm test -- tests/reading-paths.test.ts`

Expected: `2 passed`.

### Task 2: 实现首页组件

- [ ] **Step 1: 重写品牌 Hero**

Modify `src/components/home/Hero.astro` to accept `lead` and render this hierarchy:

```astro
<section class="home-hero" aria-labelledby="home-title">
  <p class="eyebrow">Independent Technical Journal · Vol. 01</p>
  <h1 id="home-title" class="display">Cheng <span>· 技术刊</span></h1>
  <p class="home-hero__lede">一本可漫游的技术刊，一座仍在生长的知识花园。</p>
  {lead ? (
    <a class="home-hero__lead" href={`/posts/${lead.slug}/`}>
      <span>本期主打</span><strong>{lead.title}</strong><em>{lead.summary}</em>
    </a>
  ) : null}
  <a class="home-hero__next" href="#start">开始阅读 <span aria-hidden="true">↓</span></a>
</section>
```

The hero must be unframed, `min-height: min(76svh, 760px)`, and align content to the editorial grid rather than a split media column.

- [ ] **Step 2: 创建“从这里开始”**

Create `src/components/home/ReadingPaths.astro` with this structure:

```astro
---
interface Item { slug: string; title: string; }
interface Path { id: string; title: string; description: string; items: Item[]; }
const { paths } = Astro.props as { paths: Path[] };
---
<section id="start" class="home-section reading-paths">
  <div class="section-head"><h2>从这里开始</h2><span>3 条阅读路径</span></div>
  <ol>
    {paths.map((path, index) => (
      <li><article>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <div><h3 class="display">{path.title}</h3><p>{path.description}</p></div>
        <ol>{path.items.slice(0, 3).map((item) => <li><a href={`/posts/${item.slug}/`}>{item.title}</a></li>)}</ol>
      </article></li>
    ))}
  </ol>
</section>
```

- [ ] **Step 3: 创建“最新生长”**

Create `src/components/home/LatestGrowth.astro`. Its root is `<section class="home-section latest-growth">`; its list is `<ol>`. Render the newest six posts as rows with `<time>`, Essay/Note label, status dot, linked title, summary and first two tags. Each row has exactly one primary article link and no `.card` class.

- [ ] **Step 4: 创建系列与回访区**

Create `src/components/home/SeriesShelf.astro` from the current inline series markup. Create `src/components/home/ClosingStrip.astro` with three columns: `site.now` linking to `/now`, `catalog[0]` linking to `/now`, and RSS linking to `/subscribe`.

- [ ] **Step 5: 改造花园预览**

Modify `src/components/home/GardenGlimpse.astro` to use `clusterCenters()` and render the three largest tag clusters with counts plus up to five representative node titles. Keep the SVG connection preview as supporting evidence, not the only information.

### Task 3: 组装首页与布局

- [ ] **Step 1: 在页面层解析数据**

Modify `src/pages/index.astro` to create a `Map` of post cards, resolve `readingPaths`, select the newest Essay as `lead`, and pass the newest six posts to `LatestGrowth`.

```ts
const cards = posts.map((post) => ({
  slug: postSlug(post), title: post.data.title, summary: post.data.summary,
  date: post.data.date, type: post.data.type, status: post.data.status, tags: post.data.tags,
}));
const bySlug = new Map(cards.map((card) => [card.slug, card]));
const paths = resolveReadingPaths(readingPaths, bySlug);
const lead = cards.find((card) => card.type === 'essay') ?? cards[0];
```

- [ ] **Step 2: 固定首页顺序**

Render `Hero → ReadingPaths → LatestGrowth → GardenGlimpse → SeriesShelf → ClosingStrip`. Change `ImmersiveDeck` from `client:load` to `client:idle`; Phase 5 will replace it with a static home signal.

- [ ] **Step 3: 创建首页样式**

Create `src/styles/home.css` with these layout anchors and complete the component-specific selectors without changing the grid contract:

```css
.home-shell__content { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 1.25rem; }
.home-shell__content > * { grid-column: 1 / -1; }
.home-hero { min-height: min(76svh, 760px); display: grid; align-content: center; max-width: 58rem; padding-block: 3rem; }
.home-hero h1 { margin: .4rem 0 1rem; font-size: clamp(3rem, 8vw, 6.5rem); }
.home-hero h1 span { display: block; color: var(--accent); font-size: .58em; }
.home-section { padding-block: clamp(2.5rem, 6vw, 5rem); border-top: 1px solid var(--border-strong); }
.reading-paths > ol, .latest-growth > ol { list-style: none; margin: 0; padding: 0; }
.reading-paths article { display: grid; grid-template-columns: 3rem minmax(0, 1fr) minmax(14rem, .8fr); gap: 1.25rem; padding-block: 1.25rem; border-top: 1px solid var(--border); }
@media (max-width: 760px) {
  .home-shell__content { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .home-hero { min-height: min(70svh, 620px); }
  .reading-paths article { grid-template-columns: 2rem 1fr; }
  .reading-paths article > ol { grid-column: 2; }
}
```

Import it from `src/pages/index.astro`.

- [ ] **Step 4: 运行完整验证**

Run: `npm test && npx tsc --noEmit && npm run build`

Expected: all tests pass, TypeScript exits 0, Astro build succeeds.

- [ ] **Step 5: 请求授权后提交**

```bash
git add src/data/reading-paths.ts src/lib/reading-paths.ts tests/reading-paths.test.ts src/components/home src/pages/index.astro src/styles/home.css
git commit -m "feat(home): 重塑首页阅读叙事"
```

### Task 4: 阶段验收

- [ ] 在 `1440×900` 与 `390×844` 截图，确认下一内容区在首屏底部可见。
- [ ] 确认首个 H1 为 `Cheng · 技术刊`，页面只有一个 H1。
- [ ] 确认任何首页区段都没有卡片套卡片或超过一个主动作。
- [ ] 确认策展路径中的失效 slug 不渲染，空路径不占据布局。
