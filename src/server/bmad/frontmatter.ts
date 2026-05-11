import matter from 'gray-matter';

export interface ArtifactMeta {
  workflow?: string;
  agent?: string;
  phase?: number;
  created?: string;
  [key: string]: unknown;
}

export function parseFrontmatter(content: string): { meta: ArtifactMeta; body: string } {
  try {
    const parsed = matter(content);
    return { meta: parsed.data as ArtifactMeta, body: parsed.content };
  } catch {
    return { meta: {}, body: content };
  }
}
