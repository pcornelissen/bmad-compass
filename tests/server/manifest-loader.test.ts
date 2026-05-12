// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { loadWorkflowsFromManifest } from '../../src/server/bmad/manifest-loader.js';

const manifestYaml = `installation:
  version: 6.6.0
modules:
  - name: bmm
    version: 6.6.0
    source: built-in
  - name: cis
    version: v0.2.0
    source: external
`;

const bmmCsv = `module,skill,display-name,menu-code,description,action,args,phase,after,before,required,output-location,outputs
BMad Method,_meta,,,,,,,,,false,foo,
BMad Method,bmad-create-prd,Create PRD,CP,Product Requirements Document workflow.,,,2-planning,,,true,planning_artifacts,prd
BMad Method,bmad-create-architecture,Create Architecture,CA,Document technical decisions.,,,3-solutioning,bmad-create-prd,,true,planning_artifacts,architecture
BMad Method,bmad-create-story,Create Story,CS,Story cycle start.,create,,4-implementation,bmad-sprint-planning,bmad-create-story:validate,true,implementation_artifacts,story
BMad Method,bmad-quick-dev,Quick Dev,QQ,Anytime helper.,,,anytime,,,false,implementation_artifacts,
`;

const cisCsv = `module,skill,display-name,menu-code,description,action,args,phase,after,before,required,output-location,outputs
Creative Intelligence,bmad-cis-storyteller,Storyteller,ST,Tell a tale.,,,1-analysis,,,false,planning_artifacts,story
`;

describe('loadWorkflowsFromManifest', () => {
  beforeEach(() => vol.reset());

  it('returns null when manifest.yaml is missing', async () => {
    vol.fromJSON({ '/proj/README.md': '# x' }, '/proj');
    const result = await loadWorkflowsFromManifest('/proj', vol.promises as any);
    expect(result).toBeNull();
  });

  it('parses modules and workflows from manifest + csvs', async () => {
    vol.fromJSON({
      '/proj/_bmad/_config/manifest.yaml': manifestYaml,
      '/proj/_bmad/bmm/module-help.csv': bmmCsv,
      '/proj/_bmad/cis/module-help.csv': cisCsv,
    }, '/proj');
    const result = await loadWorkflowsFromManifest('/proj', vol.promises as any);
    expect(result).not.toBeNull();
    expect(result!.modules.map(m => m.name)).toEqual(['bmm', 'cis']);
    const ids = result!.workflows.map(w => w.id);
    expect(ids).toContain('create-prd');
    expect(ids).toContain('create-architecture');
    expect(ids).toContain('create-story');
    expect(ids).toContain('cis-storyteller');
    // anytime workflows ARE included with cross=true (shown in helpers row)
    expect(ids).toContain('quick-dev');
    const qd = result!.workflows.find(w => w.id === 'quick-dev')!;
    expect(qd.cross).toBe(true);
    expect(ids).not.toContain('_meta');
  });

  it('skips bmad-agent-* skills (agent capabilities, not workflows)', async () => {
    const agentCsv = `module,skill,display-name,menu-code,description,action,args,phase,after,before,required,output-location,outputs
bmm,bmad-create-prd,Create PRD,CP,desc,,,2-planning,,,true,planning_artifacts,prd
bmm,bmad-agent-tech-writer,Write Document,WD,desc,write,,anytime,,,false,project-knowledge,document
cis,bmad-cis-agent-storyteller,Storyteller,ST,desc,,,1-analysis,,,false,planning_artifacts,story
`;
    vol.fromJSON({
      '/proj/_bmad/_config/manifest.yaml': manifestYaml,
      '/proj/_bmad/bmm/module-help.csv': agentCsv,
    }, '/proj');
    const result = await loadWorkflowsFromManifest('/proj', vol.promises as any);
    const ids = result!.workflows.map(w => w.id);
    expect(ids).toContain('create-prd');
    expect(ids).not.toContain('agent-tech-writer');
    expect(ids).not.toContain('cis-agent-storyteller');
  });

  it('extracts requires from after column, stripping bmad- prefix and :suffix', async () => {
    vol.fromJSON({
      '/proj/_bmad/_config/manifest.yaml': manifestYaml,
      '/proj/_bmad/bmm/module-help.csv': bmmCsv,
    }, '/proj');
    const result = await loadWorkflowsFromManifest('/proj', vol.promises as any);
    const arch = result!.workflows.find(w => w.id === 'create-architecture')!;
    expect(arch.requires).toEqual(['create-prd']);
    const story = result!.workflows.find(w => w.id === 'create-story')!;
    expect(story.requires).toEqual(['sprint-planning']);
  });

  it('maps phase prefix to numeric phase', async () => {
    vol.fromJSON({
      '/proj/_bmad/_config/manifest.yaml': manifestYaml,
      '/proj/_bmad/bmm/module-help.csv': bmmCsv,
    }, '/proj');
    const result = await loadWorkflowsFromManifest('/proj', vol.promises as any);
    expect(result!.workflows.find(w => w.id === 'create-prd')!.phase).toBe(2);
    expect(result!.workflows.find(w => w.id === 'create-architecture')!.phase).toBe(3);
    expect(result!.workflows.find(w => w.id === 'create-story')!.phase).toBe(4);
  });

  it('skips a module when its csv is missing without crashing', async () => {
    vol.fromJSON({
      '/proj/_bmad/_config/manifest.yaml': manifestYaml,
      '/proj/_bmad/bmm/module-help.csv': bmmCsv,
    }, '/proj');
    const result = await loadWorkflowsFromManifest('/proj', vol.promises as any);
    expect(result!.modules.map(m => m.name)).toEqual(['bmm', 'cis']);
    expect(result!.workflows.every(w => !w.id.startsWith('cis-'))).toBe(true);
  });

  it('handles malformed yaml by returning null', async () => {
    vol.fromJSON({
      '/proj/_bmad/_config/manifest.yaml': 'this is not: { valid: [yaml',
    }, '/proj');
    const result = await loadWorkflowsFromManifest('/proj', vol.promises as any);
    expect(result).toBeNull();
  });

  it('dedupes workflows with multiple action rows, preferring required variant', async () => {
    const dupCsv = `module,skill,display-name,menu-code,description,action,args,phase,after,before,required,output-location,outputs
bmm,bmad-create-story,Create Story,CS,Story cycle start.,create,,4-implementation,bmad-sprint-planning,bmad-create-story:validate,true,implementation_artifacts,story
bmm,bmad-create-story,Validate Story,VS,Validates story readiness.,validate,,4-implementation,bmad-create-story:create,bmad-dev-story,false,implementation_artifacts,story validation report
`;
    vol.fromJSON({
      '/proj/_bmad/_config/manifest.yaml': manifestYaml,
      '/proj/_bmad/bmm/module-help.csv': dupCsv,
    }, '/proj');
    const result = await loadWorkflowsFromManifest('/proj', vol.promises as any);
    const stories = result!.workflows.filter(w => w.id === 'create-story');
    expect(stories).toHaveLength(1);
    expect(stories[0].optional).toBe(false);
    expect(stories[0].title).toBe('Create Story');
  });

  it('uses required=false from csv as optional=true', async () => {
    vol.fromJSON({
      '/proj/_bmad/_config/manifest.yaml': manifestYaml,
      '/proj/_bmad/cis/module-help.csv': cisCsv,
    }, '/proj');
    const result = await loadWorkflowsFromManifest('/proj', vol.promises as any);
    const wf = result!.workflows.find(w => w.id === 'cis-storyteller')!;
    expect(wf.optional).toBe(true);
  });
});
