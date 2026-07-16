/**
 * 作品（projects）内容查询：排序、精选，与 friends 模式一致。
 */

export type ProjectStatus = 'idea' | 'wip' | 'shipped' | 'archived';

export type Project = {
  id: string;
  name: string;
  summary: string;
  role?: string;
  status: ProjectStatus;
  stack: string[];
  url?: string;
  repo?: string;
  cover?: string;
  relatedPosts: string[];
  featured: boolean;
  order: number;
  year?: number;
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  idea: '构思中',
  wip: '进行中',
  shipped: '已上线',
  archived: '归档',
};

function stripExt(id: string): string {
  return id.replace(/\.(json|ya?ml)$/i, '');
}

export function sortProjects(list: Project[]): Project[] {
  return [...list].sort(
    (a, b) =>
      a.order - b.order ||
      a.name.localeCompare(b.name, 'zh-CN') ||
      a.id.localeCompare(b.id),
  );
}

/** featured 优先，不足则按 order 补齐 */
export function pickFeaturedProjects(list: Project[], limit = 3): Project[] {
  const sorted = sortProjects(list);
  const featured = sorted.filter((p) => p.featured);
  if (featured.length >= limit) return featured.slice(0, limit);
  const rest = sorted.filter((p) => !p.featured);
  return [...featured, ...rest].slice(0, limit);
}

export function projectHasLink(project: Pick<Project, 'url' | 'repo' | 'relatedPosts'>): boolean {
  return Boolean(project.url || project.repo || project.relatedPosts.length > 0);
}

/** 从 content/projects 读取（页面侧调用） */
export async function loadProjects(): Promise<Project[]> {
  const { getCollection } = await import('astro:content');
  try {
    const entries = await getCollection('projects');
    const mapped = entries.map((entry) => ({
      id: stripExt(entry.id),
      name: entry.data.name,
      summary: entry.data.summary,
      role: entry.data.role,
      status: entry.data.status,
      stack: entry.data.stack ?? [],
      url: entry.data.url,
      repo: entry.data.repo,
      cover: entry.data.cover,
      relatedPosts: entry.data.relatedPosts ?? [],
      featured: entry.data.featured ?? false,
      order: entry.data.order ?? 0,
      year: entry.data.year,
    }));
    return sortProjects(mapped);
  } catch {
    return [];
  }
}

export async function loadFeaturedProjects(limit = 3): Promise<Project[]> {
  return pickFeaturedProjects(await loadProjects(), limit);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const projects = await loadProjects();
  return projects.find((project) => project.id === id);
}

export function projectPath(id: string): string {
  return `/projects/${id}/`;
}
