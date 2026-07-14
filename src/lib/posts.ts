import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;

export async function getPublishedPosts(): Promise<PostEntry[]> {
  const all = await getCollection('posts');
  return all
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function postSlug(post: PostEntry): string {
  return post.id.replace(/\.(md|mdx)$/, '');
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'seedling':
      return '萌芽';
    case 'evergreen':
      return '常青';
    default:
      return '生长中';
  }
}
