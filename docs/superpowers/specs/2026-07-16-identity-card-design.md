# 对外名片闭环 — 设计说明

**日期：** 2026-07-16  
**状态：** 已实现  
**方案：** A · 最小名片包（作品可扫 + 分享元数据够用）  
**基线：** 延续 `2026-07-13-blog-design.md` 静态优先架构与 content 驱动约定；不引入后端 / CMS / 评论 / 统计。

---

## 1. 目标与边界

### 1.1 问题

站点阅读与花园体验已完整，但「对外名片」弱：

1. 作品（每日打卡、技术刊本身）埋在文章里，About 只有代表作文章列表，**无法在 30 秒内扫完「做过什么」**。
2. 社交分享 meta 不完整：`og:image` 默认头像且可能为**相对路径**；无 `og:url` / Twitter Card / JSON-LD，链接发出去预览弱。

### 1.2 一句话目标

> 让陌生人在站内快速认识作者与作品，并把任意页面链接发出去时预览标题、摘要、图片都正常。

### 1.3 成功标准

1. `/projects` 至少展示 2 个项目卡片（每日打卡、技术刊博客）。
2. About 页有「作品」摘要区，可跳到 `/projects` 与各项目外链 / 相关文章。
3. 首页、About、`/projects`、任一篇文章：`og:title` / `og:description` / `og:image` / `og:url` 均为**绝对 URL**，图片可访问。
4. 页面含 Person + WebSite（全站）与 BlogPosting（文章）JSON-LD。
5. 顶栏可进入「作品」；核心内容在无 JS 下仍可访问。
6. 不新增 Uses 页、评论、统计、自动 OG 海报生成服务。

### 1.4 明确不做

| 不做 | 原因 |
|------|------|
| Uses / 工具栈页 | 本轮非目标 |
| 评论 / 新闻信 / 浏览量 | 一期全局不做；非名片最小闭环 |
| 构建期自动生成每篇海报图 | 成本高，列入后续增强 |
| 项目详情长页 / CMS | yaml 卡片 + 可选 relatedPosts 足够 |
| 改唱机、花园核心交互 | 与名片无关 |
| 多作者、账号体系 | 越界 |

---

## 2. 信息架构

### 2.1 新增路由

| 路径 | 职责 |
|------|------|
| `/projects` | 作品列表（名片主入口） |
| （可选后续）`/projects/[id]` | **本轮不做**；卡片链到 `url` / `repo` / 相关文章即可 |

### 2.2 导航

顶栏在「系列」与「客串」之间插入：

```
阅读 · 花园 · 系列 · 作品 · 客串 · Now · 关于
```

页脚在「客串」旁增加「作品」链接。

### 2.3 About 角色

About 保持「识」的枢纽，结构变为：

1. 简介（现有 profile）
2. 兴趣方向（现有）
3. **作品摘要**（新增：`featured` 项目最多 3 个 + 「全部作品 →」）
4. 代表作文章（现有 featured posts）

不把完整项目列表塞进 About。

### 2.4 访客路径

| 场景 | 路径 |
|------|------|
| 简历 / 自我介绍外链 | `/about` 或 `/projects` |
| 看某个作品细节 | 项目卡 → `url` / `repo` / related 文章 |
| 分享一篇长文 | 文章 URL → 正确 OG 预览 |
| 分享整站 | 首页 URL → 品牌 OG |

---

## 3. 数据模型

### 3.1 Content Collection：`projects`

路径：`src/content/projects/*.{yaml,yml,json}`  
每项一个文件，**不写进业务代码**（与 friends 一致）。

```yaml
name: 每日打卡
summary: 给两个人的习惯系统：打卡、XP、闯关与双人同步。
role: Full-stack · Product
status: shipped          # idea | wip | shipped | archived
stack: [Expo, Express, TypeScript]
url: https://example.com/   # 可选，产品站 / 应用页
repo: https://github.com/...  # 可选
cover: /covers/projects/habit-checkin.svg
relatedPosts: [daily-habit-checkin]  # 可选，post slug
featured: true
order: 10
year: 2026                 # 可选，展示用
```

**Schema（Zod）要点：**

| 字段 | 类型 | 约束 |
|------|------|------|
| `name` | string | 必填 |
| `summary` | string | 必填 |
| `role` | string | 可选 |
| `status` | enum | 默认 `shipped` |
| `stack` | string[] | 默认 `[]` |
| `url` | url | 可选 |
| `repo` | url | 可选 |
| `cover` | string | 可选，站内路径 |
| `relatedPosts` | string[] | 默认 `[]`，slug |
| `featured` | boolean | 默认 `false` |
| `order` | number | 默认 `0`，越小越靠前 |
| `year` | number | 可选 |

