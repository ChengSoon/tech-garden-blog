import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;
export type { PostLike } from './post-select';
export {
  deriveTopics,
  pickFeaturedPosts,
  pickLeadPost,
  postSlug,
  statusLabel,
  toPostCard,
} from './post-select';

export async function getPublishedPosts(): Promise<PostEntry[]> {
  const all = await getCollection('posts');
  return all
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
