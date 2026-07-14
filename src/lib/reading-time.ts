export function readingTimeMinutes(text: string, wpm = 300): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const units = words + cjk / 2;
  return Math.max(1, Math.round(units / wpm));
}
