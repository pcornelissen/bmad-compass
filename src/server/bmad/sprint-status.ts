import yaml from 'js-yaml';
import type { SprintStory } from '../../shared/types.js';

const VALID_STATUSES: SprintStory['status'][] = ['backlog', 'in-progress', 'done', 'blocked'];

export function parseSprintStatus(content: string): SprintStory[] {
  if (!content.trim()) return [];
  let data: unknown;
  try {
    data = yaml.load(content);
  } catch {
    return [];
  }
  if (!data || typeof data !== 'object') return [];
  const stories = (data as { stories?: unknown }).stories;
  if (!Array.isArray(stories)) return [];
  return stories.map(s => {
    const obj = s as Record<string, unknown>;
    const status = String(obj.status ?? '');
    return {
      id: String(obj.id ?? ''),
      title: String(obj.title ?? ''),
      epicId: String(obj.epicId ?? ''),
      status: (VALID_STATUSES.includes(status as SprintStory['status'])
        ? status
        : 'backlog') as SprintStory['status'],
    };
  });
}
