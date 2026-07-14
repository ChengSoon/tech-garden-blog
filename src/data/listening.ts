/** 当前在听的碟架 — 改这里即可更新唱机曲目与封面 */
export interface ListeningTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  /** public 路径，用于碟心与封套贴图 */
  cover: string;
  /** 可选：public 下的音频路径，有则真播放，无则仅视觉进度 */
  src?: string;
  /** 无 src 时的模拟时长（秒） */
  durationSec: number;
  /** 碟片中心备用短字 */
  monogram?: string;
  note?: string;
  /** 封面主色，用于光晕 */
  accent?: string;
}

export const catalog: ListeningTrack[] = [
  {
    id: 'paper-orbit',
    title: 'Paper Orbit',
    artist: 'Late Studio',
    album: 'Ink & Air · Vol. 01',
    cover: '/covers/listening/paper-orbit.svg',
    durationSec: 214,
    monogram: 'PO',
    accent: '#1b3a57',
    note: '写作时循环的氛围曲。碟片可切换，封面贴在封套与碟心上。',
  },
  {
    id: 'midnight-commit',
    title: 'Midnight Commit',
    artist: 'Terminal Soft',
    album: 'Diff Haze',
    cover: '/covers/listening/midnight-commit.svg',
    durationSec: 186,
    monogram: 'MC',
    accent: '#2f6f66',
    note: '深夜改 bug 的背景层。切换碟片时封套与碟心会一起翻面。',
  },
  {
    id: 'garden-static',
    title: 'Garden Static',
    artist: 'Field Notes',
    album: 'Seedling Sessions',
    cover: '/covers/listening/garden-static.svg',
    durationSec: 248,
    monogram: 'GS',
    accent: '#5f7d3b',
    note: '花园漫游用的轻底噪。像一张还没写完的笔记。',
  },
];

/** @deprecated 使用 catalog；保留默认第一张便于旧引用 */
export const listening = catalog[0];
