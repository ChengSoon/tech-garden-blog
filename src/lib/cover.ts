/** Deterministic cover palette from a slug/title. */
export function coverSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function coverPalette(seed: number): {
  a: string;
  b: string;
  c: string;
  ink: string;
} {
  const palettes = [
    { a: '#1b3a57', b: '#9b7b4a', c: '#f2ebe0', ink: '#f7f1e7' },
    { a: '#2f6f66', b: '#d4b483', c: '#e8dfd0', ink: '#f7f1e7' },
    { a: '#4a2c2a', b: '#c4a574', c: '#f0e6d8', ink: '#f7f1e7' },
    { a: '#243044', b: '#8eb4d8', c: '#e7eef5', ink: '#f4f7fb' },
    { a: '#3d2f1e', b: '#c9893a', c: '#f3e7d3', ink: '#fff8ee' },
    { a: '#1f2a24', b: '#7d9b76', c: '#e4ebe0', ink: '#f3f7f1' },
  ];
  return palettes[seed % palettes.length];
}
