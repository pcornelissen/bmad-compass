import { describe, it, expect } from 'vitest';
import { parseSprintStatus } from '../../src/server/bmad/sprint-status.js';

describe('parseSprintStatus', () => {
  it('returns empty array on empty input', () => {
    expect(parseSprintStatus('')).toEqual([]);
  });

  it('parses stories with id, title, epicId, status', () => {
    const yaml = `
stories:
  - id: story-1
    title: Implement login
    epicId: epic-1
    status: in-progress
  - id: story-2
    title: Add password reset
    epicId: epic-1
    status: backlog
`;
    expect(parseSprintStatus(yaml)).toEqual([
      { id: 'story-1', title: 'Implement login', epicId: 'epic-1', status: 'in-progress', kind: 'story' },
      { id: 'story-2', title: 'Add password reset', epicId: 'epic-1', status: 'backlog', kind: 'story' },
    ]);
  });

  it('returns [] on malformed YAML (silent fail)', () => {
    expect(parseSprintStatus('stories: [')).toEqual([]);
  });

  it('coerces unknown status values to backlog', () => {
    const yaml = `stories:\n  - id: x\n    title: t\n    epicId: e\n    status: weird`;
    expect(parseSprintStatus(yaml)[0].status).toBe('backlog');
  });

  it('parses BMAD development_status flat map (real-world format)', () => {
    const yaml = `development_status:
  epic-1: in-progress
  1-1-backend-init: done
  1-2-frontend-init: done
  1-3-postgres-fundament: in-progress
  epic-1-retrospective: optional
  epic-2: backlog
  2-1-user-registrierung: backlog
`;
    const stories = parseSprintStatus(yaml);
    expect(stories).toHaveLength(7);

    const epic1 = stories.find(s => s.id === 'epic-1')!;
    expect(epic1.kind).toBe('epic');
    expect(epic1.status).toBe('in-progress');

    const story11 = stories.find(s => s.id === '1-1-backend-init')!;
    expect(story11.kind).toBe('story');
    expect(story11.epicId).toBe('epic-1');
    expect(story11.status).toBe('done');
    expect(story11.title).toBe('1.1 Backend Init');

    const retro1 = stories.find(s => s.id === 'epic-1-retrospective')!;
    expect(retro1.kind).toBe('retrospective');
    expect(retro1.status).toBe('optional');
    expect(retro1.epicId).toBe('epic-1');
  });
});
