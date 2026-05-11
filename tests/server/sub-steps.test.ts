// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { computeSubSteps } from '../../src/server/bmad/sub-steps.js';
import type { Artifact } from '../../src/shared/types.js';

const prdArtifact = (path = '_bmad-output/planning-artifacts/PRD.md'): Artifact => ({
  path,
  displayName: 'PRD',
  workflowId: 'create-prd',
  agent: null,
  mtime: 0,
  sizeBytes: 100,
});

const epicArtifact = (basename: string): Artifact => ({
  path: `_bmad-output/planning-artifacts/epics/${basename}`,
  displayName: basename,
  workflowId: 'create-epics-and-stories',
  agent: null,
  mtime: 0,
  sizeBytes: 50,
});

describe('computeSubSteps', () => {
  beforeEach(() => vol.reset());

  it('returns undefined for workflows without artifact and without hints', async () => {
    const result = await computeSubSteps('check-implementation-readiness', [], '/proj', vol.promises as any);
    expect(result).toBeUndefined();
  });

  it('returns hinted-only list when artifact missing but hint exists', async () => {
    const result = await computeSubSteps('create-prd', [], '/proj', vol.promises as any);
    expect(result).toBeDefined();
    expect(result!.every(s => s.status === 'hinted')).toBe(true);
    expect(result!.length).toBe(6);
  });

  it('parses real markdown headings as done substeps', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md':
        '# PRD\n\n## Problem Statement\nfoo\n\n## Goals\nbar\n\n### Detail\nbaz\n',
    }, '/proj');
    const result = await computeSubSteps('create-prd', [prdArtifact()], '/proj', vol.promises as any);
    const done = result!.filter(s => s.status === 'done').map(s => s.label);
    expect(done).toEqual(['Problem Statement', 'Goals', 'Detail']);
  });

  it('keeps unmatched hints as hinted alongside done', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md':
        '# PRD\n\n## Problem Statement\n\n## Goals\n',
    }, '/proj');
    const result = await computeSubSteps('create-prd', [prdArtifact()], '/proj', vol.promises as any);
    const hinted = result!.filter(s => s.status === 'hinted').map(s => s.label);
    expect(hinted).toEqual(['User Personas', 'Functional Requirements', 'Non-Functional Requirements', 'Success Metrics']);
  });

  it('matches hint with messy heading text (case + punctuation insensitive)', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md':
        '## 2. problem statement (draft)\n\n## Non-Functional Requirements (MVP)\n',
    }, '/proj');
    const result = await computeSubSteps('create-prd', [prdArtifact()], '/proj', vol.promises as any);
    const hintedLabels = result!.filter(s => s.status === 'hinted').map(s => s.label);
    expect(hintedLabels).not.toContain('Problem Statement');
    expect(hintedLabels).not.toContain('Non-Functional Requirements');
  });

  it('produces file-kind substeps for epics with label-extraction', async () => {
    const artifacts = [
      epicArtifact('epic-1-auth.md'),
      epicArtifact('epic-2-billing.md'),
      epicArtifact('misc.md'),
    ];
    const result = await computeSubSteps('create-epics-and-stories', artifacts, '/proj', vol.promises as any);
    expect(result).toBeDefined();
    expect(result!.length).toBe(3);
    expect(result!.every(s => s.status === 'done' && s.kind === 'file')).toBe(true);
    const labels = result!.map(s => s.label);
    expect(labels).toContain('auth');
    expect(labels).toContain('billing');
    expect(labels).toContain('misc');
  });

  it('treats unreadable markdown file as empty (only hinted)', async () => {
    const result = await computeSubSteps('create-prd', [prdArtifact()], '/proj', vol.promises as any);
    expect(result!.every(s => s.status === 'hinted')).toBe(true);
  });

  it('produces no substeps for workflows without hints and without matching artifacts', async () => {
    const result = await computeSubSteps('correct-course', [], '/proj', vol.promises as any);
    expect(result).toBeUndefined();
  });
});
