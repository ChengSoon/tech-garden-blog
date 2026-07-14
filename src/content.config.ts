import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
  }),
});

const series = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
  }),
});

export const collections = { posts, series };
