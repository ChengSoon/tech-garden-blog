import type { PostLike } from './post-select';
import { postSlug } from './post-select';

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

/** 零配置回退：每个高频标签一条路径，放该标签下最新文章 */
export function autoReadingPathsFromTags(
  posts: PostLike[],
  limit = 3,
  perPath = 3,
): ReadingPathDefinition[] {
  const byTag = new Map<string, PostLike[]>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const list = byTag.get(tag) ?? [];
      list.push(post);
      byTag.set(tag, list);
    }
  }

  return [...byTag.entries()]
    .map(([tag, list]) => ({
      tag,
      list: list
        .slice()
        .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()),
    }))
    .sort((a, b) => b.list.length - a.list.length || a.tag.localeCompare(b.tag, 'zh-CN'))
    .slice(0, limit)
    .map(({ tag, list }) => ({
      id: `tag-${tag}`,
      title: `#${tag}`,
      description: `围绕「${tag}」主题的近期文章。`,
      slugs: list.slice(0, perPath).map((p) => postSlug(p)),
    }));
}
