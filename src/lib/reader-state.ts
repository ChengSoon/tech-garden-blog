export const READER_STATE_KEY = 'reader-state:v1';

export type LineWidth = 'narrow' | 'normal' | 'wide';
export type GardenViewPreference = 'map' | 'timeline';

export interface ReaderHistoryEntry {
  slug: string;
  visitedAt: string;
  progress: number;
}

export interface ReaderStateV1 {
  version: 1;
  savedSlugs: string[];
  history: ReaderHistoryEntry[];
  preferences: {
    fontScale: number;
    lineWidth: LineWidth;
    gardenView: GardenViewPreference;
  };
}

type ReaderStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const DEFAULT_READER_STATE: ReaderStateV1 = {
  version: 1,
  savedSlugs: [],
  history: [],
  preferences: { fontScale: 1, lineWidth: 'normal', gardenView: 'map' },
};

function freshDefault(): ReaderStateV1 {
  return {
    ...DEFAULT_READER_STATE,
    savedSlugs: [],
    history: [],
    preferences: { ...DEFAULT_READER_STATE.preferences },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parsePreferences(value: unknown): ReaderStateV1['preferences'] {
  const input = value && typeof value === 'object'
    ? value as Partial<ReaderStateV1['preferences']>
    : {};
  const lineWidth: LineWidth = input.lineWidth === 'narrow' || input.lineWidth === 'wide'
    ? input.lineWidth
    : 'normal';
  return {
    fontScale: clamp(Number(input.fontScale) || 1, 0.9, 1.25),
    lineWidth,
    gardenView: input.gardenView === 'timeline' ? 'timeline' : 'map',
  };
}

function parseHistory(value: unknown): ReaderHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  const sorted = value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Partial<ReaderHistoryEntry>;
    if (typeof candidate.slug !== 'string' || typeof candidate.visitedAt !== 'string') return [];
    return [{
      slug: candidate.slug,
      visitedAt: candidate.visitedAt,
      progress: clamp(Number(candidate.progress) || 0, 0, 1),
    }];
  }).sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
  return [...new Map(sorted.map((item) => [item.slug, item])).values()].slice(0, 50);
}

export function parseReaderState(raw: string | null): ReaderStateV1 {
  if (!raw) return freshDefault();
  try {
    const value = JSON.parse(raw) as Partial<ReaderStateV1>;
    if (value.version !== 1) return freshDefault();
    const saved = Array.isArray(value.savedSlugs)
      ? value.savedSlugs.filter((slug): slug is string => typeof slug === 'string')
      : [];
    return {
      version: 1,
      savedSlugs: [...new Set(saved)],
      history: parseHistory(value.history),
      preferences: parsePreferences(value.preferences),
    };
  } catch {
    return freshDefault();
  }
}

export function recordProgress(
  state: ReaderStateV1,
  slug: string,
  progress: number,
  visitedAt: string,
): ReaderStateV1 {
  const entry = { slug, visitedAt, progress: clamp(progress, 0, 1) };
  const history = [entry, ...state.history.filter((item) => item.slug !== slug)]
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
    .slice(0, 50);
  return { ...state, history };
}

export function toggleSaved(state: ReaderStateV1, slug: string): ReaderStateV1 {
  const savedSlugs = state.savedSlugs.includes(slug)
    ? state.savedSlugs.filter((item) => item !== slug)
    : [slug, ...state.savedSlugs];
  return { ...state, savedSlugs };
}

export function updatePreferences(
  state: ReaderStateV1,
  patch: Partial<ReaderStateV1['preferences']>,
): ReaderStateV1 {
  return parseReaderState(JSON.stringify({
    ...state,
    preferences: { ...state.preferences, ...patch },
  }));
}

export function getReaderStorage(): ReaderStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadReaderState(storage: ReaderStorage | null): ReaderStateV1 {
  if (!storage) return freshDefault();
  try {
    return parseReaderState(storage.getItem(READER_STATE_KEY));
  } catch {
    return freshDefault();
  }
}

export function saveReaderState(storage: ReaderStorage | null, state: ReaderStateV1): boolean {
  if (!storage) return false;
  try {
    storage.setItem(READER_STATE_KEY, JSON.stringify(state));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reader-state-change', { detail: state }));
    }
    return true;
  } catch {
    return false;
  }
}
