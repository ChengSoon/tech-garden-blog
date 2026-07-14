# 技术博客 + 数字花园 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭建可部署的个人技术刊站点：杂志级阅读、双向链接邻居、花园双视图（星座 + 网格），内容以 MD/MDX 驱动。

**Architecture:** Astro + Content Collections 在构建期解析内容，生成页面、RSS、`graph.json` 与 backlinks；文章页以静态 HTML 为主，主题切换 / 花园图 / 侧滑预览以客户端岛屿按需 hydrate。图谱边 = Markdown 内链 ∪ frontmatter `links`，构建时去重。

**Tech Stack:** Astro 5 (TypeScript)、MD/MDX、Tailwind CSS 4（或 3，以 `npm create astro` 默认可稳定集成的版本为准）、Node 内置 test 或 vitest（图谱纯函数）、部署目标 Cloudflare Pages / Vercel / 静态 `dist`。

**Spec:** `docs/superpowers/specs/2026-07-13-blog-design.md`

---

## 文件结构（锁定）

```
/
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── tailwind.config.mjs          # 若 Tailwind v3；v4 则用 @tailwindcss/vite 约定
├── .gitignore
├── public/
│   ├── favicon.svg
│   └── og-default.png          # 可先占位
├── src/
│   ├── content.config.ts       # Content Collections schema
│   ├── content/
│   │   ├── posts/              # essay + note 混放，靠 frontmatter.type 区分
│   │   │   ├── welcome-essay.md
│   │   │   ├── note-graph-basics.md
│   │   │   ├── note-reading-layout.md
│   │   │   └── note-astro-islands.md
│   │   └── series/
│   │       └── getting-started.json  # 或 .yaml：id, title, summary, order of slugs
│   ├── lib/
│   │   ├── types.ts            # 共享类型
│   │   ├── slug.ts             # 路径/slug 工具
│   │   ├── reading-time.ts
│   │   ├── links.ts            # 从 body 提取内链
│   │   ├── graph.ts            # 构建 nodes/edges/backlinks
│   │   └── posts.ts            # 查询封装：published、byTag、bySeries
│   ├── styles/
│   │   ├── global.css          # 设计 token、主题变量
│   │   └── prose.css           # 长文排版
│   ├── components/
│   │   ├── site/
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── ThemeToggle.tsx # 或 .astro + 小脚本
│   │   │   └── SearchDialog.tsx # MVP：标题/标签过滤即可
│   │   ├── post/
│   │   │   ├── PostMeta.astro
│   │   │   ├── TableOfContents.astro
│   │   │   ├── ReadingProgress.astro
│   │   │   ├── NeighborCards.astro
│   │   │   ├── SeriesNav.astro
│   │   │   └── Backlinks.astro
│   │   ├── garden/
│   │   │   ├── GardenView.tsx  # 视图切换 + 状态
│   │   │   ├── GardenGrid.tsx
│   │   │   ├── GardenGraph.tsx # SVG 星座
│   │   │   └── NodePreview.tsx # 侧滑预览
│   │   └── home/
│   │       ├── Hero.astro
│   │       ├── FeaturedPosts.astro
│   │       ├── GardenGlimpse.astro
│   │       └── NowStrip.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── PostLayout.astro
│   │   └── PageLayout.astro
│   └── pages/
│       ├── index.astro
│       ├── about.astro
│       ├── now.astro
│       ├── articles/
│       │   └── index.astro     # 归档
│       ├── garden.astro
│       ├── series/
│       │   ├── index.astro
│       │   └── [id].astro
│       ├── tags/
│       │   └── [tag].astro
│       ├── posts/
│       │   └── [slug].astro
│       ├── rss.xml.ts
│       └── graph.json.ts       # 可选：暴露 graph；或仅 build 时写 public
├── tests/
│   ├── links.test.ts
│   ├── graph.test.ts
│   └── reading-time.test.ts
└── docs/superpowers/...
```

**职责边界：**

| 单元 | 职责 |
|------|------|
| `lib/links.ts` + `lib/graph.ts` | 纯函数：解析链接、建图；可单测 |
| `lib/posts.ts` | 对 Content Collections 的查询封装 |
| `layouts/*` | 壳与 SEO，不含业务列表逻辑 |
| `components/post/*` | 文章页零件 |
| `components/garden/*` | 仅花园交互岛屿 |
| `pages/*` | 路由组装数据 → 组件 |