校验：`url` 与 `repo` 至少有一个，或 `relatedPosts` 非空——保证卡片可点到某处。实现时在 loader 后校验或文档约定；schema 层用 `.refine` 更稳。

### 3.2 种子数据（本轮入库）

1. **每日打卡** — cover 已有；`relatedPosts: [daily-habit-checkin]`；repo/url 以作者提供为准，缺省时仅链文章。
2. **技术刊 · 数字花园** — 本站；`url` 用 `Astro.site` / site 配置域名；`repo` 用 `site.githubRepo`。

### 3.3 查询封装

新增 `src/lib/projects.ts`：

- `loadProjects()`：全部，按 `order` 升序，同 order 按 name
- `loadFeaturedProjects(limit = 3)`：`featured === true` 优先，不足则按 order 补齐

类型导出放 `src/lib/types.ts` 或同文件，保持与 friends 模式一致。

### 3.4 站点数据微调（可选、最小）

`src/data/site.ts`：

- 若补 `email`，About / Footer 可露出（**非阻断**）
- 不在 `site.ts` 写项目列表

---

## 4. 页面与组件

### 4.1 `/projects`（`src/pages/projects/index.astro`）

- Layout：`PageLayout` 或与 About 一致的 `BaseLayout` + 轻量头图气质（**不要**强行全屏唱机抢戏；可用 `has-bg-deck` 弱背景或纯净版，优先可读）。
- 结构：
  - eyebrow：Portfolio / 作品
  - 标题 + 一句 lede（来自 site 或固定文案：「做过、在做、愿意公开的工程。」）
  - 卡片网格：cover · name · summary · stack badges · status · 链接组（站点 / 仓库 / 相关文章）

### 4.2 组件

| 组件 | 职责 |
|------|------|
| `components/projects/ProjectCard.astro` | 单卡展示；无客户端 JS |
| `components/projects/ProjectGrid.astro` | 可选包装；也可页面内 map |

样式：复用现有 token（`--border`、`--brass`、`display` 字体、badge），**不要**新的渐变营销风；密度接近 friends / works 列表，偏编辑刊物而非 SaaS 落地页。

### 4.3 About 改动

在「兴趣方向」与「代表作」之间插入作品摘要：

- 调用 `loadFeaturedProjects(3)`
- 复用 `ProjectCard` 紧凑变体，或缩略列表（cover thumb + 标题 + 一行 summary）
- 链到 `/projects`

### 4.4 文章页分享

- `PostLayout` 向 `BaseLayout` 传入：绝对 `ogImage`（`hero` 若为站内路径则拼 origin；无则默认品牌图）、`description`、canonical path。
- 可选：`ReadingTools` 旁或文末增加「复制链接」——若 `ReadingTools` 已有收藏类能力，优先并入同一工具条，避免第三套按钮。

---

## 5. 分享元数据与 SEO

### 5.1 BaseLayout 增强

`Props` 扩展：

```ts
title: string
description?: string
ogImage?: string        // 可为站内绝对路径 /images/... 或完整 URL
canonicalPath?: string  // 默认 Astro.url.pathname
ogType?: 'website' | 'article'
jsonLd?: Record<string, unknown> | Record<string, unknown>[]  // 可选覆盖/追加
```

**解析规则：**

1. `siteOrigin = Astro.site`（必须在 `astro.config` 已配置；当前为 blog 域名）。
2. 任意相对 `ogImage` → `new URL(ogImage, siteOrigin).href`。
3. `og:url` / `link rel="canonical"` → `new URL(canonicalPath, siteOrigin).href`。
4. 输出：
   - `og:title` `og:description` `og:image` `og:url` `og:type` `og:site_name`
   - `twitter:card` = `summary_large_image`
   - `twitter:title` / `description` / `image`
5. 默认 `ogImage`：优先 `/avatar.webp` 或新增 `public/og-default.png`（若无专用 1200×630，**本轮可用现有 avatar/cover 绝对化**，文档标明后续可换品牌海报）。

### 5.2 JSON-LD

在 `BaseLayout` 默认注入（可被页面 props 扩展）：

