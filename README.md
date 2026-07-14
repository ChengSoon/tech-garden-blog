# 技术刊 · 数字花园

Astro 驱动的个人技术博客：杂志级阅读 + 双向链接花园。  
首页 / Now 有一个**全屏实体唱机**主视觉（抽碟上盘、封面贴图、多碟切换）。

## 开发

```bash
npm install
npm run dev
```

## 测试 / 构建

```bash
npm test
npm run build
npm run preview
```

---

## 日常发布文章（一行流程）

线上地址：**https://tech-garden-blog.pages.dev/**  
已接通 **GitHub Actions → Cloudflare Pages**：推 `main` 即自动构建上线。

```text
写 Markdown → git push origin main → Actions 绿了 → 站点更新
```

### 1. 新建文章

在 `src/content/posts/` 新建 `my-post.md` 或 `.mdx`：

```md
---
title: 文章标题
summary: 一句话摘要
date: 2026-07-14
type: essay          # essay | note
status: seedling     # seedling | growing | evergreen
tags: [astro, garden]
links: []            # 出链 slug，如 [welcome-essay]
# hero: /covers/my.jpg
# draft: true        # 草稿不发布
---

正文……
```

### 2. 本地预览（可选）

```bash
npm run dev
# 确认无误后
npm run build
```

### 3. 推送上线

```bash
git add src/content/posts/my-post.md
git commit -m "feat(posts): 发布《文章标题》"
git push origin main
```

去 GitHub → **Actions** → **Deploy Cloudflare Pages** 看是否成功（约 1 分钟）。

> 不在本机写代码时：用 GitHub 网页编辑 `src/content/posts/`，提交到 `main` 同样会触发部署。

### 站点信息

- `astro.config.mjs` → `site`（现为 Pages 域名）
- 作者：`src/data/site.ts`
- 唱机曲目：`src/data/listening.ts` + `public/covers/listening/`

---

## Cloudflare Pages 自动部署（已配置）

| 项 | 值 |
| --- | --- |
| 项目 | `tech-garden-blog` |
| 线上 | https://tech-garden-blog.pages.dev/ |
| 触发 | `push` → `main`，或手动 `workflow_dispatch` |
| 工作流 | `.github/workflows/deploy-cloudflare-pages.yml` |
| Secrets | `CLOUDFLARE_API_TOKEN` · `CLOUDFLARE_ACCOUNT_ID` |

### Token 失效时

当前 Secret 可能来自本机 `wrangler login` 的 OAuth，**会过期**。失效后：

1. 打开 [Create API Token](https://dash.cloudflare.com/profile/api-tokens)
2. 用模板 **Edit Cloudflare Workers**（含 Pages 写权限）
3. 在仓库 **Settings → Secrets → Actions** 更新 `CLOUDFLARE_API_TOKEN`
4. Account ID 固定为：`4555fd402f493f78358d5f5d98abcdca`

### 本地手动部署（可选）

```bash
npx wrangler login   # 仅首次或登录过期时
npm run cf:deploy
```

### 备选：Cloudflare 原生连 Git

若不想维护 Actions Token，可在 CF Dashboard → **Workers & Pages** → 项目 → **Settings → Builds** 里 **Connect to Git**，由 Cloudflare 直接构建（与 Actions 二选一即可，避免重复部署）。


## 唱机

- 组件：`src/components/media/ImmersiveDeck.tsx`  
- 出现位置：首页首屏、`/now`  
- 操作：上盘并播放 → 碟片从封套抽出到转盘 → 唱臂落下旋转；可切换碟片 / 出仓  

## 旁注（MDX）

见 `src/content/posts/welcome-essay.mdx`。
