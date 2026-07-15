import { getCollection } from 'astro:content';
import type { PostLike } from './post-select';
import { postSlug } from './post-select';

export interface SeriesCard {
  id: string;
  title: string;
  summary: string;
  count: number;
  chapters: string[];
  href: string;
}

export async function getSeriesCards(posts: PostLike[]): Promise<SeriesCard[]> {
  const seriesEntries = await getCollection('series');
  return seriesEntries
    .map((s) => {
      const chapters = posts
        .filter((p) => p.data.series === s.id)
        .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
        .map((post) => postSlug(post));
      return {
        id: s.id,
        title: s.data.title,
        summary: s.data.summary,
        count: chapters.length,
        chapters,
        href: chapters[0] ? `/posts/${chapters[0]}/` : `/series/${s.id}/`,
      };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}
