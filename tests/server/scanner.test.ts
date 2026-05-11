import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { scanArtifacts } from '../../src/server/bmad/scanner.js';

describe('scanArtifacts', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns empty when _bmad-output is missing', async () => {
    vol.fromJSON({ '/proj/README.md': '# x' }, '/proj');
    const result = await scanArtifacts('/proj', { fs: vol.promises as any });
    expect(result.hasBmad).toBe(false);
    expect(result.artifacts).toEqual([]);
  });

  it('detects PRD and resolves workflow id from path', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# PRD\n\nbody',
    }, '/proj');
    const result = await scanArtifacts('/proj', { fs: vol.promises as any });
    expect(result.hasBmad).toBe(true);
    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0].path).toBe('_bmad-output/planning-artifacts/PRD.md');
    expect(result.artifacts[0].workflowId).toBe('create-prd');
    expect(result.artifacts[0].displayName).toBe('PRD');
  });

  it('honors frontmatter workflow over path convention', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/architecture.md':
        '---\nworkflow: create-architecture\nagent: bmad-agent-architect\n---\n# arch',
    }, '/proj');
    const result = await scanArtifacts('/proj', { fs: vol.promises as any });
    expect(result.artifacts[0].workflowId).toBe('create-architecture');
    expect(result.artifacts[0].agent).toBe('bmad-agent-architect');
  });

  it('counts epics as a single workflow trigger if any epic file exists', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/epics/epic-1-foo.md': '# epic',
      '/proj/_bmad-output/planning-artifacts/epics/epic-2-bar.md': '# epic',
    }, '/proj');
    const result = await scanArtifacts('/proj', { fs: vol.promises as any });
    const epicArtifacts = result.artifacts.filter(a => a.workflowId === 'create-epics-and-stories');
    expect(epicArtifacts).toHaveLength(2);
  });

  it('detects brainstorming, research, brief, prfaq with suffix variants', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/brainstorming-session-2026-05-11.md': '# x',
      '/proj/_bmad-output/planning-artifacts/market-research-saas.md': '# x',
      '/proj/_bmad-output/planning-artifacts/product-brief.md': '# x',
      '/proj/_bmad-output/planning-artifacts/prfaq-launch.md': '# x',
    }, '/proj');
    const result = await scanArtifacts('/proj', { fs: vol.promises as any });
    const ids = result.artifacts.map(a => a.workflowId);
    expect(ids).toContain('brainstorming');
    expect(ids).toContain('market-research');
    expect(ids).toContain('product-brief');
    expect(ids).toContain('prfaq');
  });

  it('detects architecture and retrospective with suffix variants', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/architecture-v2.md': '# x',
      '/proj/_bmad-output/implementation-artifacts/retrospective-epic-1.md': '# x',
    }, '/proj');
    const result = await scanArtifacts('/proj', { fs: vol.promises as any });
    const ids = result.artifacts.map(a => a.workflowId);
    expect(ids).toContain('create-architecture');
    expect(ids).toContain('retrospective');
  });

  it('detects ux design files with various naming conventions', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/ux-design-specification.md': '# x',
      '/proj/_bmad-output/planning-artifacts/ux-spec.md': '# x',
      '/proj/_bmad-output/planning-artifacts/ux-flows.md': '# x',
    }, '/proj');
    const result = await scanArtifacts('/proj', { fs: vol.promises as any });
    const ux = result.artifacts.filter(a => a.workflowId === 'create-ux-design');
    expect(ux).toHaveLength(3);
  });

  it('detects prd-validation-report.md as validate-prd workflow', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/prd-validation-report.md': '# x',
    }, '/proj');
    const result = await scanArtifacts('/proj', { fs: vol.promises as any });
    expect(result.artifacts[0].workflowId).toBe('validate-prd');
  });

  it('detects sprint-status.yaml', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/implementation-artifacts/sprint-status.yaml': 'stories: []',
    }, '/proj');
    const result = await scanArtifacts('/proj', { fs: vol.promises as any });
    expect(result.artifacts[0].workflowId).toBe('sprint-planning');
  });
});
