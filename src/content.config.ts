import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z.enum(['essay', 'note']),
    status: z.enum(['seedling', 'growing', 'evergreen']).default('growing'),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    series: z.string().optional(),
    order: z.number().optional(),
    links: z.array(z.string()).default([]),
    hero: z.string().optional(),
    draft: z.boolean().default(false),
    /** 首页 / 关于页精选 */
    featured: z.boolean().default(false),
    /** 精选排序，越小越靠前 */
    featuredOrder: z.number().optional(),
    /** 首页 Hero 主打（同时最多一篇生效） */
    lead: z.boolean().default(false),
  }),
});

const series = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
  }),
});

/** 首页「阅读路径」— 只写路径元数据与文章 slug，不进代码 */
const paths = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/paths' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(0),
    posts: z.array(z.string()).min(1),
  }),
});

/** 客串歌单（友链）— 每站一个 yaml/json，不写进业务代码 */
const friends = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/friends' }),
  schema: z.object({
    name: z.string(),
    url: z.string().url(),
    owner: z.string().optional(),
    description: z.string(),
    category: z.enum(['regular', 'affinity', 'tools']).default('affinity'),
    tags: z.array(z.string()).default([]),
    monogram: z.string().max(2).optional(),
    accent: z.string().optional(),
    /** 排序，越小越靠前 */
    order: z.number().default(0),
  }),
});


/** 作品名片 — 每项一个 yaml/json，不写进业务代码 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/projects' }),
  schema: z
    .object({
      name: z.string(),
      summary: z.string(),
      role: z.string().optional(),
      status: z.enum(['idea', 'wip', 'shipped', 'archived']).default('shipped'),
      stack: z.array(z.string()).default([]),
      url: z.string().url().optional(),
      repo: z.string().url().optional(),
      cover: z.string().optional(),
      relatedPosts: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      year: z.number().optional(),
    })
    .refine(
      (data) => Boolean(data.url || data.repo || (data.relatedPosts?.length ?? 0) > 0),
      { message: 'project needs url, repo, or relatedPosts' },
    ),
});

export const collections = { posts, series, paths, friends, projects };
