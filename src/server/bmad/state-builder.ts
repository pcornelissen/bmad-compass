import * as nodeFs from 'node:fs';
import path from 'node:path';
import type { DashboardState, Workflow, WorkflowStatus } from '../../shared/types.js';
import { WORKFLOWS } from './workflows.js';
import { scanArtifacts } from './scanner.js';
import { parseSprintStatus } from './sprint-status.js';
import { computeNextStep, currentPhase } from './next-step.js';

type FsLike = typeof nodeFs.promises;

export interface BuildStateOptions {
  fs?: FsLike;
}

export async function buildState(projectRoot: string, opts: BuildStateOptions = {}): Promise<DashboardState> {
  const fs = opts.fs ?? nodeFs.promises;
  const { hasBmad, artifacts } = await scanArtifacts(projectRoot, { fs });

  let stories = [];
  const sprintPath = path.join(projectRoot, '_bmad-output/implementation-artifacts/sprint-status.yaml');
  try {
    const yamlContent = await fs.readFile(sprintPath, 'utf8');
    stories = parseSprintStatus(yamlContent);
  } catch { /* no sprint file */ }

  const projectName = await resolveProjectName(projectRoot, fs);
  const phase = currentPhase(artifacts);
  const nextStep = computeNextStep({ hasBmad, artifacts, stories });

  const workflows: Workflow[] = WORKFLOWS.map(def => {
    const matched = artifacts.filter(a => a.workflowId === def.id);
    const status: WorkflowStatus = matched.length > 0 ? 'done' : 'pending';
    return { definition: def, status, artifacts: matched.map(a => a.path) };
  });

  return {
    projectRoot,
    projectName,
    hasBmad,
    currentPhase: phase,
    workflows,
    artifacts,
    nextStep,
    stories,
    generatedAt: Date.now(),
  };
}

async function resolveProjectName(projectRoot: string, fs: FsLike): Promise<string> {
  try {
    const pkg = await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8');
    const parsed = JSON.parse(pkg) as { name?: string };
    if (parsed.name) return parsed.name;
  } catch { /* no package.json */ }
  return path.basename(projectRoot);
}
