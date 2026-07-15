export interface ArchiveItem {
  slug: string;
  type: string;
  status: string;
  tags: string[];
  year: number;
}

export interface ArchiveFilters {
  type?: string;
  status?: string;
  tag?: string;
  year?: number;
  savedOnly?: boolean;
}

export function filterArchiveItems(
  items: ArchiveItem[],
  filters: ArchiveFilters,
  savedSlugs: string[],
): ArchiveItem[] {
  return items.filter((item) => (
    (!filters.type || item.type === filters.type)
    && (!filters.status || item.status === filters.status)
    && (!filters.tag || item.tags.includes(filters.tag))
    && (!filters.year || item.year === filters.year)
    && (!filters.savedOnly || savedSlugs.includes(item.slug))
  ));
}
