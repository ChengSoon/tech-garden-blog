/**
 * Uses 页数据：工具栈名片。只记长期稳定项，不写业务逻辑。
 */
export type UsesItem = {
  name: string;
  note: string;
  href?: string;
};

export type UsesGroup = {
  id: string;
  title: string;
  description: string;
  items: UsesItem[];
};

export const usesIntro =
  '这不是完整装备清单，而是我真正每天会打开、愿意推荐的那一小撮。更新节奏慢，换掉的也会删。';

export const usesGroups: UsesGroup[] = [
  {
    id: 'hardware',
    title: '硬件',
    description: '写代码、写字与日常阅读的物理底座。',
    items: [
      { name: 'MacBook', note: '主力开发机；本地构建、模拟器与写作都在这里。' },
      { name: '外接显示器', note: '长文与对照阅读时拆屏，减少窗口切换。' },
      { name: '机械键盘 / 触控板', note: '长时间输入优先手感与安静，不为极客堆料。' },
    ],
  },
  {
    id: 'software',
    title: '软件与编辑器',
    description: '开发与写作工具链。',
    items: [
      { name: 'VS Code / Cursor', note: '主编辑器；重度依赖多文件搜索与 AI 补全。' },
      { name: 'Terminal + zsh', note: 'git、构建与部署脚本的默认界面。' },
      { name: 'Chrome', note: '调试与扩展自动化；隐私场景会切无档配置。' },
      {
        name: 'Astro',
        note: '本站框架：静态优先、内容集合清晰。',
        href: 'https://astro.build/',
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI 工作流',
    description: '把模型当副驾驶，不把判断外包。',
    items: [
      { name: 'Codex / ChatGPT', note: '代码实现、方案拆解、文稿润色与检索摘要。' },
      { name: '本地笔记 + 互链', note: '先落笔记再让模型整理，避免对话史成为唯一真相源。' },
      { name: '提示词循环', note: '目标 → 约束 → 样例 → 复盘，而不是单次神谕式提问。' },
    ],
  },
  {
    id: 'workflow',
    title: '工作流',
    description: '发布与知识管理习惯。',
    items: [
      { name: 'GitHub + Actions', note: '本站 push main 即构建到 Cloudflare Pages。' },
      { name: 'RSS', note: '订阅别人、也让别人订阅自己；不依赖时间线算法。', href: '/subscribe/' },
      { name: '数字花园', note: '笔记允许半成品；用互链和生长状态代替完美主义。', href: '/garden/' },
    ],
  },
];
