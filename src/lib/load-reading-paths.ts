import { getCollection } from 'astro:content';
import type { PostLike } from './post-select';
import {
  autoReadingPathsFromTags,
  type ReadingPathDefinition,
} from './reading-paths';

/** 从 content/paths 读取；若无配置则按标签自动生成 */
export async function loadReadingPathDefinitions(
  posts: PostLike[],
): Promise<ReadingPathDefinition[]> {
  const entries = await getCollection('paths');
  if (entries.length) {
    return entries
      .slice()
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0) || a.id.localeCompare(b.id))
      .map((entry) => ({
        id: entry.id.replace(/\.(json|ya?ml)$/i, ''),
        title: entry.data.title,
        description: entry.data.description,
        slugs: entry.data.posts,
      }));
  }
  return autoReadingPathsFromTags(posts);
}
