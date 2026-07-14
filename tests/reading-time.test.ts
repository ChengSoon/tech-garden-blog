import { describe, expect, it } from 'vitest';
import { readingTimeMinutes } from '../src/lib/reading-time';

describe('readingTimeMinutes', () => {
  it('returns at least 1 for empty text', () => {
    expect(readingTimeMinutes('')).toBe(1);
  });

  it('estimates from mixed content', () => {
    const text = `${'word '.repeat(300)}中文内容测试`;
    expect(readingTimeMinutes(text)).toBeGreaterThanOrEqual(1);
  });
});
