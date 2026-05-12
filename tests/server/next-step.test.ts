import { describe, it, expect } from 'vitest';
import { computeNextStep } from '../../src/server/bmad/next-step.js';
import type { Artifact, SprintStory } from '../../src/shared/types.js';

const art = (workflowId: string): Artifact => ({
  path: `_bmad-output/${workflowId}.md`,
  displayName: workflowId,
  workflowId,
  agent: null,
  mtime: 0,
  sizeBytes: 0,
});

describe('computeNextStep', () => {
  it('recommends starting with help when no bmad dir', () => {
    const r = computeNextStep({ hasBmad: false, artifacts: [], stories: [] });
    expect(r?.workflowId).toBe('help');
  });

  it('recommends create-prd when bmad exists but no PRD', () => {
    const r = computeNextStep({ hasBmad: true, artifacts: [], stories: [] });
    expect(r?.workflowId).toBe('create-prd');
  });

  it('recommends create-architecture when PRD exists', () => {
    const r = computeNextStep({ hasBmad: true, artifacts: [art('create-prd')], stories: [] });
    expect(r?.workflowId).toBe('create-architecture');
  });

  it('recommends epics when architecture exists', () => {
    const r = computeNextStep({
      hasBmad: true,
      artifacts: [art('create-prd'), art('create-architecture')],
      stories: [],
    });
    expect(r?.workflowId).toBe('create-epics-and-stories');
  });

  it('recommends sprint-planning when epics exist but no sprint', () => {
    const r = computeNextStep({
      hasBmad: true,
      artifacts: [art('create-prd'), art('create-architecture'), art('create-epics-and-stories')],
      stories: [],
    });
    expect(r?.workflowId).toBe('sprint-planning');
  });

  it('recommends create-story when stories have no in-flight work', () => {
    const stories: SprintStory[] = [
      { id: 'epic-1', title: 'Epic 1', epicId: 'epic-1', status: 'backlog', kind: 'epic' },
      { id: '1-1-foo', title: '1.1 Foo', epicId: 'epic-1', status: 'backlog', kind: 'story' },
    ];
    const r = computeNextStep({
      hasBmad: true,
      artifacts: [art('create-prd'), art('create-architecture'), art('create-epics-and-stories'), art('sprint-planning')],
      stories,
    });
    expect(r?.workflowId).toBe('create-story');
    expect(r?.reason).toContain('1-1-foo');
  });

  it('recommends dev-story when a story is in-progress', () => {
    const stories: SprintStory[] = [
      { id: '1-1-foo', title: '1.1', epicId: 'epic-1', status: 'in-progress', kind: 'story' },
      { id: '1-2-bar', title: '1.2', epicId: 'epic-1', status: 'backlog', kind: 'story' },
    ];
    const r = computeNextStep({
      hasBmad: true,
      artifacts: [art('create-prd'), art('create-architecture'), art('create-epics-and-stories'), art('sprint-planning')],
      stories,
    });
    expect(r?.workflowId).toBe('dev-story');
    expect(r?.reason).toContain('1-1-foo');
  });

  it('recommends code-review when a story is in review', () => {
    const stories: SprintStory[] = [
      { id: '1-1-foo', title: '1.1', epicId: 'epic-1', status: 'review', kind: 'story' },
      { id: '1-2-bar', title: '1.2', epicId: 'epic-1', status: 'backlog', kind: 'story' },
    ];
    const r = computeNextStep({
      hasBmad: true,
      artifacts: [art('create-prd'), art('create-architecture'), art('create-epics-and-stories'), art('sprint-planning')],
      stories,
    });
    expect(r?.workflowId).toBe('code-review');
  });

  it('returns null when all stories done and only optional retros remain', () => {
    const stories: SprintStory[] = [
      { id: '1-1-foo', title: '1.1', epicId: 'epic-1', status: 'done', kind: 'story' },
      { id: 'epic-1-retrospective', title: 'Epic 1 Retro', epicId: 'epic-1', status: 'done', kind: 'retrospective' },
    ];
    const r = computeNextStep({
      hasBmad: true,
      artifacts: [art('create-prd'), art('create-architecture'), art('create-epics-and-stories'), art('sprint-planning')],
      stories,
    });
    expect(r).toBeNull();
  });

  it('result includes command and agent', () => {
    const r = computeNextStep({ hasBmad: true, artifacts: [], stories: [] });
    expect(r?.command).toBe('bmad-create-prd');
    expect(r?.agent).toBe('bmad-agent-pm');
    expect(r?.reason).toBeTruthy();
  });
});
