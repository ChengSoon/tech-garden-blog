import type { ReadingPathDefinition } from '../lib/reading-paths';

export const readingPaths: ReadingPathDefinition[] = [
  {
    id: 'ai-concepts',
    title: '认识 AI',
    description: '先建立正确心智模型：AI 能做什么、不能做什么。',
    slugs: ['ai-practical-guide'],
  },
  {
    id: 'ai-practice',
    title: '开始使用',
    description: '用提示词循环与真实任务，把 AI 嵌进日常工作流。',
    slugs: ['ai-practical-guide'],
  },
  {
    id: 'ai-guardrails',
    title: '安全地用',
    description: '守住隐私、事实与责任三条线，再谈效率。',
    slugs: ['ai-practical-guide'],
  },
];
