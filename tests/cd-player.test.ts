import { describe, expect, it } from 'vitest';
import { formatTime } from '../src/lib/time';

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(214)).toBe('3:34');
  });

  it('guards invalid values', () => {
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(-3)).toBe('0:00');
  });
});
