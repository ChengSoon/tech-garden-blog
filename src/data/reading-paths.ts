import type { ReadingPathDefinition } from '../lib/reading-paths';

export const readingPaths: ReadingPathDefinition[] = [
  {
    id: 'systems',
    title: '构建系统',
    description: '从静态骨架到交互边界，理解技术选择如何落地。',
    slugs: ['welcome-essay', 'note-astro-islands'],
  },
  {
    id: 'knowledge-map',
    title: '编织知识',
    description: '从节点、链接与反链开始，建立可以继续生长的知识网络。',
    slugs: ['note-graph-basics', 'welcome-essay'],
  },
  {
    id: 'reading-design',
    title: '设计阅读',
    description: '让版式、章节轨和阅读节奏服务长内容。',
    slugs: ['note-reading-layout', 'welcome-essay'],
  },
];
