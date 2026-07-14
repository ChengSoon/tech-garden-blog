import { describe, expect, it } from 'vitest';
import { coverPalette, coverSeed } from '../src/lib/cover';

describe('coverSeed', () => {
  it('is stable for same input', () => {
    expect(coverSeed('welcome-essay')).toBe(coverSeed('welcome-essay'));
  });
  it('returns palette fields', () => {
    const p = coverPalette(coverSeed('abc'));
    expect(p.a).toMatch(/^#/);
    expect(p.b).toMatch(/^#/);
  });
});
