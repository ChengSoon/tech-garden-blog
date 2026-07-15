import { getPublishedPosts, postSlug } from '../lib/posts';
import { stripMarkdown, type SearchDocument } from '../lib/search';

export const prerender = true;

export async function GET() {
  const posts = await getPublishedPosts();
  const documents: SearchDocument[] = posts.map((post) => ({
    slug: postSlug(post),
    title: post.data.title,
    summary: post.data.summary,
    tags: post.data.tags,
    type: post.data.type,
    body: stripMarkdown(post.body ?? ''),
  }));

  return new Response(JSON.stringify(documents), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
