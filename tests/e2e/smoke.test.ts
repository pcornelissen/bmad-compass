import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { bootstrap } from '../../src/server/index.js';

describe('E2E smoke', () => {
  let tmp: string;
  let close: () => Promise<void>;
  let url: string;

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-smoke-'));
    fs.mkdirSync(path.join(tmp, '_bmad-output/planning-artifacts'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '_bmad-output/planning-artifacts/PRD.md'), '# PRD\n');
    const result = await bootstrap({ projectRoot: tmp, port: 0, openBrowser: false, staticDir: tmp });
    url = result.url;
    close = result.close;
  }, 15_000);

  afterAll(async () => {
    await close();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('serves /api/state with PRD detected', async () => {
    const res = await fetch(`${url}/api/state`);
    const body = await res.json();
    expect(body.hasBmad).toBe(true);
    expect(body.artifacts.some((a: any) => a.workflowId === 'create-prd')).toBe(true);
    expect(body.nextStep.workflowId).toBe('create-architecture');
  });

  it('updates state when new artifact appears (via watcher + WS)', async () => {
    // Trigger update by creating architecture.md, then poll /api/state.
    fs.writeFileSync(path.join(tmp, '_bmad-output/planning-artifacts/architecture.md'), '# arch\n');
    // Allow watcher debounce + state refresh.
    await new Promise(r => setTimeout(r, 500));
    const res = await fetch(`${url}/api/state`);
    const body = await res.json();
    expect(body.artifacts.some((a: any) => a.workflowId === 'create-architecture')).toBe(true);
    expect(body.nextStep.workflowId).toBe('create-epics-and-stories');
  }, 5000);

  it('exposes modules and substeps when manifest + PRD with sections present', async () => {
    fs.mkdirSync(path.join(tmp, '_bmad/_config'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '_bmad/bmm'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, '_bmad/_config/manifest.yaml'),
      'modules:\n  - name: bmm\n    version: 6.6.0\n    source: built-in\n',
    );
    fs.writeFileSync(
      path.join(tmp, '_bmad/bmm/module-help.csv'),
      'module,skill,display-name,menu-code,description,action,args,phase,after,before,required,output-location,outputs\n' +
        'bmm,bmad-create-prd,Create PRD,CP,desc,,,2-planning,,,true,planning_artifacts,prd\n',
    );
    fs.writeFileSync(
      path.join(tmp, '_bmad-output/planning-artifacts/PRD.md'),
      '## Problem Statement\n\nfoo\n\n## Goals\n\nbar\n',
    );
    await new Promise(r => setTimeout(r, 600));

    const res = await fetch(`${url}/api/state`);
    const body = await res.json();
    expect(body.workflowSource).toBe('manifest');
    expect(body.modules.map((m: any) => m.name)).toContain('bmm');
    const prd = body.workflows.find((w: any) => w.definition.id === 'create-prd');
    expect(prd).toBeDefined();
    expect(prd.subSteps).toBeDefined();
    const doneLabels = prd.subSteps.filter((s: any) => s.status === 'done').map((s: any) => s.label);
    expect(doneLabels).toEqual(expect.arrayContaining(['Problem Statement', 'Goals']));
    const hintedLabels = prd.subSteps.filter((s: any) => s.status === 'hinted').map((s: any) => s.label);
    expect(hintedLabels).toContain('User Personas');
  }, 8000);
});
