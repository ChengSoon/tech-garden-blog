# 编辑视觉基础 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立冷灰纸白、松绿与朱红组成的编辑视觉基础，并统一全站导航、按钮、标签、图标和页面网格。

**Architecture:** 将原本集中在 `global.css` 的 token、基础规则和通用组件拆为三个职责单一的样式文件；图标通过仓库内 Lucide SVG sprite 复用。保持现有 Astro 页面与内容结构不变，使后续阶段只消费稳定的视觉原语。

**Tech Stack:** Astro、CSS variables、SVG、Vitest、Astro build。

---

## 文件结构

- Create: `src/styles/tokens.css` — 主题色、字体、尺寸和间距 token。
- Create: `src/styles/base.css` — reset、页面背景、链接、容器和可访问性基础。
- Create: `src/styles/primitives.css` — 按钮、标签、卡片、标题和 section header。
- Create: `public/textures/paper.svg` — 无渐变纸张纹理。
- Create: `public/icons/ui.svg` — Lucide 官方图标 sprite。
- Create: `src/components/site/Icon.astro` — sprite 的类型安全渲染入口。
- Modify: `src/styles/global.css` — 只保留样式入口导入。
- Modify: `src/components/site/Header.astro` — 编辑型导航和图标菜单。
- Modify: `src/components/site/ThemeToggle.astro` — 统一图标与新 theme-color。
- Modify: `src/components/site/Footer.astro` — 收敛为编辑型页尾。
- Modify: `src/layouts/BaseLayout.astro` — 新主题色和字体加载策略。

### Task 1: 固定基线

- [ ] **Step 1: 确认工作树只包含已批准文档**

Run: `git status --short`

Expected: 只出现设计和计划文档；若有其他文件，记录并避免暂存。

- [ ] **Step 2: 运行现有单测**

Run: `npm test`

Expected: `6 passed` test files、`15 passed` tests。

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

Expected: Astro 构建成功，页面与 RSS 均生成。

### Task 2: 拆分视觉 token 与基础样式

- [ ] **Step 1: 创建主题 token**

Create `src/styles/tokens.css` with:

```css
:root {
  --bg: #f1f3ef;
  --bg-elevated: #f8f9f6;
  --bg-soft: #e4e9e3;
  --bg-deep: #d7ded8;
  --text: #141917;
  --text-muted: #616b66;
  --border: #ccd3ce;
  --border-strong: #aeb9b2;
  --accent: #174a42;
  --accent-hover: #0e3832;
  --accent-soft: color-mix(in oklab, var(--accent) 12%, transparent);
  --signal: #c94f38;
  --signal-soft: color-mix(in oklab, var(--signal) 14%, transparent);
  --brass: var(--signal);
  --brass-soft: var(--signal-soft);
  --code-bg: #e8ece7;
  --seedling: #6f8b4a;
  --growing: #b36b32;
  --evergreen: #2d6b5c;
  --font-display: "Cormorant Garamond", "Noto Serif SC", serif;
  --font-sans: "Noto Serif SC", "Songti SC", serif;
  --font-ui: "Sora", "PingFang SC", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --content-width: 68ch;
  --page-max: 1200px;
  --page-gutter: clamp(1rem, 3.4vw, 2.75rem);
  --header-height: 4rem;
  --radius: 2px;
  --radius-lg: 6px;
  --shadow: 0 20px 48px rgb(20 25 23 / 12%);
  --shadow-soft: 0 1px 0 rgb(255 255 255 / 65%);
  color-scheme: light;
}

html.dark {
  --bg: #101412;
  --bg-elevated: #171c19;
  --bg-soft: #202722;
  --bg-deep: #29312c;
  --text: #edf1ed;
  --text-muted: #9ca8a1;
  --border: #303a34;
  --border-strong: #46534b;
  --accent: #84b9a8;
  --accent-hover: #a0cbbb;
  --signal: #ef8066;
  --code-bg: #1b211d;
  --shadow: 0 24px 56px rgb(0 0 0 / 42%);
  --shadow-soft: 0 1px 0 rgb(255 255 255 / 5%);
  color-scheme: dark;
}
```

- [ ] **Step 2: 创建无渐变纸张纹理**

Create `public/textures/paper.svg` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <g fill="#141917" fill-opacity=".055">
    <circle cx="3" cy="5" r=".45"/><circle cx="18" cy="9" r=".35"/>
    <circle cx="9" cy="20" r=".4"/><circle cx="22" cy="22" r=".3"/>
  </g>
