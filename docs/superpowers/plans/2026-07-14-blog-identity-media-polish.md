# 身份、媒体与整合收尾 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 将首页唱机降为克制的聆听信号，在 Now 页保留用户触发的完整唱机体验，并完成 About、RSS、无渐变视觉和全站质量收口。

**Architecture:** 首页使用静态 Astro 组件，不为媒体加载 React；Now 使用拆分后的 CdPlayer island。播放器时钟、唱片展示和控制区分离，旧 ImmersiveDeck 保留为兼容包装器，避免删除文件和破坏引用。

**Tech Stack:** Astro、React hooks、HTML audio、SVG assets、CSS、Vitest、Browser Playwright API。

---

## 文件结构

- Create: `src/components/media/ListeningSignal.astro` — 首页静态聆听入口。
- Create: `src/lib/audio-deck.ts` — 切碟与 seek 的纯函数。
- Create: `tests/audio-deck.test.ts` — 播放器边界测试。
- Create: `src/components/media/useAudioDeck.ts` — audio、模拟动画时钟与错误状态。
- Create: `src/components/media/DiscShowcase.tsx` — 唱片、封面与唱臂。
- Create: `src/components/media/DeckControls.tsx` — 播放、切碟、进度与状态。
- Create: `src/components/media/deck-shell.css` — 布局与面板。
- Create: `src/components/media/deck-disc.css` — 唱片与唱臂。
- Create: `src/components/media/deck-controls.css` — 控件与响应式规则。
- Modify: `src/components/media/CdPlayer.tsx` — 只做组合与曲目选择。
- Modify: `src/components/media/cd-player.css` — 三个样式文件的入口。
- Modify: `src/components/media/ImmersiveDeck.tsx` — 兼容包装器。
- Modify: `src/components/media/immersive-deck.css` — 移除旧大型实现。
- Modify: `src/pages/index.astro` — 移除背景岛屿并使用 ListeningSignal。
- Modify: `src/pages/now.astro` — 完整唱机、当前研究与近期更新。
- Modify: `src/pages/about.astro` — 编辑档案布局。
- Modify: `src/pages/subscribe.astro` — RSS 快捷订阅。
- Modify: `src/components/post/CoverArt.astro`、`src/components/post/ReadingProgress.astro`、相关 CSS/SVG — 最终无渐变清理。

### Task 1: 播放器纯逻辑与拆分

- [x] **Step 1: 写失败测试**

Create `tests/audio-deck.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clampSeek, nextTrackIndex } from '../src/lib/audio-deck';

describe('nextTrackIndex', () => {
  it('wraps in both directions', () => {
    expect(nextTrackIndex(2, 3, 'next')).toBe(0);
    expect(nextTrackIndex(0, 3, 'prev')).toBe(2);
  });
  it('guards an empty list', () => expect(nextTrackIndex(0, 0, 'next')).toBe(0));
});
describe('clampSeek', () => {
  it('clamps ratio and duration', () => {
    expect(clampSeek(-1, 120)).toBe(0);
    expect(clampSeek(2, 120)).toBe(120);
    expect(clampSeek(.5, 120)).toBe(60);
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/audio-deck.test.ts`

Expected: FAIL because `src/lib/audio-deck.ts` does not exist.

- [x] **Step 3: 实现纯函数**

Create `src/lib/audio-deck.ts`:

```ts
export type DeckDirection = 'next' | 'prev';
export function nextTrackIndex(index: number, length: number, direction: DeckDirection) {
  if (length <= 0) return 0;
  return direction === 'next' ? (index + 1) % length : (index - 1 + length) % length;
}
export function clampSeek(ratio: number, duration: number) {
  const safeDuration = Math.max(0, Number.isFinite(duration) ? duration : 0);
  return Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0)) * safeDuration;
}
```

- [x] **Step 4: 创建播放器 hook**

Create `src/components/media/useAudioDeck.ts`. Its public API is:

```ts
export function useAudioDeck(track: ListeningTrack) {
  return { audioRef, playing, current, duration, error, toggle, seek, reset };
}
```

Move audio event binding, requestAnimationFrame simulation, visibility pause and cleanup from `CdPlayer.tsx` into the hook. Initial `playing` is always false. If `track.src` exists, `toggle` uses `<audio>`; without src it only drives the mechanical animation and simulated progress. `error` contains a short Chinese failure message and never throws.

- [x] **Step 5: 拆分展示与控制组件**

Create `DiscShowcase.tsx` with props `track`, `playing`, `swapping`, `direction`; create `DeckControls.tsx` with track metadata, progress, error, play/seek/previous/next callbacks. When no audio src exists, the primary control accessible label is `启动唱片动画` rather than `播放音频`.

- [x] **Step 6: 精简 CdPlayer**

Keep `CdPlayer.tsx` under 200 lines. It owns track index and swap timing, calls `nextTrackIndex`, calls `useAudioDeck`, and composes `DiscShowcase` plus `DeckControls`. Preserve the current `full | compact` variant API.

- [x] **Step 7: 运行定向测试**

Run: `npm test -- tests/audio-deck.test.ts`

Expected: `3 passed`.

### Task 2: 重建无渐变唱机视觉

- [x] **Step 1: 拆分 CSS 入口**

Replace `src/components/media/cd-player.css` with:

