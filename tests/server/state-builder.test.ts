import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { buildState } from '../../src/server/bmad/state-builder.js';

describe('buildState', () => {
  beforeEach(() => vol.reset());

  it('returns hasBmad=false for an empty project', async () => {
    vol.fromJSON({ '/proj/README.md': '# x' }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.hasBmad).toBe(false);
    expect(state.nextStep?.workflowId).toBe('help');
    expect(state.currentPhase).toBe(1);
  });

  it('computes derived state correctly from artifacts', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# PRD',
      '/proj/_bmad-output/planning-artifacts/architecture.md': '# arch',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.hasBmad).toBe(true);
    expect(state.currentPhase).toBe(3);
    expect(state.nextStep?.workflowId).toBe('create-epics-and-stories');
    expect(state.workflows.find(w => w.definition.id === 'create-prd')?.status).toBe('done');
    expect(state.workflows.find(w => w.definition.id === 'create-architecture')?.status).toBe('done');
    expect(state.workflows.find(w => w.definition.id === 'create-epics-and-stories')?.status).toBe('pending');
  });

  it('uses package.json name when available', async () => {
    vol.fromJSON({
      '/proj/package.json': JSON.stringify({ name: 'my-cool-thing' }),
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# PRD',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.projectName).toBe('my-cool-thing');
  });

  it('falls back to folder name when no package.json', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# PRD',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.projectName).toBe('proj');
  });

  it('parses sprint stories when sprint-status.yaml present', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# x',
      '/proj/_bmad-output/planning-artifacts/architecture.md': '# x',
      '/proj/_bmad-output/planning-artifacts/epics/epic-1.md': '# x',
      '/proj/_bmad-output/implementation-artifacts/sprint-status.yaml':
        'stories:\n  - id: s1\n    title: t\n    epicId: e1\n    status: backlog',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.stories).toHaveLength(1);
    expect(state.nextStep?.workflowId).toBe('dev-story');
  });
});
