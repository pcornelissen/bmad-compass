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

  it('recommends dev-story when stories are pending', () => {
    const stories: SprintStory[] = [{ id: 's1', title: 't', epicId: 'e1', status: 'backlog' }];
    const r = computeNextStep({
      hasBmad: true,
      artifacts: [art('create-prd'), art('create-architecture'), art('create-epics-and-stories'), art('sprint-planning')],
      stories,
    });
    expect(r?.workflowId).toBe('dev-story');
  });

  it('returns null when all stories done', () => {
    const stories: SprintStory[] = [{ id: 's1', title: 't', epicId: 'e1', status: 'done' }];
    const r = computeNextStep({
      hasBmad: true,
      artifacts: [art('create-prd'), art('create-architecture'), art('create-epics-and-stories'), art('sprint-planning')],
      stories,
    });
    expect(r?.workflowId === 'retrospective' || r === null).toBe(true);
  });

  it('result includes command and agent', () => {
    const r = computeNextStep({ hasBmad: true, artifacts: [], stories: [] });
    expect(r?.command).toBe('bmad-create-prd');
    expect(r?.agent).toBe('bmad-agent-pm');
    expect(r?.reason).toBeTruthy();
  });
});
