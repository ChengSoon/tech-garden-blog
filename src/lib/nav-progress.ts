/**
 * 路由切换顶部进度条的纯状态逻辑（与 DOM 解耦，便于测试）。
 */

export type NavProgressPhase = 'idle' | 'loading' | 'finishing';

export interface NavProgressState {
  phase: NavProgressPhase;
  /** 0..1 */
  value: number;
}

export const NAV_PROGRESS_IDLE: NavProgressState = { phase: 'idle', value: 0 };

/** 开始导航时的初始可见进度 */
export const NAV_PROGRESS_START = 0.12;

/** 加载中最多逼近到的上限（完成前不封顶） */
export const NAV_PROGRESS_CEILING = 0.92;

/**
 * 是否应展示进度条。
 * 同源同路径仅 hash 变化时不展示，避免页内锚点误触。
 */
export function shouldTrackNavigation(fromHref: string, toHref: string): boolean {
  try {
    const from = new URL(fromHref, 'https://example.invalid');
    const to = new URL(toHref, 'https://example.invalid');
    if (from.pathname === to.pathname && from.search === to.search) return false;
    return true;
  } catch {
    return fromHref !== toHref;
  }
}

export function startNavProgress(state: NavProgressState = NAV_PROGRESS_IDLE): NavProgressState {
  if (state.phase === 'loading') {
    return { phase: 'loading', value: Math.max(state.value, NAV_PROGRESS_START) };
  }
  return { phase: 'loading', value: NAV_PROGRESS_START };
}

/**
 * 加载过程中的“假进度”：向 ceiling 做指数逼近，永不越过 ceiling。
 * @param dtMs 距上次推进的毫秒数
 */
export function trickleNavProgress(state: NavProgressState, dtMs: number): NavProgressState {
  if (state.phase !== 'loading') return state;
  const clampedDt = Math.max(0, Math.min(dtMs, 1000));
  // 约每 200ms 吃掉剩余距离的 12%
  const factor = 1 - Math.exp(-clampedDt / 1600);
  const next = state.value + (NAV_PROGRESS_CEILING - state.value) * factor;
  return {
    phase: 'loading',
    value: Math.min(NAV_PROGRESS_CEILING, next),
  };
}

/** 文档准备好后给一个明显抬升，反馈“内容已到位” */
export function markPrepared(state: NavProgressState): NavProgressState {
  if (state.phase !== 'loading') return state;
  return { phase: 'loading', value: Math.max(state.value, 0.72) };
}

export function finishNavProgress(state: NavProgressState): NavProgressState {
  if (state.phase === 'idle') return state;
  return { phase: 'finishing', value: 1 };
}

export function resetNavProgress(): NavProgressState {
  return { ...NAV_PROGRESS_IDLE };
}