---

## Task 1: 仓库初始化与 Astro 脚手架

**Files:**
- Create: 整个 Astro 项目根文件（`package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `.gitignore` 等）
- Modify: `.gitignore`（保留已有 `.superpowers/` 等规则并合并脚手架默认）

- [ ] **Step 1: 初始化 git（若尚未初始化）**

```bash
cd /Users/cheng/work/Project/Blog
git init
```

- [ ] **Step 2: 用官方脚手架创建 Astro 项目到当前目录**

优先非交互（若 CLI 支持）；否则手动等价配置。

```bash
cd /Users/cheng/work/Project/Blog
npm create astro@latest . -- --template minimal --typescript strict --install --no-git --yes
```

若目录非空导致失败：在临时目录创建后把 `package.json`、`src`、`astro.config.*`、`tsconfig.json` 移入，并合并 `.gitignore`。

Expected: `package.json` 含 `astro`；`npm run build` 可跑通（下一步装依赖后）。

- [ ] **Step 3: 安装依赖与集成**

```bash
npm install
npx astro add tailwind mdx --yes
npm install -D vitest
```

在 `package.json` scripts 增加：

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: 验证空站可构建**

```bash
npm run build
```

Expected: 成功产出 `dist/`。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: 初始化 Astro 与 Tailwind MDX 脚手架"
```

---

## Task 2: 设计 token 与 BaseLayout

**Files:**
- Create: `src/styles/global.css`, `src/styles/prose.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/site/Header.astro`, `src/components/site/Footer.astro`, `src/components/site/ThemeToggle.astro`
- Modify: `src/pages/index.astro`（暂用 BaseLayout 占位）

- [ ] **Step 1: 写入 CSS 变量（浅/深色）**

`src/styles/global.css` 核心（可按字体微调，但 token 名保持一致）：

```css
:root {
  --bg: #f7f4ef;
  --bg-elevated: #fffdf9;
  --text: #1c1917;
  --text-muted: #57534e;
  --border: #e7e5e4;
  --accent: #1d4ed8;
  --accent-soft: color-mix(in oklab, var(--accent) 12%, transparent);
  --code-bg: #f5f5f4;
  --font-sans: "IBM Plex Sans", "Noto Sans SC", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", "Sarasa Mono SC", ui-monospace, monospace;
  --content-width: 72ch;
  --header-height: 3.5rem;
}

html.dark {
  --bg: #121211;
  --bg-elevated: #1c1b19;
  --text: #f5f5f4;
  --text-muted: #a8a29e;
  --border: #292524;
  --accent: #60a5fa;
  --code-bg: #292524;
}

html {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
}

body {
  margin: 0;
  min-height: 100vh;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

`src/styles/prose.css`：为 `.prose` 设置字号、行高、标题层级、`pre/code`、链接色（强调色）、图片 max-width。正文栏 `max-width: var(--content-width)`。

- [ ] **Step 2: BaseLayout**

`src/layouts/BaseLayout.astro`：

```astro
---
import '../styles/global.css';
import '../styles/prose.css';
import Header from '../components/site/Header.astro';
import Footer from '../components/site/Footer.astro';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}
const { title, description = '技术刊与数字花园', ogImage = '/og-default.png' } = Astro.props;
const fullTitle = title === 'Home' ? 'Cheng · 技术刊' : `${title} · Cheng`;
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{fullTitle}</title>
    <script is:inline>
      const key = 'theme';
      const saved = localStorage.getItem(key);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
    </script>
  </head>
  <body>
    <Header />
    <main id="main">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 3: Header / Footer / ThemeToggle**

Header 链接：`/articles` 文章、`/garden` 花园、`/series` 系列、`/about` 关于；右侧 ThemeToggle。

ThemeToggle：按钮切换 `document.documentElement.classList` 与 `localStorage.theme` = `light|dark`。

Footer：`/rss.xml`、GitHub（用占位 URL `https://github.com/`，About 可覆盖展示）、版权年。

- [ ] **Step 4: 首页挂上布局并目测**

```bash
npm run dev
```

Expected: 顶栏导航、主题切换、纸感背景可见。

- [ ] **Step 5: Commit**

```bash
git add src/styles src/layouts src/components/site src/pages/index.astro public
git commit -m "feat(ui): 全局布局与深浅色设计 token"
```

