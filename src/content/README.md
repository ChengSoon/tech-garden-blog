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

## 站点身份

作者名、简介、Now、社交链接等长期信息在 `src/data/site.ts`。  
**不要**在这里写文章 slug。
