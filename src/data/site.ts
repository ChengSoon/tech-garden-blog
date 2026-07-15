/**
 * 站点身份与作者信息（长期稳定）。
 * 文章精选 / 主打 / 阅读路径请写在 content 层，不要写死 slug。
 */
export const site = {
  name: 'Cheng',
  fullName: 'Cheng',
  role: 'Engineer / Writer',
  tagline: '一本可漫游的技术刊，一座仍在生长的知识花园。',
  bio: '关注人工智能、系统设计与知识管理。喜欢把复杂问题写清楚，也把半成品笔记种进花园。',
  location: 'Hunan · Remote',
  now: '本季在写 AI 实用方法：概念、工作流与使用边界。',
  nowUpdated: '2026-07-15',
  email: '',
  github: 'https://github.com/ChengSoon',
  githubRepo: 'https://github.com/ChengSoon/tech-garden-blog',
  avatar: '/avatar.webp',
  /** 可留空：为空时 About 页会从文章 tags 自动推导 */
  interests: ['人工智能', '系统设计', '知识管理', '开发者体验'] as string[],
  socials: [
    { label: 'GitHub', href: 'https://github.com/ChengSoon' },
    { label: 'RSS', href: '/rss.xml' },
  ],
};