---

## Task 3: 内容模型 Content Collections

**Files:**
- Create: `src/content.config.ts`
- Create: `src/lib/types.ts`
- Create: `src/content/posts/*.md`（4 篇示例，Task 11 可再润色）
- Create: `src/content/series/getting-started.json`

- [ ] **Step 1: 定义 schema**

`src/content.config.ts`（Astro 5 Content Layer 写法；若模板为旧版则用 `src/content/config.ts` + `defineCollection` 等价字段）：

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z.enum(['essay', 'note']),
    status: z.enum(['seedling', 'growing', 'evergreen']).default('growing'),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    series: z.string().optional(),
    order: z.number().optional(),
    links: z.array(z.string()).default([]),
    hero: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const series = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    // id 默认取文件名；posts 用 series 字段引用该 id
  }),
});

export const collections = { posts, series };
```

`src/lib/types.ts`：

```ts
export type PostType = 'essay' | 'note';
export type GrowthStatus = 'seedling' | 'growing' | 'evergreen';

export interface GraphNode {
  slug: string;
  title: string;
  type: PostType;
  status: GrowthStatus;
  tags: string[];
  summary: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  backlinks: Record<string, string[]>;
}
```

- [ ] **Step 2: 写入最少可互链示例内容**

`src/content/posts/welcome-essay.md`：

```md
---
title: 欢迎来到这座技术刊
date: 2026-07-01
type: essay
status: evergreen
tags: [meta, garden]
summary: 这是站点的代表长文：说明刊与园如何一起工作。
series: getting-started
order: 1
links: [note-graph-basics, note-reading-layout]
---

# 开篇

正文中也可链接到 [图谱基础](/posts/note-graph-basics)。

## 为什么是刊 + 园

……

## 如何阅读本站

……
```

另三篇 Note：`note-graph-basics.md`、`note-reading-layout.md`、`note-astro-islands.md`，彼此 `links` 形成至少 1 个三角/簇；`tags` 含共享标签如 `garden`。

`src/content/series/getting-started.json`：

```json
{
  "title": "从零认识本站",
  "summary": "用最短路径搞懂技术刊与数字花园。"
}
```

- [ ] **Step 3: 查询封装**

`src/lib/posts.ts`：

```ts
import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;

