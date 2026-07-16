# P0 内容冲刺 — 选题提案（待拍板）

**状态：** 1/2/3 已发布（Note）；4/5 仍待定  
**说明：** 下列文章**不会自动发布**。你勾选 / 改写后，再进入写稿与上线。

## 目标

在现有 2 篇长文基础上，把花园与 AI 系列养到「可漫游」：

- AI 系列 `ai-primer` 从 1 篇扩到 **≥3 篇**
- 至少形成一个有互链的星座（3+ 节点）
- 阅读路径 `paths/*.yaml` 与真实文章对齐

## 建议发布清单（5 篇）

| # | 建议 slug | 标题（可改） | 类型 | 系列/关系 | 主要价值 |
|---|-----------|--------------|------|-----------|----------|
| 1 | `ai-prompt-loop` | AI 提示词循环：从一次对话到可复用流程 | note | `series: ai-primer` order 2；链到 `ai-practical-guide` | 补「开始使用」路径 |
| 2 | `ai-usage-boundaries` | AI 使用边界：隐私、事实与责任 | note | `series: ai-primer` order 3；链到 #1 与入门文 | 补「安全地用」路径 |
| 3 | `garden-linking-method` | 数字花园写作法：为什么笔记要互链 | essay | 链到入门文 + 本站作品文；`tags: [writing, garden]` | 解释站点方法论，给花园第二个主题簇 |
| 4 | `habit-local-first-sync` | 习惯 App：本地优先与双人同步 | note | 链到 `daily-habit-checkin`；可 `relatedPosts` 回填作品 | 工程深度，撑起产品星座 |
| 5 | `astro-magazine-static` | 静态站也能有杂志感：Astro 技术刊取舍 | note | 链到 #3；作品 `tech-garden-blog` relatedPosts | 本站拆解，作品详情更饱满 |

## 路径回填建议（文章上线后）

```yaml
# paths/ai-concepts.yaml
posts: [ai-practical-guide, garden-linking-method]

# paths/ai-practice.yaml
posts: [ai-practical-guide, ai-prompt-loop]

# paths/ai-guardrails.yaml
posts: [ai-practical-guide, ai-usage-boundaries]
```

可新增路径：

```yaml
# paths/product-build.yaml（可选）
title: 做出能用的小产品
description: 从双人打卡到工程取舍。
order: 4
posts:
  - daily-habit-checkin
  - habit-local-first-sync
```

## 你需要做的决定

1. **要哪几篇**（可全选 / 删减 / 换题）  
2. **语气与长度**：短 Note（800–1500 字）还是长 Essay（2500+）  
3. **是否立即写正文**：确认后我按你的选择起草 MDX 并挂好 `links` / series / paths  

## 不做的事（本提案）

- 不在未确认前写进 `src/content/posts/` 并发布  
- 不伪造阅读量或杜撰项目经历  

---

确认格式示例回复：

> 做 1、2、3；标题 OK；都用 Note；先写草稿 draft:true  
