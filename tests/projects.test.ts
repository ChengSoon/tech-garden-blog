import { describe, expect, it } from 'vitest';
import {
  pickFeaturedProjects,
  projectHasLink,
  projectPath,
  sortProjects,
  type Project,
} from '../src/lib/projects';

function p(partial: Partial<Project> & Pick<Project, 'id' | 'name'>): Project {
  return {
    summary: 's',
    status: 'shipped',
    stack: [],
    relatedPosts: [],
    featured: false,
    order: 0,
    ...partial,
  };
}

describe('projects helpers', () => {
  it('sorts by order then name', () => {
    const list = sortProjects([
      p({ id: 'b', name: 'Beta', order: 2 }),
      p({ id: 'a', name: 'Alpha', order: 1 }),
      p({ id: 'c', name: 'Gamma', order: 1 }),
    ]);
    expect(list.map((x) => x.id)).toEqual(['a', 'c', 'b']);
  });

  it('picks featured first then fills by order', () => {
    const picked = pickFeaturedProjects(
      [
        p({ id: 'f', name: 'Feat', featured: true, order: 20 }),
        p({ id: 'a', name: 'A', order: 1 }),
        p({ id: 'b', name: 'B', order: 2 }),
      ],
      2,
    );
    expect(picked.map((x) => x.id)).toEqual(['f', 'a']);
  });

  it('requires at least one outbound link surface', () => {
    expect(projectHasLink(p({ id: 'x', name: 'X', url: 'https://a.com' }))).toBe(true);
    expect(projectHasLink(p({ id: 'y', name: 'Y', relatedPosts: ['slug'] }))).toBe(true);
    expect(projectHasLink(p({ id: 'z', name: 'Z' }))).toBe(false);
  });

  it('builds detail path from id', () => {
    expect(projectPath('habit-checkin')).toBe('/projects/habit-checkin/');
  });
});
