/**
 * Progressive scroll reveal for [data-motion] elements.
 * Re-binds on Astro client-router page swaps.
 */
const SELECTOR = '[data-motion]';

function prefersReduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clear(root: ParentNode = document) {
  root.querySelectorAll(`${SELECTOR}.is-inview`).forEach((el) => {
    el.classList.remove('is-inview');
  });
}

function revealAll(root: ParentNode = document) {
  root.querySelectorAll(SELECTOR).forEach((el) => el.classList.add('is-inview'));
}

let observer: IntersectionObserver | null = null;

function bind() {
  if (prefersReduced()) {
    document.documentElement.classList.remove('motion-ready');
    revealAll();
    return;
  }

  document.documentElement.classList.add('motion-ready');

  if (observer) observer.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add('is-inview');
        observer?.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  document.querySelectorAll(SELECTOR).forEach((el, i) => {
    if (!(el instanceof HTMLElement)) return;
    if (!el.style.getPropertyValue('--motion-i')) {
      // lightweight auto-stagger within a parent list
      const siblings = el.parentElement
        ? [...el.parentElement.children].filter((c) => c.hasAttribute('data-motion'))
        : [];
      const idx = Math.max(0, siblings.indexOf(el));
      el.style.setProperty('--motion-i', String(Math.min(idx, 8)));
    }
    // already above fold? reveal immediately without waiting
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      el.classList.add('is-inview');
      return;
    }
    observer?.observe(el);
  });
}

function boot() {
  // avoid flash: mark ready after first paint of targets
  requestAnimationFrame(bind);
}

if (typeof window !== 'undefined') {
  const w = window as Window & { __motionScrollBound?: boolean };
  if (!w.__motionScrollBound) {
    w.__motionScrollBound = true;
    document.addEventListener('DOMContentLoaded', boot);
    document.addEventListener('astro:page-load', () => {
      clear();
      boot();
    });
  }
  // if module loads after DOMContentLoaded
  if (document.readyState !== 'loading') boot();
}
