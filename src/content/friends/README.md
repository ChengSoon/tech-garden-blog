# 客串歌单（友链）

每站一个文件，**不要**把友链写进 `src/lib` / `src/data` / 页面组件。

## 新增一轨

1. 在本目录新建 `your-site-id.yaml`（文件名即 id）
2. 按模板填写字段
3. 本地 `npm run build` 看 `/friends/`
4. 提交 PR 或推送到 `main` 即上线

### 模板

```yaml
name: 站点名称
url: https://example.com/
owner: 站长署名          # 可选
description: 一句话 liner notes，说明为什么进歌单
category: affinity       # regular | affinity | tools
tags: [写作, 工程]       # 可选
monogram: 站             # 可选，碟心 1–2 字
accent: "#2f6f66"        # 可选，碟片光晕色
order: 10                # 可选，越小越靠前
```

### category 对应碟面

| 值 | 页面展示 |
|----|----------|
| `regular` | Side A · 常听 |
| `affinity` | Side B · 同频 |
| `tools` | Bonus · 采样 |

### 投轨流程

访客走 [GitHub Issues](https://github.com/ChengSoon/tech-garden-blog/issues) 提交信息 → 维护者在本目录新增 yaml → 合并部署。
