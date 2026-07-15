/**
 * Astro ClientRouter 页面切换：音符加载指示器。
 * 单例绑定，在 DOM swap 后自动重建节点。
 */
import {
  finishNavProgress,
  markPrepared,
  resetNavProgress,
  shouldTrackNavigation,
  startNavProgress,
  trickleNavProgress,
  type NavProgressState,
} from '../lib/nav-progress';

const ROOT_ID = 'nav-progress';
const ACTIVE_CLASS = 'is-active';
const DONE_CLASS = 'is-done';

const NOTE_CHARS = ['♪', '♫', '♩', '♬', '♭'] as const;

let state: NavProgressState = resetNavProgress();
let trickleTimer: number | null = null;
let hideTimer: number | null = null;
let lastTick = 0;
let navGeneration = 0;
let currentGeneration = 0;

function prefersReduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildMarkup(): string {
  const notes = NOTE_CHARS.map(
    (ch, i) =>
      `<span class="nav-progress__note" style="--i:${i}" data-note>${ch}</span>`,
  ).join('');
  return `
    <div class="nav-progress__rail" aria-hidden="true"></div>
    <div class="nav-progress__trail" aria-hidden="true"></div>
    <div class="nav-progress__lead" aria-hidden="true">
      ${notes}
    </div>
  `;
}

function ensureRoot(): HTMLElement {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'nav-progress';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('role', 'presentation');
    root.innerHTML = buildMarkup();
    document.documentElement.appendChild(root);
  } else if (!root.querySelector('.nav-progress__lead')) {
    root.innerHTML = buildMarkup();
  }
  return root;
}

function applyVisual(): void {
  const root = ensureRoot();
  root.style.setProperty('--nav-p', state.value.toFixed(4));

  if (state.phase === 'idle') {
    root.classList.remove(ACTIVE_CLASS, DONE_CLASS);
    return;
  }

  root.classList.add(ACTIVE_CLASS);
  root.classList.toggle(DONE_CLASS, state.phase === 'finishing');
}

function clearTimers(): void {
  if (trickleTimer !== null) {
    window.clearInterval(trickleTimer);
    trickleTimer = null;
  }
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function begin(fromHref: string, toHref: string): void {
  if (!shouldTrackNavigation(fromHref, toHref)) return;

  clearTimers();
  state = startNavProgress(state);
  lastTick = performance.now();
  applyVisual();

  if (prefersReduced()) {
    state = { phase: 'loading', value: 0.55 };
    applyVisual();
    return;
  }

  trickleTimer = window.setInterval(() => {
    const now = performance.now();
    state = trickleNavProgress(state, now - lastTick);
    lastTick = now;
    applyVisual();
  }, 160);
}

function prepared(): void {
  if (state.phase !== 'loading') return;
  state = markPrepared(state);
  applyVisual();
}

function complete(): void {
  if (state.phase === 'idle') return;

  clearTimers();
  state = finishNavProgress(state);
  applyVisual();

  const hideDelay = prefersReduced() ? 100 : 380;
  hideTimer = window.setTimeout(() => {
    state = resetNavProgress();
    applyVisual();
  }, hideDelay);
}

function boot(): void {
  ensureRoot();
  applyVisual();
}

if (typeof window !== 'undefined') {
  const w = window as Window & { __navProgressBound?: boolean };
  if (!w.__navProgressBound) {
    w.__navProgressBound = true;

    document.addEventListener('astro:before-preparation', (event) => {
      const e = event as Event & { from?: URL; to?: URL; signal?: AbortSignal };
      const from = e.from?.href ?? location.href;
      const to = e.to?.href ?? location.href;
      const generation = (begin(from, to), ++navGeneration);
      currentGeneration = generation;

      e.signal?.addEventListener(
        'abort',
        () => {
          if (currentGeneration !== generation) return;
          if (state.phase === 'loading') {
            clearTimers();
            state = resetNavProgress();
            applyVisual();
          }
        },
        { once: true },
      );
    });

    document.addEventListener('astro:after-preparation', () => {
      prepared();
    });

    document.addEventListener('astro:page-load', () => {
      complete();
    });

    document.addEventListener('astro:after-swap', () => {
      if (state.phase !== 'idle') applyVisual();
      else ensureRoot();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}
