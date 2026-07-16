# 对外名片闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 作品页 + 分享元数据最小闭环：`/projects` 可扫作品，全站 OG/Twitter/JSON-LD 使用绝对 URL。

**Architecture:** 新增 content collection `projects`（yaml，仿 friends）；`src/lib/seo.ts` 纯函数负责绝对 URL 与 JSON-LD；`BaseLayout` 统一输出 meta；About 嵌 featured 项目摘要。无后端、无 OG 图生成服务。

**Tech Stack:** Astro 5 Content Collections、TypeScript、Vitest、静态 HTML meta / JSON-LD。

**Spec:** `docs/superpowers/specs/2026-07-16-identity-card-design.md`

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/lib/seo.ts` | absoluteUrl、JSON-LD 构建 |
| `tests/seo.test.ts` | seo 纯函数单测 |
| `src/lib/projects.ts` | 加载/排序/featured 项目 |
| `tests/projects.test.ts` | 排序与 featured |
| `src/content.config.ts` | projects schema |
| `src/content/projects/*.yaml` | 种子数据 |
| `src/pages/projects/index.astro` | 作品列表页 |
| `src/components/projects/ProjectCard.astro` | 项目卡片 |
| `src/layouts/BaseLayout.astro` | meta + JSON-LD 插槽 |
| `src/layouts/PostLayout.astro` | 传入 ogImage / jsonLd |
| `src/pages/about.astro` | 作品摘要 |
| Header / Footer / sitemap / content README | 导航与文档 |

### Task 1: SEO 纯函数与布局 meta

- [x] `tests/seo.test.ts` + `src/lib/seo.ts`
- [x] 改 `BaseLayout`：绝对 og/canonical/twitter + jsonLd script
- [x] 改 `PostLayout` + `posts/[slug].astro`：hero → ogImage，BlogPosting JSON-LD
- [x] `npm test` 通过

### Task 2: Projects 数据层

- [x] content collection + 2 个 yaml 种子
- [x] `lib/projects.ts` + 单测
- [x] content README 补充

### Task 3: 页面与导航

- [x] ProjectCard + `/projects`
- [x] Header/Footer 导航
- [x] About 摘要区
- [x] sitemap 含 `/projects/`

### Task 4: 验证

- [x] `npm test && npm run build`
- [x] 检查 dist 中 og:url 与 ld+json

