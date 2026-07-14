const POST_HREF = /\]\((?:\/posts\/)([a-z0-9-]+)\/?\)/gi;

export function extractPostLinks(markdown: string): string[] {
  const found = new Set<string>();
  for (const match of markdown.matchAll(POST_HREF)) {
    found.add(match[1]);
  }
  return [...found];
}

export function mergeLinks(fromBody: string[], fromFrontmatter: string[]): string[] {
  return [...new Set([...fromBody, ...fromFrontmatter])];
}
