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
      { id: 'story-1', title: 'Implement login', epicId: 'epic-1', status: 'in-progress' },
      { id: 'story-2', title: 'Add password reset', epicId: 'epic-1', status: 'backlog' },
    ]);
  });

  it('returns [] on malformed YAML (silent fail)', () => {
    expect(parseSprintStatus('stories: [')).toEqual([]);
  });

  it('coerces unknown status values to backlog', () => {
    const yaml = `stories:\n  - id: x\n    title: t\n    epicId: e\n    status: weird`;
    expect(parseSprintStatus(yaml)[0].status).toBe('backlog');
  });
});