export async function getPublishedPosts(): Promise<PostEntry[]> {
  const all = await getCollection('posts');
  return all
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function postSlug(post: PostEntry): string {
  return post.id.replace(/\.(md|mdx)$/, '');
}
```

（若 loader 下 `id` 已是无扩展名 slug，则 `postSlug` 直接 `return post.id`——以实现时 `console.log` 一次为准，全站统一。）

- [ ] **Step 4: 验证 collections**

```bash
npm run build
```

Expected: 无 schema 校验错误。

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content src/lib/types.ts src/lib/posts.ts
git commit -m "feat(content): 定义 posts/series schema 与示例内容"
```

---

## Task 4: 链接解析与图谱纯函数（TDD）

**Files:**
- Create: `src/lib/links.ts`, `src/lib/graph.ts`, `src/lib/reading-time.ts`
- Create: `tests/links.test.ts`, `tests/graph.test.ts`, `tests/reading-time.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Vitest 配置**

`vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: 写失败测试 — 内链提取**

`tests/links.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { extractPostLinks } from '../src/lib/links';

describe('extractPostLinks', () => {
  it('extracts /posts/slug links from markdown', () => {
    const md = 'See [A](/posts/alpha) and [B](/posts/beta/).';
    expect(extractPostLinks(md).sort()).toEqual(['alpha', 'beta']);
  });

  it('ignores external and non-post links', () => {
    const md = '[x](https://example.com) [y](/about) [z](/posts/ok)';
    expect(extractPostLinks(md)).toEqual(['ok']);
  });
});
```

- [ ] **Step 3: 运行确认失败**

```bash
npm test
```

Expected: FAIL — `extractPostLinks` 未定义。

- [ ] **Step 4: 实现 `links.ts`**

```ts
const POST_HREF = /\]\((?:\/posts\/)([a-z0-9-]+)\/?\)/gi;

export function extractPostLinks(markdown: string): string[] {
  const found = new Set<string>();
  for (const match of markdown.matchAll(POST_HREF)) {
    found.add(match[1]);
  }
  return [...found];
}

export function mergeLinks(fromBody: string[], fromFrontmatter: string[]): string[] {
  return [...new Set([...fromBody, ...fromFrontmatter])];
}
```

- [ ] **Step 5: 图谱测试与实现**

`tests/graph.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { buildGraph } from '../src/lib/graph';
import type { GraphNode } from '../src/lib/types';

const nodes: GraphNode[] = [
  { slug: 'a', title: 'A', type: 'essay', status: 'evergreen', tags: ['t'], summary: 'a' },
  { slug: 'b', title: 'B', type: 'note', status: 'growing', tags: ['t'], summary: 'b' },
  { slug: 'c', title: 'C', type: 'note', status: 'seedling', tags: ['x'], summary: 'c' },
];

describe('buildGraph', () => {
  it('builds undirected edges and backlinks from outbound map', () => {
    const outbound = { a: ['b', 'c'], b: ['a'], c: [] };
    const g = buildGraph(nodes, outbound);
    expect(g.edges).toEqual(
      expect.arrayContaining([
        { source: 'a', target: 'b' },
        { source: 'a', target: 'c' },
      ]),
    );
    expect(g.backlinks.b).toContain('a');
    expect(g.backlinks.a).toContain('b');
  });

  it('drops edges to missing nodes', () => {
    const g = buildGraph(nodes, { a: ['missing', 'b'] });
    expect(g.edges).toEqual([{ source: 'a', target: 'b' }]);
  });
});
```

`src/lib/graph.ts`：

```ts
import type { GraphData, GraphEdge, GraphNode } from './types';

export function buildGraph(
  nodes: GraphNode[],
  outbound: Record<string, string[]>,
): GraphData {
  const slugs = new Set(nodes.map((n) => n.slug));
  const edgeKey = new Set<string>();
  const edges: GraphEdge[] = [];
  const backlinks: Record<string, string[]> = Object.fromEntries(
    nodes.map((n) => [n.slug, [] as string[]]),
  );

  for (const [source, targets] of Object.entries(outbound)) {
    if (!slugs.has(source)) continue;
    for (const target of targets) {
      if (!slugs.has(target)) continue;
      const key = [source, target].sort().join('->');
      if (!edgeKey.has(key)) {
        edgeKey.add(key);
        edges.push({ source, target });
      }
      if (!backlinks[target].includes(source)) backlinks[target].push(source);
    }
  }

  return { nodes, edges, backlinks };
}

export function neighborsOf(
  slug: string,
  graph: GraphData,
  limit = 6,
): string[] {
  const set = new Set<string>();
  for (const e of graph.edges) {
    if (e.source === slug) set.add(e.target);
    if (e.target === slug) set.add(e.source);
  }
  for (const b of graph.backlinks[slug] ?? []) set.add(b);
  return [...set].filter((s) => s !== slug).slice(0, limit);
}
```

- [ ] **Step 6: reading-time**

```ts
// src/lib/reading-time.ts
export function readingTimeMinutes(text: string, wpm = 300): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // 中文无空格时用字符近似
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const units = words + cjk / 2;
  return Math.max(1, Math.round(units / wpm));
}
```

测试：空串 → 1；英文约 300 词 → 1。

- [ ] **Step 7: 全部测试通过**

```bash
npm test
```

Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add src/lib tests vitest.config.ts package.json
git commit -m "feat(graph): 链接解析与图谱构建纯函数"
```

---

## Task 5: 构建期图谱装配 + 文章路由

**Files:**
- Create: `src/lib/build-graph.ts`（从 collections 拉数 → `buildGraph`）
- Create: `src/pages/posts/[slug].astro`
- Create: `src/layouts/PostLayout.astro`
- Create: `src/components/post/*`（Meta、TOC、Progress、Neighbors、SeriesNav、Backlinks）

- [ ] **Step 1: `build-graph.ts`**

```ts
import { getPublishedPosts, postSlug } from './posts';
import { extractPostLinks, mergeLinks } from './links';
import { buildGraph } from './graph';
import type { GraphData, GraphNode } from './types';

export async function getGraph(): Promise<GraphData> {
  const posts = await getPublishedPosts();
  const nodes: GraphNode[] = posts.map((p) => ({
    slug: postSlug(p),
    title: p.data.title,
    type: p.data.type,
    status: p.data.status,
    tags: p.data.tags,
    summary: p.data.summary,
  }));

  const outbound: Record<string, string[]> = {};
  for (const p of posts) {
    const slug = postSlug(p);
    const body = typeof p.body === 'string' ? p.body : '';
    outbound[slug] = mergeLinks(extractPostLinks(body), p.data.links ?? []);
  }
  return buildGraph(nodes, outbound);
}
```

- [ ] **Step 2: PostLayout + 零件**

`PostLayout.astro` 接收：`title, description, type, status, date, tags, readingMinutes, seriesInfo?, neighbors[], backlinks[]`，插槽为渲染后的正文。

- `PostMeta.astro`：日期、时长、标签、状态文案映射  
  - seedling → 萌芽  
  - growing → 生长中  
  - evergreen → 常青  
- `TableOfContents.astro`：从渲染前 markdown 标题或 `h2` 列表生成（可用 `render()` 后不方便时，构建时用正则从 body 抽 `## `）  
- `ReadingProgress.astro`：客户端小脚本，根据 `article` 滚动更新 `scaleX`  
- `NeighborCards.astro`：卡片链到 `/posts/{slug}`  
- `SeriesNav.astro`：上一章/下一章  
- `Backlinks.astro`：Note 页主用

- [ ] **Step 3: `[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';
import { getPublishedPosts, postSlug } from '../../lib/posts';
import { getGraph, /* re-export neighbors */ } from '../../lib/build-graph';
import { neighborsOf } from '../../lib/graph';
import { readingTimeMinutes } from '../../lib/reading-time';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({
    params: { slug: postSlug(post) },
    props: { post },
  }));
}