```css
@import "./deck-shell.css";
@import "./deck-disc.css";
@import "./deck-controls.css";
```

- [x] **Step 2: 创建三份扁平媒体样式**

Use solid `--bg-elevated / --bg-deep / --text / --signal` surfaces, borders and shadows. Render grooves with concentric SVG circles or borders, not CSS gradients. Only `.is-playing .deck-disc` rotates; reduced motion disables rotation and all swap translation. Keep every file below 260 lines.

- [x] **Step 3: 保留兼容包装器**

Replace `ImmersiveDeck.tsx` with a wrapper that maps `mode="page"` to `<CdPlayer variant="full">` and `mode="bg"` to `<CdPlayer variant="compact">`. Replace `immersive-deck.css` with a comment pointing to the new deck style entry; do not delete either file.

### Task 3: 首页信号与 Now 页面

- [x] **Step 1: 创建静态首页信号**

Create `src/components/media/ListeningSignal.astro`:

```astro
---
import type { ListeningTrack } from '../../data/listening';
interface Props { track: ListeningTrack; }
const { track } = Astro.props;
---
<a class="listening-signal" href="/now">
  <img src={track.cover} alt="" width="72" height="72" loading="lazy" />
  <span><small>正在聆听</small><strong>{track.title}</strong><em>{track.artist}</em></span>
  <svg width="18" height="18" aria-hidden="true"><use href="/icons/ui.svg#arrow-right"></use></svg>
</a>
```

- [x] **Step 2: 移除首页媒体 island**

Modify `src/pages/index.astro`: remove `ImmersiveDeck`, remove `bodyClass="has-bg-deck"`, and pass `<ListeningSignal track={catalog[0]} />` into the closing strip. Expected: homepage loads no media React JavaScript.

- [x] **Step 3: 重组 Now**

Modify `src/pages/now.astro` to render: title and `site.now`; three current themes from `site.interests`; three latest posts; `<CdPlayer client:visible tracks={catalog} variant="full" />`. Remove copy that explains the background or instructs clicking the disc.

- [x] **Step 4: 验证用户触发**

Load `/now` and wait five seconds without interaction. Expected: disc does not rotate and no audio attempt occurs. Activate the primary control; expected: animation begins, tab hiding pauses it, reduced motion keeps it static.

### Task 4: About、RSS 与扁平封面

- [x] **Step 1: 重构 About**

Modify `src/pages/about.astro` so profile, interests and representative works are unframed editorial sections. Keep avatar, bio, location, social links and three works; remove the outer `.card` treatment from profile and works.

- [x] **Step 2: 重构 RSS**

Modify `src/pages/subscribe.astro` to show the absolute feed URL, copy button, Feedly link and Inoreader link in one primary section, followed by recent articles. Remove the tutorial steps and sitemap explanation. Clipboard failure selects the feed text and changes the live status to `请手动复制`.

- [x] **Step 3: 扁平化文章封面**

Modify `CoverArt.astro`: remove `<linearGradient>`, `<radialGradient>` and vignette gradients. Use one solid palette background, a second rectangular color field, rules, circles and title text. Keep real `hero` images unchanged.

- [x] **Step 4: 重绘三张聆听封面**

Modify `public/covers/listening/*.svg` to use solid fills, lines, circles and typography only. Preserve existing filenames, viewboxes and title identity so catalog data does not change.

### Task 5: 全站无渐变和文件长度收口

- [x] **Step 1: 扫描残留渐变**

Run: `rg -n 'linear-gradient|radial-gradient|conic-gradient|<linearGradient|<radialGradient' src public`

Expected before cleanup: matches in remaining header, prose, garden, preview, reading progress and media files.

- [x] **Step 2: 替换所有匹配项**

Use solid color, border, opacity, SVG line pattern or box-shadow replacements in every reported file. Do not suppress the scan and do not leave unused legacy gradients.

- [x] **Step 3: 复查渐变**

Run the same `rg` command.

Expected: no output.

- [x] **Step 4: 检查文件长度**

Run: `rg --files src | xargs wc -l | awk '$1 > 300 && $2 != "total" {print}'`

Expected: no output. Split any reported file by responsibility before proceeding.

### Task 6: 最终验证与提交

- [x] Run: `npm test`.
- [x] Expected: all existing and new tests pass.
- [x] Run: `npx tsc --noEmit && npm run build && git diff --check`.
- [x] Expected: all commands exit 0 and diff check has no output.
- [ ] Use Playwright to capture `/`, `/articles`, an Essay, `/garden`, `/now`, `/about`, `/subscribe` at `1440×900`, `1024×768`, `390×844`.
- [ ] Test light/dark, reduced motion, keyboard-only search, unavailable localStorage, search failure, clipboard failure and media error.
- [ ] Confirm no content is hidden behind fixed controls and no page has horizontal overflow.
- [ ] 请求授权后提交：

```bash
git add src/components/media src/lib/audio-deck.ts tests/audio-deck.test.ts src/pages/index.astro src/pages/now.astro src/pages/about.astro src/pages/subscribe.astro src/components/post/CoverArt.astro src/components/post/ReadingProgress.astro src/styles src/components/garden src/components/site/Header.astro public/covers/listening
git commit -m "refactor(ui): 完成媒体与全站体验收口"
```
