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
    expect(state.workflows.find(w => w.definition.id === 'create-epics-and-stories')?.status).toBe('in-progress');
  });

  it('extracts human-readable title from product-brief H1', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/product-brief.md': '# Product Brief: WorkTide\n\nbody',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.projectName).toBe('WorkTide');
  });

  it('extracts title from suffixed product-brief variants', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/product-brief-something.md': '# Product Brief: My App\n',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.projectName).toBe('My App');
  });

  it('extracts title from PRD when product-brief absent', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# Product Requirements Document - Acme\n',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.projectName).toBe('Acme');
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
    expect(state.nextStep?.workflowId).toBe('create-story');
  });

  it('uses manifest-loader when _bmad/_config/manifest.yaml present', async () => {
    const manifest = `modules:\n  - name: bmm\n    version: 6.6.0\n    source: built-in\n`;
    const csv = `module,skill,display-name,menu-code,description,action,args,phase,after,before,required,output-location,outputs
bmm,bmad-create-prd,Create PRD,CP,desc,,,2-planning,,,true,planning_artifacts,prd
`;
    vol.fromJSON({
      '/proj/_bmad/_config/manifest.yaml': manifest,
      '/proj/_bmad/bmm/module-help.csv': csv,
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# PRD',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.workflowSource).toBe('manifest');
    expect(state.modules.map(m => m.name)).toEqual(['bmm']);
    expect(state.workflows.some(w => w.definition.id === 'create-prd')).toBe(true);
  });

  it('falls back to FALLBACK_WORKFLOWS when manifest is missing', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# PRD',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.workflowSource).toBe('fallback');
    expect(state.modules).toEqual([]);
    expect(state.workflows.length).toBeGreaterThan(10);
  });

  it('enriches workflow definitions with hints (agent from HINTS)', async () => {
    const manifest = `modules:\n  - name: bmm\n    version: 6.6.0\n    source: built-in\n`;
    const csv = `module,skill,display-name,menu-code,description,action,args,phase,after,before,required,output-location,outputs
bmm,bmad-create-prd,Create PRD,CP,desc,,,2-planning,,,true,planning_artifacts,prd
`;
    vol.fromJSON({
      '/proj/_bmad/_config/manifest.yaml': manifest,
      '/proj/_bmad/bmm/module-help.csv': csv,
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    const prd = state.workflows.find(w => w.definition.id === 'create-prd')!;
    expect(prd.definition.agent).toBe('bmad-agent-pm');
  });

  it('marks retrospective done when all epic retros are done in sprint-status', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# x',
      '/proj/_bmad-output/planning-artifacts/architecture.md': '# x',
      '/proj/_bmad-output/planning-artifacts/epics/epic-1.md': '# x',
      '/proj/_bmad-output/implementation-artifacts/sprint-status.yaml':
        'development_status:\n  epic-1: done\n  1-1-foo: done\n  epic-1-retrospective: done\n  epic-2: done\n  2-1-bar: done\n  epic-2-retrospective: done\n',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.nextStep).toBeNull();
    expect(state.workflows.find(w => w.definition.id === 'retrospective')?.status).toBe('done');
  });

  it('keeps retrospective pending when an epic retro is unfinished and not the next step', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# x',
      '/proj/_bmad-output/planning-artifacts/architecture.md': '# x',
      '/proj/_bmad-output/planning-artifacts/epics/epic-1.md': '# x',
      '/proj/_bmad-output/implementation-artifacts/sprint-status.yaml':
        'development_status:\n  epic-1: in-progress\n  1-1-foo: done\n  1-2-baz: backlog\n  epic-1-retrospective: backlog\n',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.nextStep?.workflowId).toBe('create-story');
    expect(state.workflows.find(w => w.definition.id === 'retrospective')?.status).toBe('pending');
  });

  it('falls back to artifact-based retrospective status when sprint-status has no retro entries', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# x',
      '/proj/_bmad-output/planning-artifacts/architecture.md': '# x',
      '/proj/_bmad-output/planning-artifacts/epics/epic-1.md': '# x',
      '/proj/_bmad-output/implementation-artifacts/retrospective.md': '# retro',
      '/proj/_bmad-output/implementation-artifacts/sprint-status.yaml':
        'development_status:\n  epic-1: done\n  1-1-foo: done\n',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    expect(state.workflows.find(w => w.definition.id === 'retrospective')?.status).toBe('done');
  });

  it('applies project .compass-hints.yaml over the built-in hints', async () => {
    vol.fromJSON({
      '/proj/.compass-hints.yaml':
        'workflows:\n  create-prd:\n    sectionHints:\n      - Problem Statement\n      - Compliance Constraints\n',
      '/proj/_bmad-output/planning-artifacts/PRD.md': '## Problem Statement\n',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    const prd = state.workflows.find(w => w.definition.id === 'create-prd')!;
    const labels = prd.subSteps!.map(s => s.label);
    // Project-specific hint surfaces...
    expect(prd.subSteps!.some(s => s.status === 'hinted' && s.label === 'Compliance Constraints')).toBe(true);
    // ...and the built-in hints it replaced no longer appear.
    expect(labels).not.toContain('User Personas');
  });

  it('attaches subSteps to workflows that have hints or matching files', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '## Problem Statement\n\n## Goals\n',
    }, '/proj');
    const state = await buildState('/proj', { fs: vol.promises as any });
    const prd = state.workflows.find(w => w.definition.id === 'create-prd')!;
    expect(prd.subSteps).toBeDefined();
    const done = prd.subSteps!.filter(s => s.status === 'done').map(s => s.label);
    expect(done).toEqual(['Problem Statement', 'Goals']);
    expect(prd.subSteps!.some(s => s.status === 'hinted' && s.label === 'User Personas')).toBe(true);
  });
});