const { post } = Astro.props;
const slug = postSlug(post);
const { Content, headings } = await render(post);
const graph = await getGraph();
const neighborSlugs = neighborsOf(slug, graph, 6);
const neighborNodes = graph.nodes.filter((n) => neighborSlugs.includes(n.slug));
const backlinkSlugs = graph.backlinks[slug] ?? [];
const minutes = readingTimeMinutes(post.body ?? '');

// series: 同 series 字段 posts 按 order 排序，算 prev/next
const all = await getPublishedPosts();
const seriesPosts = post.data.series
  ? all
      .filter((p) => p.data.series === post.data.series)
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
  : [];
const idx = seriesPosts.findIndex((p) => postSlug(p) === slug);
const prev = idx > 0 ? seriesPosts[idx - 1] : null;
const next = idx >= 0 && idx < seriesPosts.length - 1 ? seriesPosts[idx + 1] : null;
---
<PostLayout
  title={post.data.title}
  description={post.data.summary}
  type={post.data.type}
  status={post.data.status}
  date={post.data.date}
  tags={post.data.tags}
  readingMinutes={minutes}
  headings={headings}
  neighbors={neighborNodes}
  backlinks={backlinkSlugs.map((s) => graph.nodes.find((n) => n.slug === s)!).filter(Boolean)}
  seriesId={post.data.series}
  prev={prev && { slug: postSlug(prev), title: prev.data.title }}
  next={next && { slug: postSlug(next), title: next.data.title }}
>
  <Content />
</PostLayout>
```

布局细节：essay 显示 TOC + 进度；note 强调 Backlinks + 状态；两者都显示 Neighbors。

- [ ] **Step 4: 构建并打开一篇**

```bash
npm run build && npm run preview
```

Expected: `/posts/welcome-essay` 有正文、邻居、系列导航（若有）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/build-graph.ts src/pages/posts src/layouts/PostLayout.astro src/components/post
git commit -m "feat(post): 文章页模板与邻居/系列导航"
```

---

## Task 6: 文章归档、标签、系列页

**Files:**
- Create: `src/pages/articles/index.astro`
- Create: `src/pages/tags/[tag].astro`
- Create: `src/pages/series/index.astro`, `src/pages/series/[id].astro`
- Create: `src/layouts/PageLayout.astro`（简单标题+内容宽）

- [ ] **Step 1: 归档页**

按年分组列表：标题、日期、type 徽章、status 点、summary 一行。提供 tag 链接 chips（从所有 posts 聚合）。

- [ ] **Step 2: 标签页**

`getStaticPaths` 从所有 tags 生成；列表过滤该 tag。

- [ ] **Step 3: 系列**

