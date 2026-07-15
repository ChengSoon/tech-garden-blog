# 技术刊深度体验优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不引入后端的前提下，将现有 Astro 技术博客升级为阅读优先、可持续探索、具有唱机记忆点的编辑型技术刊。

**Architecture:** 保持 Astro 静态生成和 Content Collections；浏览器端只以渐进增强方式维护阅读状态、搜索、花园和媒体交互。实施拆成五个顺序阶段，每个阶段都能独立构建、测试和提交，后一阶段只依赖前一阶段的稳定接口。

**Tech Stack:** Astro 5、TypeScript、React 19 islands、Vitest、CSS、localStorage、SVG；不新增运行时依赖。

---

## 设计输入

- 规格：`docs/superpowers/specs/2026-07-14-blog-deep-optimization-design.md`
- 既有规格：`docs/superpowers/specs/2026-07-13-blog-design.md`
- 当前基线：`main`，最近提交 `c8177b1`

## 为什么拆成五份计划

规格包含五组边界清晰但有顺序依赖的工作：全局视觉、首页、阅读状态、发现系统、媒体收尾。它们会先后修改共享样式和页面入口，不适合并行写入；拆分后每份计划均能在失败时单独回退和验收。

## 执行顺序

- [x] **Phase 1：编辑视觉基础**
  - 计划：`docs/superpowers/plans/2026-07-14-blog-editorial-foundation.md`
  - 产物：设计 token、基础样式、统一图标、导航与页脚。
  - 退出条件：全站颜色、间距、按钮和导航统一；测试与构建通过。

- [x] **Phase 2：首页阅读叙事**
  - 计划：`docs/superpowers/plans/2026-07-14-blog-homepage-narrative.md`
  - 产物：品牌首屏、策展路径、最新生长、知识地图预览、系列与回访区。
  - 退出条件：首页形成单向叙事，桌面和移动端均露出下一内容区。

- [x] **Phase 3：本地阅读闭环**
  - 计划：`docs/superpowers/plans/2026-07-14-blog-reading-loop.md`
  - 产物：收藏、历史、进度恢复、阅读偏好、归档筛选与继续阅读。
  - 退出条件：localStorage 正常、损坏和不可用三种状态均不阻断阅读。

- [x] **Phase 4：搜索与花园发现**
  - 计划：`docs/superpowers/plans/2026-07-14-blog-discovery.md`
  - 产物：按需全文索引、可访问搜索、主题地图、关联原因与降级时间线。
  - 退出条件：搜索、筛选、地图、节点预览和键盘交互完整闭环。

- [x] **Phase 5：身份、媒体与整合收尾**
  - 计划：`docs/superpowers/plans/2026-07-14-blog-identity-media-polish.md`
  - 产物：静态首页聆听信号、完整 Now 唱机、About/RSS 优化、无渐变收口和最终 QA。
  - 退出条件：所有相关文件符合长度约束，完整测试、构建和视觉检查有证据。

## 共享文件所有权

| 文件/边界 | 首次修改阶段 | 后续允许修改阶段 |
| --- | --- | --- |
| `src/styles/global.css` 与基础 token | Phase 1 | Phase 5 只做最终清理 |
| `src/layouts/BaseLayout.astro` | Phase 1 | Phase 4 调整搜索数据 |
| `src/pages/index.astro` | Phase 2 | Phase 3 插入继续阅读；Phase 5 替换媒体信号 |
| `src/lib/types.ts` | Phase 4 | 无 |
| `src/layouts/PostLayout.astro` | Phase 3 | Phase 4 展示关联原因 |
| `src/components/garden/*` | Phase 4 | Phase 5 只做样式清理 |
| `src/components/media/*` | Phase 5 | 无 |

## 依赖与 Git 规则

- 不修改 `package.json`、lockfile、CI、Cloudflare 配置或内容 schema。
- 图标采用仓库内的 Lucide 官方 SVG sprite，不安装图标包。
- 响应式 QA 使用 Browser skill 暴露的 Playwright 页面能力，不新增 Playwright 依赖。
- 每个计划中的 commit 步骤执行前必须再次获得用户对 Git 历史操作的授权。
- 当前审批服务若仍阻止 `.git` 写入，保留工作树改动并报告手动提交命令，不尝试绕过。

## 规格覆盖矩阵

| 规格要求 | 实施阶段 |
| --- | --- |
| 冷灰纸白、松绿、朱红、编辑网格 | Phase 1 |
| 首页品牌与内容叙事 | Phase 2 |
| 收藏、历史、进度、字号、栏宽 | Phase 3 |
| 阅读中心多维筛选 | Phase 3 |
| 全文搜索、焦点管理、失败退化 | Phase 4 |
| 主题地图、时间线、关联原因 | Phase 4 |
| Now 唱机、About、RSS | Phase 5 |
| 无渐变、文件长度、最终视觉 QA | Phase 5 |

## 最终整合门禁

- [x] 运行 `npm test`；预期所有 Vitest 测试通过。
- [x] 运行 `npx tsc --noEmit`；预期退出码为 0。
- [x] 运行 `npm run build`；预期 Astro 构建成功并生成 `dist/`。
- [x] 运行 `rg --files src | xargs wc -l | awk '$1 > 300 && $2 != "total" {print}'`；预期无输出。
- [x] 运行 `rg -n 'linear-gradient|radial-gradient|conic-gradient|<linearGradient|<radialGradient' src public`；预期无输出。
- [ ] 用 Playwright 检查 `1440×900`、`1024×768`、`390×844` 三个视口。
- [ ] 在每个视口检查 `/`、`/articles`、一篇 Essay、`/garden`、`/now`、`/about`、`/subscribe`。
- [ ] 检查浅色、深色、`prefers-reduced-motion`、键盘导航、搜索无结果和 localStorage 失败。
- [x] 检查 `git diff --check`；预期无输出。

## 最终提交建议

在五个阶段提交均已完成且整合验证通过后，不再创建额外“总提交”。若审批服务阻止自动提交，按各阶段计划列出的文件范围手动提交，避免把无关改动混入。
