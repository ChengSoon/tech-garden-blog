import { describe, expect, it } from 'vitest';
import {
  NAV_PROGRESS_CEILING,
  NAV_PROGRESS_IDLE,
  NAV_PROGRESS_START,
  finishNavProgress,
  markPrepared,
  resetNavProgress,
  shouldTrackNavigation,
  startNavProgress,
  trickleNavProgress,
} from '../src/lib/nav-progress';

describe('shouldTrackNavigation', () => {
  it('skips same-path hash-only changes', () => {
    expect(
      shouldTrackNavigation(
        'https://blog.example/articles/a#top',
        'https://blog.example/articles/a#section',
      ),
    ).toBe(false);
  });

  it('tracks path or query changes', () => {
    expect(
      shouldTrackNavigation('https://blog.example/', 'https://blog.example/garden/'),
    ).toBe(true);
    expect(
      shouldTrackNavigation('https://blog.example/a?x=1', 'https://blog.example/a?x=2'),
    ).toBe(true);
  });
});

describe('nav progress state machine', () => {
  it('starts from idle at a visible kickoff value', () => {
    const next = startNavProgress(NAV_PROGRESS_IDLE);
    expect(next.phase).toBe('loading');
    expect(next.value).toBe(NAV_PROGRESS_START);
  });

  it('trickles toward ceiling without exceeding it', () => {
    let state = startNavProgress();
    for (let i = 0; i < 40; i += 1) {
      state = trickleNavProgress(state, 200);
    }
    expect(state.phase).toBe('loading');
    expect(state.value).toBeLessThanOrEqual(NAV_PROGRESS_CEILING);
    expect(state.value).toBeGreaterThan(NAV_PROGRESS_START);
  });

  it('lifts after preparation and finishes at 1', () => {
    const loading = startNavProgress();
    const prepared = markPrepared(loading);
    expect(prepared.value).toBeGreaterThanOrEqual(0.72);
    const done = finishNavProgress(prepared);
    expect(done).toEqual({ phase: 'finishing', value: 1 });
    expect(resetNavProgress()).toEqual(NAV_PROGRESS_IDLE);
  });

  it('ignores finish when already idle', () => {
    expect(finishNavProgress(NAV_PROGRESS_IDLE)).toEqual(NAV_PROGRESS_IDLE);
  });
});
