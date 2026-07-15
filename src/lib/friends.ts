export type FriendCategory = 'regular' | 'affinity' | 'tools';

export type Friend = {
  id: string;
  name: string;
  url: string;
  owner?: string;
  description: string;
  category: FriendCategory;
  tags: string[];
  monogram?: string;
  accent?: string;
  order: number;
};

export const friendCategories: {
  id: FriendCategory | 'all';
  label: string;
  side: string;
  hint: string;
}[] = [
  { id: 'all', label: '整张碟', side: 'Full', hint: '歌单里的每一轨' },
  { id: 'regular', label: '常听', side: 'Side A', hint: '循环次数最多的老歌' },
  { id: 'affinity', label: '同频', side: 'Side B', hint: '气味相投的个人站' },
  { id: 'tools', label: '采样', side: 'Bonus', hint: '工具、杂志与社区' },
];

/** 投轨文案与入口（非友链列表） */
export const friendExchange = {
  title: '想进歌单？',
  lede: '友链不是广告位，是一张共同播放的碟。符合下列条件的站点，欢迎投轨。',
  requirements: [
    '原创为主，内容可长期回访（技术 / 工程 / 知识管理 / 个人写作均可）',
    '站点可稳定访问，有基本可读的关于页或自我介绍',
    '愿意在站内放置本站链接（位置不限，页脚亦可）',
    '无大量广告弹窗、无钓鱼与违法内容',
  ],
  requestHint:
    '通过 GitHub Issue 投轨，附上：站点名称、URL、一句话 liner notes、站长署名，以及希望落在哪一面（Side A 常听 / Side B 同频 / Bonus 采样）。维护者确认后在 content/friends/ 新增一个 yaml 即可上架。',
  issuesUrl: 'https://github.com/ChengSoon/tech-garden-blog/issues',
};

export function friendMonogram(friend: Pick<Friend, 'monogram' | 'name'>): string {
  if (friend.monogram?.trim()) return friend.monogram.trim().slice(0, 2);
  const name = friend.name.trim();
  return name ? name.slice(0, 1) : '♪';
}

export function friendsByCategory(
  list: Friend[],
  category: FriendCategory | 'all',
): Friend[] {
  if (category === 'all') return list;
  return list.filter((f) => f.category === category);
}

export function categoryLabel(category: FriendCategory): string {
  return friendCategories.find((c) => c.id === category)?.label ?? category;
}

export function categorySide(category: FriendCategory): string {
  return friendCategories.find((c) => c.id === category)?.side ?? 'Track';
}

function stripExt(id: string): string {
  return id.replace(/\.(json|ya?ml)$/i, '');
}

/** 从 content/friends 读取友链列表（页面侧调用） */
export async function loadFriends(): Promise<Friend[]> {
  const { getCollection } = await import('astro:content');
  try {
    const entries = await getCollection('friends');
    return entries
      .map((entry) => ({
        id: stripExt(entry.id),
        name: entry.data.name,
        url: entry.data.url,
        owner: entry.data.owner,
        description: entry.data.description,
        category: entry.data.category,
        tags: entry.data.tags ?? [],
        monogram: entry.data.monogram,
        accent: entry.data.accent,
        order: entry.data.order ?? 0,
      }))
      .sort(
        (a, b) =>
          a.order - b.order ||
          a.name.localeCompare(b.name, 'zh-CN') ||
          a.id.localeCompare(b.id),
      );
  } catch {
    // 集合为空或未生成时返回空列表，避免构建中断
    return [];
  }
}
