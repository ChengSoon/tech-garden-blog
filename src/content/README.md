# 内容发布指南

文章相关展示**不要**写死在 `src/data` 或页面组件里。发文只动 `src/content/`。

## 新文章

1. 在 `posts/` 新建 `my-slug.md` 或 `my-slug.mdx`
2. 填写 frontmatter（见下）
3. 正文里可引用 `/images/...` 配图
4. `npm run build` 验证后提交

### 关键 frontmatter

| 字段 | 作用 |
|------|------|
| `title` / `summary` / `date` | 基础信息 |
| `type` | `essay` 长文 · `note` 笔记 |
| `status` | `seedling` / `growing` / `evergreen` |
| `tags` | 主题标签（花园簇、归档筛选、自动路径） |
| `series` | 对应 `series/{id}.json` 的 id |
| `order` | 系列内章节序 |
| `links` | 显式互链 slug 列表 |
| `hero` | 封面图路径（可选） |
| `draft: true` | 不发布 |
| `featured: true` | 进入精选 / 关于页代表作 |
| `featuredOrder` | 精选排序（小在前） |
| `lead: true` | 首页 Hero 主打（建议只一篇） |

不写 `featured` / `lead` 时：
- 精选回退：最新长文 → 最新文章
- 主打回退：精选第一篇 → 最新长文 → 最新文章

## 阅读路径

编辑 `paths/*.yaml`：

```yaml
title: 路径标题
description: 一句话说明
order: 1
posts:
  - slug-a
  - slug-b
```

若 `paths/` 为空，首页会按文章 `tags` 自动生成路径。

## 系列

1. `series/{id}.json` 写标题与摘要  
2. 文章 frontmatter：`series: {id}` + `order`

## 客串歌单（友链）

编辑 `friends/*.yaml`，**每站一个文件**。不要把友链写进代码。

```yaml
name: 站点名称
url: https://example.com/
owner: 站长
description: 一句话推荐
category: affinity   # regular | affinity | tools
tags: [写作]
order: 10
```

详情见 [`friends/README.md`](./friends/README.md)。投轨入口：GitHub Issues。


## 作品

编辑 `projects/*.yaml`，**每个项目一个文件**。不要把作品列表写进代码。

```yaml
name: 项目名称
summary: 一句话说明
role: Full-stack · Product   # 可选
status: shipped             # idea | wip | shipped | archived
stack: [Astro, TypeScript]
url: https://example.com/   # 可选
repo: https://github.com/...  # 可选
cover: /covers/projects/x.svg
relatedPosts: [my-post-slug]  # 可选
featured: true              # About 摘要
order: 10
year: 2026
```

`url` / `repo` / `relatedPosts` 至少填一项。列表页：`/projects`。

## 站点身份

作者名、简介、Now、社交链接等长期信息在 `src/data/site.ts`。  
**不要**在这里写文章 slug。
