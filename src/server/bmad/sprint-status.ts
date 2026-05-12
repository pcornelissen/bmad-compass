import yaml from 'js-yaml';
import type { SprintStory, StoryKind, StoryStatus } from '../../shared/types.js';

const VALID_STATUSES: StoryStatus[] = [
  'backlog', 'ready-for-dev', 'in-progress', 'review', 'done', 'optional', 'blocked',
];

export function parseSprintStatus(content: string): SprintStory[] {
  if (!content.trim()) return [];
  let data: unknown;
  try { data = yaml.load(content); }
  catch { return []; }
  if (!data || typeof data !== 'object') return [];

  // New BMAD format: development_status is a flat map of id -> status string.
  const devStatus = (data as { development_status?: unknown }).development_status;
  if (devStatus && typeof devStatus === 'object' && !Array.isArray(devStatus)) {
    return parseDevelopmentStatus(devStatus as Record<string, unknown>);
  }

  // Legacy format: stories is an array of { id, title, epicId, status }.
  const stories = (data as { stories?: unknown }).stories;
  if (Array.isArray(stories)) {
    return parseLegacyStories(stories);
  }

  return [];
}

function parseDevelopmentStatus(map: Record<string, unknown>): SprintStory[] {
  const result: SprintStory[] = [];
  for (const [rawId, rawStatus] of Object.entries(map)) {
    const id = String(rawId).trim();
    if (!id) continue;
    const statusStr = String(rawStatus ?? '').trim();
    const status: StoryStatus = (VALID_STATUSES as string[]).includes(statusStr)
      ? (statusStr as StoryStatus)
      : 'backlog';

    const kind = classifyId(id);
    const epicId = epicIdOf(id);
    result.push({ id, title: humanizeId(id), epicId, status, kind });
  }
  return result;
}

function parseLegacyStories(arr: unknown[]): SprintStory[] {
  return arr.map(s => {
    const obj = s as Record<string, unknown>;
    const status = String(obj.status ?? '');
    return {
      id: String(obj.id ?? ''),
      title: String(obj.title ?? ''),
      epicId: String(obj.epicId ?? ''),
      status: ((VALID_STATUSES as string[]).includes(status) ? status : 'backlog') as StoryStatus,
      kind: 'story' as StoryKind,
    };
  });
}

function classifyId(id: string): StoryKind {
  if (/-retrospective$/i.test(id)) return 'retrospective';
  if (/^epic-\d+$/i.test(id)) return 'epic';
  return 'story';
}

function epicIdOf(id: string): string {
  // "epic-1" → "epic-1", "epic-1-retrospective" → "epic-1", "1-2-foo" → "epic-1"
  const retroMatch = id.match(/^(epic-\d+)-retrospective$/i);
  if (retroMatch) return retroMatch[1].toLowerCase();
  const epicMatch = id.match(/^(epic-\d+)$/i);
  if (epicMatch) return epicMatch[1].toLowerCase();
  const storyMatch = id.match(/^(\d+)-\d+-/);
  if (storyMatch) return `epic-${storyMatch[1]}`;
  return '';
}

function humanizeId(id: string): string {
  // "1-2-frontend-projekt-initialisieren" → "1.2 Frontend Projekt Initialisieren"
  const storyMatch = id.match(/^(\d+)-(\d+)-(.+)$/);
  if (storyMatch) {
    const [, epic, story, slug] = storyMatch;
    return `${epic}.${story} ${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
  }
  const retroMatch = id.match(/^epic-(\d+)-retrospective$/i);
  if (retroMatch) return `Epic ${retroMatch[1]} Retrospective`;
  const epicMatch = id.match(/^epic-(\d+)$/i);
  if (epicMatch) return `Epic ${epicMatch[1]}`;
  return id;
}