**全站（每个页面可带）：**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Cheng · 技术刊",
  "url": "{origin}/",
  "description": "{tagline}",
  "author": { "@type": "Person", "name": "Cheng", "url": "{origin}/about/" }
}
```

**About 追加 Person：**

```json
{
  "@type": "Person",
  "name": "...",
  "jobTitle": "...",
  "url": ".../about/",
  "sameAs": ["github", ...],
  "image": "{absolute avatar}"
}
```

**文章页 BlogPosting：**

```json
{
  "@type": "BlogPosting",
  "headline": "...",
  "description": "...",
  "datePublished": "ISO",
  "image": ["{absolute hero}"],
  "author": { "@type": "Person", "name": "..." },
  "mainEntityOfPage": "{canonical}"
}
```

实现：小纯函数 `src/lib/seo.ts`（`absoluteUrl`, `websiteJsonLd`, `personJsonLd`, `blogPostingJsonLd`），便于单测。

### 5.3 默认图策略（本轮）

| 页面 | og:image |
|------|----------|
| 首页 / 通用 | 默认品牌图（绝对化 avatar 或 og-default） |
| 文章 | `hero` 若存在则用之，否则默认 |
| 作品列表 | 默认或第一张 featured cover |
| About | avatar |

**不**在本轮引入 Satori / 动态 PNG 路由。

---

## 6. 内容与文案

### 6.1 项目页 lede

固定中文一句即可，例如：

> 公开可回访的工程与产品。卡片链到线上地址、仓库或成文拆解。

### 6.2 状态文案

| status | 展示 |
|--------|------|
| idea | 构思中 |
| wip | 进行中 |
| shipped | 已上线 |
| archived | 归档 |

### 6.3 README / content README

在 `src/content/README.md` 增加「作品」一节：如何新增 yaml、字段表、与文章 `relatedPosts` 的关系。

---

## 7. 文件清单（实现时）

| 动作 | 路径 |
|------|------|
| Create | `src/content/projects/*.yaml`（≥2） |
| Create | `src/content/projects/README.md`（可选，或并入 content README） |
| Modify | `src/content.config.ts` — projects collection |
| Create | `src/lib/projects.ts` |
| Create | `src/lib/seo.ts` + `tests/seo.test.ts` |
| Create | `src/pages/projects/index.astro` |
| Create | `src/components/projects/ProjectCard.astro` |
| Modify | `src/pages/about.astro` |
| Modify | `src/layouts/BaseLayout.astro` |
| Modify | `src/layouts/PostLayout.astro` |
| Modify | `src/components/site/Header.astro` / `Footer.astro` |
| Modify | `src/pages/sitemap.xml.ts` — 纳入 `/projects` |
| Modify | `src/content/README.md` |

---

## 8. 测试与验收

### 8.1 自动化

- `seo.ts`：相对路径转绝对；缺 origin 时的行为（以 `astro.config` site 为准，单测传入 base）。
- `projects.ts`：排序、featured 截取、空列表。
- 现有 `npm test` / `npm run build` 必须通过。

### 8.2 手工 / 冒烟

1. `npm run build` 后检查 `dist` 中首页与某文章 HTML 含 `og:url` 绝对地址与 `application/ld+json`。
2. 本地打开 `/projects`、`/about`，确认卡片与导航。
3. （可选）用 [opengraph.xyz](https://www.opengraph.xyz/) 或类似工具测线上 URL（部署后）。

### 8.3 质量门禁

- 新文件遵守仓库惯例：组件职责单一；`seo` / `projects` 纯函数可测。
- 不引入新运行时依赖（除非后续单独开 OG 图专项）。
- 视觉：亮/暗主题下卡片边框与文字对比可读。

---

## 9. 风险与后续

| 风险 | 缓解 |
|------|------|
| 无专用 1200×630 图，微信预览一般 | 绝对化现有 cover；后续加 og-default 或自动海报 |
| 项目外链未填 | refine 要求 url/repo/relatedPosts 至少一个 |
| 导航项变多，移动端拥挤 | 沿用现有 mobile details 菜单；文案保持两字「作品」 |
| relatedPosts slug 写错 | 构建期可 warn（可选）；列表页过滤无效 slug |

**后续增强（非本轮）：**

- 构建期 OG 海报
- `/projects/[id]` 详情
- Uses 页
- 隐私统计

---

## 10. 实现分期建议

单 PR / 单 plan 可一次做完，内部分步：

1. `seo.ts` + BaseLayout / PostLayout meta  
2. projects collection + lib + 种子 yaml  
3. `/projects` + ProjectCard + 导航  
4. About 摘要 + sitemap + content README  
5. 测试与 build 验收  

---

## 11. 决策记录

| 决策 | 选择 | 备选放弃原因 |
|------|------|----------------|
| 范围 | 作品页 + 分享 meta | 仅 About 塞作品不利外链；自动 OG 图过重 |
| 数据 | content/projects yaml | 不写死 site.ts |
| 详情页 | 本轮不做 | 卡片外链足够 |
| OG 图 | 绝对化现有资源 | 不引入生成管线 |
