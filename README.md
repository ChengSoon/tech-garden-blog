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

## 部署后如何发布文章

本站是 **Git 驱动的静态站**（无后台 CMS）。发文流程：

```text
写 Markdown → 本地预览 → git push → 托管平台自动构建上线
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

### 2. 本地检查

```bash
npm run dev
npm run build
```

### 3. 上线（推荐自动部署）

1. 推送到 GitHub，在 Vercel / Netlify / Cloudflare Pages 导入仓库  
2. 构建命令：`npm run build`，输出目录：`dist`  
3. 以后每次发文：

```bash
git add src/content/posts/my-post.md
git commit -m "feat(posts): 发布《文章标题》"
git push
```

### 4. 部署前必改

- `astro.config.mjs` 的 `site` → 真实域名  
- 作者：`src/data/site.ts`  
- 唱机曲目：`src/data/listening.ts` + `public/covers/listening/`

---


---

## Cloudflare Pages 自动部署

仓库已配置 **Cloudflare Pages** 部署（`wrangler.toml` + GitHub Actions）。

### 方式一：Cloudflare 控制台绑定 Git（推荐，最省事）

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 授权 GitHub，选择仓库 `ChengSoon/tech-garden-blog`
3. 构建设置：
   - **Framework preset**: Astro（或 None）
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`（默认）
4. 环境变量（可选）：`ASTRO_TELEMETRY_DISABLED=1`
5. Save and Deploy

之后每次 `git push` 到 `main` 都会自动构建发布。  
部署成功后会得到 `https://tech-garden-blog.pages.dev`（项目名可能略有不同）。

### 方式二：GitHub Actions + API Token

1. Cloudflare → **My Profile** → **API Tokens** → **Create Token**
   - 使用模板 **Edit Cloudflare Workers**，或自定义权限包含 **Account · Cloudflare Pages · Edit**
2. 记下 **Account ID**（Workers & Pages 右侧边栏）
3. GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions**，新增：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. 推送到 `main` 后，工作流 `Deploy Cloudflare Pages` 会自动部署

### 本地手动部署（可选）

```bash
npm install
npx wrangler login
npm run cf:deploy
```

### 部署后记得改域名

把 `astro.config.mjs` 里的 `site` 改成你的 `*.pages.dev` 或自定义域名，然后 push 一次。


## 唱机

- 组件：`src/components/media/ImmersiveDeck.tsx`  
- 出现位置：首页首屏、`/now`  
- 操作：上盘并播放 → 碟片从封套抽出到转盘 → 唱臂落下旋转；可切换碟片 / 出仓  

## 旁注（MDX）

见 `src/content/posts/welcome-essay.mdx`。