- `/series`：卡片列表（title、summary、已发布章数）  
- `/series/[id]`：引言 + 有序章节（只列已发布 posts）；CTA 链到 `order` 最小篇

章数计算：`getPublishedPosts().filter(p => p.data.series === id).length`。

- [ ] **Step 4: 构建验证**

```bash
npm run build
```

Expected: 上述路由均在 `dist` 中。

- [ ] **Step 5: Commit**

```bash
git add src/pages/articles src/pages/tags src/pages/series src/layouts/PageLayout.astro
git commit -m "feat(nav): 归档标签与系列页"
```

---

## Task 7: 花园页（网格 + SVG 星座 + 预览）

**Files:**
- Create: `src/pages/garden.astro`
- Create: `src/components/garden/GardenView.tsx`, `GardenGrid.tsx`, `GardenGraph.tsx`, `NodePreview.tsx`
- Modify: `astro.config.mjs` — 确保 React 集成（若用 TSX）

- [ ] **Step 1: 添加 React 岛屿支持**

```bash
npx astro add react --yes
```

- [ ] **Step 2: `garden.astro` 注入数据**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import GardenView from '../components/garden/GardenView';
import { getGraph } from '../lib/build-graph';

const graph = await getGraph();
---
<BaseLayout title="花园" description="知识星座与节点网格">
  <section class="garden-page">
    <h1>花园</h1>
    <p class="lede">从图漫游，或从网格筛选。</p>
    <GardenView client:load graph={graph} />
  </section>
</BaseLayout>
```

- [ ] **Step 3: GardenView 状态**

- `view: 'graph' | 'grid'`，初始化读 `localStorage.gardenView`，变更时写回  
- 筛选：type、status、tag（tag 列表由 nodes 聚合）  
- 选中 slug → 打开 `NodePreview`  
- 将过滤后的 nodes/edges 传给子组件（边：两端都在过滤结果中才显示）

- [ ] **Step 4: GardenGrid**

响应式卡片：标题、type、status 色点、summary、tags。点击 → `onSelect(slug)`。

- [ ] **Step 5: GardenGraph（轻量 SVG，禁止重库）**

布局算法（确定性，够 MVP）：

```ts
function layout(nodes: GraphNode[]): Record<string, { x: number; y: number }> {
  const byTag = new Map<string, GraphNode[]>();
  for (const n of nodes) {
    const key = n.tags[0] ?? 'misc';
    byTag.set(key, [...(byTag.get(key) ?? []), n]);
  }
  const pos: Record<string, { x: number; y: number }> = {};
  const clusters = [...byTag.entries()];
  clusters.forEach(([_, list], ci) => {
    const cx = 200 + (ci % 3) * 220;
    const cy = 160 + Math.floor(ci / 3) * 200;
    list.forEach((n, i) => {
      const a = (i / Math.max(list.length, 1)) * Math.PI * 2;
      const r = 40 + list.length * 6;
      pos[n.slug] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });
  });
  return pos;
}
```

- 画 `line`（edges）再画 `circle`（essay 实心 / note 空心）  
- hover 显示 title；click → preview  
- `viewBox` 自适应；容器 CSS `max-width: 100%`  
- `prefers-reduced-motion`：无位移动画

- [ ] **Step 6: NodePreview**

侧滑面板（`role="dialog"`，`Esc` 关闭，焦点陷阱可简化为关闭按钮）：标题、summary、type/status、链到全文 `/posts/{slug}`。

- [ ] **Step 7: 空态**

`nodes.length < 8` 时在页面顶部显示提示：「花园仍在生长」+ 主题桩说明（文案即可）。

- [ ] **Step 8: 手动验证**

```bash
npm run dev
```

Expected: 切换视图记忆、筛选、预览、进全文；`npm run build` 通过。

- [ ] **Step 9: Commit**

```bash
git add src/pages/garden.astro src/components/garden package.json astro.config.mjs
git commit -m "feat(garden): 双视图花园与节点预览"
```

---

## Task 8: 首页组装

**Files:**
- Create: `src/components/home/Hero.astro`, `FeaturedPosts.astro`, `GardenGlimpse.astro`, `NowStrip.astro`
- Create: `src/content/site/now.md` 或 `src/data/now.ts`（推荐 `src/data/site.ts` 集中站级文案）
- Modify: `src/pages/index.astro`

- [ ] **Step 1: `src/data/site.ts`**

```ts
export const site = {
  name: 'Cheng',
  tagline: '一本可漫游的技术刊，一座仍在生长的知识花园。',
  now: '本季在打磨 Astro 数字花园与长文排版。',
  github: 'https://github.com/',
  featuredSlugs: ['welcome-essay', 'note-graph-basics', 'note-reading-layout'],
};
```

- [ ] **Step 2: Hero**

H1/一句 tagline；按钮「读精选」锚到 `#featured`，「逛花园」链 `/garden`。

