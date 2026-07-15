export interface ReadingPathDefinition {
  id: string;
  title: string;
  description: string;
  slugs: string[];
}

export interface ResolvedReadingPath<T> extends Omit<ReadingPathDefinition, 'slugs'> {
  items: T[];
}

export function resolveReadingPaths<T>(
  paths: ReadingPathDefinition[],
  items: Map<string, T>,
): ResolvedReadingPath<T>[] {
  return paths
    .map(({ slugs, ...path }) => ({
      ...path,
      items: slugs.flatMap((slug) => {
        const item = items.get(slug);
        return item ? [item] : [];
      }),
    }))
    .filter((path) => path.items.length > 0);
}
