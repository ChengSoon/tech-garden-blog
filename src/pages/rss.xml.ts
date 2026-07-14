import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../data/site';
import { getPublishedPosts, postSlug } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${site.name} · 技术刊`,
    description: site.tagline,
    site: context.site ?? 'https://example.com',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.summary,
      pubDate: p.data.date,
      link: `/posts/${postSlug(p)}/`,
    })),
  });
}
