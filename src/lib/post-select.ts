/** 与 content collection posts 对齐的最小结构，便于单测不依赖 astro:content */
export interface PostDataLike {
  title: string;
  summary: string;
  date: Date;
  type: 'essay' | 'note';
  status: string;
  tags: string[];
  featured: boolean;
  lead: boolean;
  featuredOrder?: number;
  series?: string;
  order?: number;
  hero?: string;
  links?: string[];
  draft?: boolean;
}

export interface PostLike {
  id: string;
  data: PostDataLike;
}

/** @deprecated 使用 PostLike；保留别名兼容 */
export type PostEntry = PostLike;

export function postSlug(post: { id: string }): string {
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

/** 精选：frontmatter.featured，否则回退长文 / 最新 */
export function pickFeaturedPosts<T extends PostLike>(posts: T[], limit = 3): T[] {
  const marked = posts
    .filter((p) => p.data.featured)
    .sort((a, b) => {
      const ao = a.data.featuredOrder ?? 999;
      const bo = b.data.featuredOrder ?? 999;
      if (ao !== bo) return ao - bo;
      return b.data.date.valueOf() - a.data.date.valueOf();
    });
  if (marked.length) return marked.slice(0, limit);

  const essays = posts.filter((p) => p.data.type === 'essay');
  if (essays.length) return essays.slice(0, limit);
  return posts.slice(0, limit);
}

/** 首页主打：lead → 精选第一篇 → 最新长文 → 最新任意 */
export function pickLeadPost<T extends PostLike>(posts: T[]): T | undefined {
  const leads = posts
    .filter((p) => p.data.lead)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  if (leads[0]) return leads[0];

  const featured = pickFeaturedPosts(posts, 1);
  if (featured[0]) return featured[0];

  return posts.find((p) => p.data.type === 'essay') ?? posts[0];
}

/** 主题标签：站点配置优先，否则从文章 tags 频次推导 */
export function deriveTopics(
  posts: PostLike[],
  preferred: string[] = [],
  limit = 8,
): string[] {
  if (preferred.length) return preferred.slice(0, limit);
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function toPostCard(post: PostLike) {
  return {
    slug: postSlug(post),
    title: post.data.title,
    summary: post.data.summary,
    date: post.data.date,
    type: post.data.type,
    status: post.data.status,
    tags: post.data.tags,
  };
}
