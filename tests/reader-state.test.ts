import { describe, expect, it } from 'vitest';
import {
  loadReaderState,
  parseReaderState,
  recordProgress,
  saveReaderState,
  toggleSaved,
  updatePreferences,
} from '../src/lib/reader-state';

describe('parseReaderState', () => {
  it('returns defaults for missing, malformed, or unsupported data', () => {
    expect(parseReaderState(null).savedSlugs).toEqual([]);
    expect(parseReaderState('{bad').history).toEqual([]);
    expect(parseReaderState('{"version":2}').version).toBe(1);
    expect(loadReaderState(null).history).toEqual([]);
  });

  it('clamps progress and keeps at most 50 history entries', () => {
    const history = Array.from({ length: 55 }, (_, index) => ({
      slug: `p${index}`,
      visitedAt: new Date(2026, 0, index + 1).toISOString(),
      progress: 2,
    }));
    const state = parseReaderState(
      JSON.stringify({ version: 1, savedSlugs: [], history, preferences: {} }),
    );
    expect(state.history).toHaveLength(50);
    expect(state.history.every((item) => item.progress === 1)).toBe(true);
  });
});

describe('reader state updates', () => {
  it('moves an updated slug to the front', () => {
    const first = recordProgress(parseReaderState(null), 'a', 0.2, '2026-07-14T10:00:00Z');
    const next = recordProgress(first, 'b', 0.4, '2026-07-14T11:00:00Z');
    expect(next.history.map((item) => item.slug)).toEqual(['b', 'a']);
  });

  it('toggles saved slugs without duplicates', () => {
    const once = toggleSaved(parseReaderState(null), 'a');
    expect(toggleSaved(once, 'a').savedSlugs).toEqual([]);
  });

  it('normalizes preferences through the parser', () => {
    const state = updatePreferences(parseReaderState(null), {
      fontScale: 9,
      lineWidth: 'wide',
    });
    expect(state.preferences).toMatchObject({ fontScale: 1.25, lineWidth: 'wide' });
  });

  it('returns false when storage is unavailable', () => {
    expect(saveReaderState(null, parseReaderState(null))).toBe(false);
  });
});