- [ ] **Step 3: FeaturedPosts**

按 `featuredSlugs` 取 post；1 大 + 其余小卡片。缺 slug 时回退最新 essay。

- [ ] **Step 4: GardenGlimpse**

复用 `getGraph()`，渲染静态缩小 SVG（可 import 同一 `layout` 工具函数到 `src/lib/garden-layout.ts` 供服务端与客户端共用——**若 Task 7 把 layout 写在 tsx 内，本步抽出到 `src/lib/garden-layout.ts`**）。点击跳转 `/garden`。

- [ ] **Step 5: 系列条 + NowStrip**

进行中系列：有 `series` 的 posts 聚合；Now 一行链 `/now`。

- [ ] **Step 6: 目测首页信息层级**

```bash
npm run dev
```

Expected: 10 秒内能理解站点主题与先读哪篇。

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro src/components/home src/data src/lib/garden-layout.ts
git commit -m "feat(home): 精选与花园一瞥首页"
```

---

## Task 9: About / Now / RSS / SEO 收尾

**Files:**
- Create: `src/pages/about.astro`, `src/pages/now.astro`, `src/pages/rss.xml.ts`
- Create: `public/favicon.svg`, `public/og-default.png`（可用简单 SVG/色块占位）
- Modify: `src/components/site/Footer.astro`（GitHub 用 `site.github`）

- [ ] **Step 1: About**

人话介绍段落 + 代表作 3 链（`site.featuredSlugs`）+ 兴趣标签列表（写在 `site.ts`：`interests: string[]`）。

- [ ] **Step 2: Now**

展示 `site.now` + 最后更新日期（手写 `site.nowUpdated = '2026-07-13'`）。

- [ ] **Step 3: RSS**

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getPublishedPosts, postSlug } from '../lib/posts';
import { site } from '../data/site';

export async function GET(context) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${site.name} · 技术刊`,
    description: site.tagline,
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.summary,
      pubDate: p.data.date,
      link: `/posts/${postSlug(p)}/`,
    })),
  });
}
```

```bash
npm install @astrojs/rss
```

`astro.config.mjs` 设置：

```js
export default defineConfig({
  site: 'https://example.com', // 部署时改成真实域名
  // ...
});
```

- [ ] **Step 4: 构建验证 RSS**

```bash
npm run build
```

Expected: `dist/rss.xml` 存在且含示例文标题。

- [ ] **Step 5: Commit**

```bash
git add src/pages/about.astro src/pages/now.astro src/pages/rss.xml.ts src/data public astro.config.mjs package.json
git commit -m "feat(site): About Now 与 RSS"
```

---

## Task 10: MVP 搜索（标题 + 标签）

**Files:**
- Create: `src/components/site/SearchDialog.tsx`
- Modify: `src/components/site/Header.astro`

- [ ] **Step 1: 搜索数据**

在 Header 或布局中由页面传入太重；改为 `SearchDialog` 接收 `items: {slug,title,tags,summary,type}[]`，在 `BaseLayout` 中异步不方便——用 **中间页数据**：创建 `src/pages/search-index.json.ts` 输出精简 JSON，客户端 fetch；或 Header 用 Astro 在每个页面 include 时由 BaseLayout 调 `getPublishedPosts()` 序列化进 `SearchDialog client:idle`。

推荐后者（无额外请求）：

```astro
---
// BaseLayout.astro 片段
import { getPublishedPosts, postSlug } from '../lib/posts';
const searchItems = (await getPublishedPosts()).map((p) => ({
  slug: postSlug(p),
  title: p.data.title,
  tags: p.data.tags,
  summary: p.data.summary,
  type: p.data.type,
}));
---
<SearchDialog client:idle items={searchItems} />
```

- [ ] **Step 2: SearchDialog UX**

- 快捷按钮打开；`Cmd/Ctrl+K`  
- 输入过滤 title/tags（case-insensitive）  
- 结果列表键盘上下 + Enter  
- `role="dialog"`，Esc 关闭  

- [ ] **Step 3: 验证**

手动：输入 `花园` 或 `garden` 能命中示例文。

- [ ] **Step 4: Commit**

```bash
git add src/components/site/SearchDialog.tsx src/layouts/BaseLayout.astro src/components/site/Header.astro
git commit -m "feat(search): 标题与标签即时搜索"
```

---

## Task 11: 示例内容润色、响应式与验收

**Files:**
- Modify: `src/content/posts/*`（补全中文正文、互链、标题层级）
- Modify: CSS / 组件断点（花园在窄屏默认 `grid`）
- Create: 可选 `README.md`（开发与部署说明）

- [ ] **Step 1: 内容**

保证：≥1 essay、≥3 notes、共享 tag 簇、series 至少 1 章；About/Now 无占位「Lorem」。

- [ ] **Step 2: 响应式检查点**

- 375px：单栏文章、花园默认网格、导航可折叠（Header 增加简单 details/summary 或 CSS 隐藏为菜单按钮）  
- 若 Header 无移动菜单，本步补上  

- [ ] **Step 3: 对照 spec §9 验收清单手动勾选**

```bash
npm test && npm run build
```

Expected: 测试全绿，build 成功。

- [ ] **Step 4: README**

```md
# 技术刊 · 数字花园

## 开发
npm install
npm run dev

## 测试 / 构建
npm test
npm run build

## 写文章
在 src/content/posts/ 新增 Markdown，填写 frontmatter（见 design spec）。
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: 示例内容润色与 README"
```

---

## Task 12: 部署配置（静态）

**Files:**
- Create: `public/_headers`（可选，Cloudflare）或仅文档说明
- Modify: `astro.config.mjs` `site` 为真实 URL（若用户尚未提供，保持 example 并在 README 标明必改项）

- [ ] **Step 1: 确认适配器**

纯静态：`astro build` → `dist`，无需 adapter。若用 Vercel/Cloudflare 官方集成，仅在用户选定平台后添加——**默认不装 adapter**。

- [ ] **Step 2: 生产构建**

```bash
npm run build && npm run preview
```

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs README.md
git commit -m "chore: 部署说明与 site URL 配置"
```

---

## 实施注意（给执行者）

1. **slug 来源**：以 Content Layer 实际 `post.id` 为准，全站只通过 `postSlug()` 读取。  
2. **YAGNI**：禁止引入 D3/cytoscape/three；禁止评论/CMS/账号。  
3. **文件行数**：单文件趋近 300 行则拆分；组件逻辑优先抽 `src/lib`。  
4. **中文 commit**：遵守 `<type>(scope): 中文摘要`。  
5. **每 Task 结束**：`npm test`（若有相关测试）+ `npm run build` 再 commit。  
6. **不要改** design spec 除非发现矛盾并先停下询问。

---

## Plan Self-Review

### Spec coverage

| Spec 项 | Task |
|---------|------|
| 信息架构导航 | 2, 6, 8, 9 |
| Essay/Note 模板、TOC/进度/邻居 | 5 |
| 双向链接与 graph | 4, 5, 7 |
| 花园双视图 + 预览 | 7 |
| 系列 | 3, 5, 6 |
| About/Now | 9 |
| 深浅色 | 2 |
| RSS/SEO | 5 meta + 9 |
| 搜索标题/标签 | 10 |
| 示例内容冷启动 | 3, 11 |
| Astro+MDX+Tailwind | 1 |
| P2 彩蛋/时间线 | **刻意不做** |

### Placeholder scan

无 TBD；平台域名用 `example.com` 并在 README 标明替换——可接受。

### Type consistency

- `GraphNode` / `GraphData` / `GrowthStatus` / `PostType` 在 Task 3 定义，4–8 复用  
- 路由统一 `/posts/[slug]`  
- 状态文案映射仅 UI 层，数据层用英文 enum  

---

## 执行方式（完成后由用户选择）

Plan 完成后使用：

1. **Subagent-Driven（推荐）** — `superpowers:subagent-driven-development`  
2. **Inline Execution** — `superpowers:executing-plans`  

当前会话按用户选择启动。