</svg>
```

- [ ] **Step 3: 创建基础页面规则**

Create `src/styles/base.css` with reset rules, then use this exact body treatment:

```css
*, *::before, *::after { box-sizing: border-box; }
html {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-ui);
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
body {
  margin: 0;
  min-height: 100vh;
  line-height: 1.6;
  background-color: var(--bg);
  background-image: url('/textures/paper.svg');
}
body > * { position: relative; z-index: 1; }
::selection { background: var(--signal-soft); color: var(--text); }
a { color: var(--accent); text-underline-offset: .2em; }
a:hover { color: var(--accent-hover); }
:focus-visible { outline: 2px solid var(--signal); outline-offset: 3px; }
#main { min-height: calc(100vh - var(--header-height) - 6rem); }
.container {
  width: min(var(--page-max), 100%);
  margin-inline: auto;
  padding-inline: var(--page-gutter);
}
.skip-link { position: fixed; left: 1rem; top: -5rem; z-index: 100; }
.skip-link:focus { top: 1rem; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```

- [ ] **Step 4: 提取通用原语并收敛圆角**

Create `src/styles/primitives.css` with:

```css
.muted { color: var(--text-muted); }
.card { padding: 1.15rem 1.25rem; color: inherit; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-soft); }
a.card:hover, button.card:hover { transform: none; border-color: var(--accent); text-decoration: none; }
.badge { display: inline-flex; align-items: center; gap: .35rem; padding: .2rem .58rem; color: var(--text-muted); background: transparent; border: 1px solid var(--border); border-radius: 999px; font: 500 .7rem/1.4 var(--font-ui); letter-spacing: .07em; }
.dot { width: .42rem; height: .42rem; flex: 0 0 auto; border-radius: 50%; background: var(--growing); }
.dot[data-status="seedling"] { background: var(--seedling); }
.dot[data-status="growing"] { background: var(--growing); }
.dot[data-status="evergreen"] { background: var(--evergreen); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; min-height: 2.75rem; padding: .58rem .9rem; color: var(--text); background: transparent; border: 1px solid var(--border-strong); border-radius: var(--radius); font: 500 .86rem/1 var(--font-ui); text-decoration: none; cursor: pointer; }
.btn:hover { color: var(--accent); border-color: var(--accent); text-decoration: none; }
.btn-primary { color: var(--bg-elevated); background: var(--accent); border-color: var(--accent); }
.btn-primary:hover { color: var(--bg-elevated); background: var(--accent-hover); }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1.15rem; padding-bottom: .75rem; border-bottom: 1px solid var(--border-strong); }
.section-head h2 { margin: 0; font: 600 clamp(1.55rem, 2.2vw, 1.9rem)/1.15 var(--font-display); }
.section-head a { color: var(--text-muted); font: 500 .78rem/1 var(--font-ui); letter-spacing: .08em; text-decoration: none; text-transform: uppercase; }
.eyebrow { margin: 0; color: var(--signal); font: 500 .72rem/1.4 var(--font-ui); letter-spacing: .15em; text-transform: uppercase; }
.display { font-family: var(--font-display); font-weight: 600; letter-spacing: -.03em; line-height: 1.08; }
.rule { height: 1px; margin: 0; background: var(--signal); border: 0; }
```

- [ ] **Step 5: 将全局文件改为入口文件**

Replace `src/styles/global.css` with:

```css
@import "tailwindcss";
@import "./tokens.css";
@import "./base.css";
@import "./primitives.css";
@import "./motion.css";
```

- [ ] **Step 6: 构建验证样式拆分**

Run: `npm run build`

Expected: 构建成功；不存在缺失 CSS 变量或 import 错误。

### Task 3: 统一图标与站点外壳

- [ ] **Step 1: 创建 Lucide sprite 与 Astro 组件**

Create `public/icons/ui.svg` with Lucide 24×24 geometry:

```svg
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></symbol>
  <symbol id="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></symbol>
  <symbol id="moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></symbol>
  <symbol id="menu" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
  <symbol id="x" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></symbol>
  <symbol id="bookmark" viewBox="0 0 24 24"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/></symbol>
  <symbol id="share-2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51 8.59 10.49"/></symbol>
  <symbol id="copy" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></symbol>
  <symbol id="arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></symbol>
</svg>
```

Create `src/components/site/Icon.astro`:

```astro
---
type IconName = 'search' | 'sun' | 'moon' | 'menu' | 'x' | 'bookmark' | 'share-2' | 'copy' | 'arrow-right';
interface Props { name: IconName; size?: number; class?: string; }
const { name, size = 18, class: className } = Astro.props;
---
<svg class={className} width={size} height={size} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <use href={`/icons/ui.svg#${name}`}></use>
</svg>
```

- [ ] **Step 2: 收敛 Header 导航**

Modify `src/components/site/Header.astro` so the labels are `阅读 / 花园 / 系列 / Now / 关于`; replace the mobile “菜单” text with `<Icon name="menu" />`, preserve the accessible label, and remove pill backgrounds from desktop nav hover.

- [ ] **Step 3: 更新主题按钮与浏览器 chrome 色**

Modify `src/components/site/ThemeToggle.astro` to render `Icon` sun/moon symbols. In its `apply()` function use `#f1f3ef` for light and `#101412` for dark. Wrap `localStorage.getItem/setItem` in `try/catch` so unavailable storage falls back to the system theme. Apply the same colors and guarded read in `src/layouts/BaseLayout.astro` theme initialization.

- [ ] **Step 4: 收敛 Footer**

Modify `src/components/site/Footer.astro` to keep the brand statement, `RSS / GitHub / Now / 关于`, and copyright as three aligned editorial rows; remove the tinted footer background.

- [ ] **Step 5: 验证站点外壳**

Run: `npm test && npm run build`

Expected: `15 passed` tests and a successful Astro build.

- [ ] **Step 6: 请求授权后提交**

```bash
git add src/styles src/components/site src/layouts/BaseLayout.astro public/icons public/textures
git commit -m "refactor(ui): 统一编辑视觉基础"
```

### Task 4: 阶段验收

- [ ] 检查 `/`、`/articles`、`/garden`、一篇文章的浅色与深色模式。
- [ ] 确认 Header 在 `390px` 宽度下只显示品牌、搜索、主题和菜单图标。
- [ ] 确认焦点环清晰，图标按钮至少 `44px`，按钮与普通标签不再全部胶囊化。
- [ ] 运行 `wc -l src/styles/*.css src/components/site/*`，确认新文件均不超过 300 行。
