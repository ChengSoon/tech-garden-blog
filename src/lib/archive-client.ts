import { filterArchiveItems, type ArchiveFilters, type ArchiveItem } from './archive-filter';
import { getReaderStorage, loadReaderState } from './reader-state';

type ArchiveWindow = Window & { __archiveAbort?: AbortController };

interface ArchiveContext {
  form: HTMLFormElement;
  rows: HTMLElement[];
  items: ArchiveItem[];
}

function seedControls(form: HTMLFormElement) {
  const params = new URLSearchParams(location.search);
  ['type', 'status', 'tag', 'year'].forEach((name) => {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLSelectElement) field.value = params.get(name) ?? '';
  });
  const saved = form.elements.namedItem('saved');
  if (saved instanceof HTMLInputElement) saved.checked = params.get('saved') === '1';
}

function readItems(rows: HTMLElement[]): ArchiveItem[] {
  return rows.map((row) => ({
    slug: row.dataset.slug ?? '',
    type: row.dataset.type ?? '',
    status: row.dataset.status ?? '',
    tags: JSON.parse(row.dataset.tags ?? '[]') as string[],
    year: Number(row.dataset.year),
  }));
}

function readFilters(form: HTMLFormElement): ArchiveFilters {
  const data = new FormData(form);
  return {
    type: String(data.get('type') ?? '') || undefined,
    status: String(data.get('status') ?? '') || undefined,
    tag: String(data.get('tag') ?? '') || undefined,
    year: Number(data.get('year')) || undefined,
    savedOnly: data.get('saved') === '1',
  };
}

function syncUrl(filters: ArchiveFilters) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.year) params.set('year', String(filters.year));
  if (filters.savedOnly) params.set('saved', '1');
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
}

function renderRows(context: ArchiveContext) {
  const filters = readFilters(context.form);
  const state = loadReaderState(getReaderStorage());
  const visible = new Set(
    filterArchiveItems(context.items, filters, state.savedSlugs).map((item) => item.slug),
  );
  context.rows.forEach((row) => {
    row.hidden = !visible.has(row.dataset.slug ?? '');
    const entry = state.history.find((item) => item.slug === row.dataset.slug);
    const progress = row.querySelector<HTMLElement>('[data-archive-progress]');
    if (progress) progress.textContent = entry && entry.progress > 0.01
      ? `${Math.round(entry.progress * 100)}%`
      : '';
  });
  document.querySelector<HTMLOutputElement>('[data-archive-count]')!.textContent = `${visible.size} 篇`;
  document.querySelector<HTMLElement>('[data-archive-empty]')!.hidden = visible.size > 0;
  syncUrl(filters);
}

function bindReset(context: ArchiveContext, controller: AbortController) {
  document.querySelectorAll<HTMLButtonElement>('[data-archive-reset]').forEach((button) => {
    button.addEventListener('click', () => {
      context.form.reset();
      renderRows(context);
    }, { signal: controller.signal });
  });
}

export function startArchive() {
  const form = document.querySelector<HTMLFormElement>('[data-archive-filters]');
  if (!form) return;
  const archiveWindow = window as ArchiveWindow;
  archiveWindow.__archiveAbort?.abort();
  const controller = new AbortController();
  archiveWindow.__archiveAbort = controller;
  const rows = [...document.querySelectorAll<HTMLElement>('[data-archive-item]')];
  const context = { form, rows, items: readItems(rows) };
  seedControls(form);
  form.addEventListener('change', () => renderRows(context), { signal: controller.signal });
  window.addEventListener('reader-state-change', () => renderRows(context), { signal: controller.signal });
  bindReset(context, controller);
  renderRows(context);
}
