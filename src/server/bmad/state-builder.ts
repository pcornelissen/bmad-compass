import * as nodeFs from 'node:fs';
import path from 'node:path';
import type {
  DashboardState,
  ModuleInfo,
  SprintStory,
  Workflow,
  WorkflowDefinition,
  WorkflowStatus,
} from '../../shared/types.js';
import { FALLBACK_WORKFLOWS } from './workflows.js';
import { scanArtifacts } from './scanner.js';
import { parseSprintStatus } from './sprint-status.js';
import { computeNextStep, currentPhase } from './next-step.js';
import { loadWorkflowsFromManifest } from './manifest-loader.js';
import { applyHintsToDefinition } from './hints.js';
import { computeSubSteps } from './sub-steps.js';

type FsLike = typeof nodeFs.promises;

export interface BuildStateOptions {
  fs?: FsLike;
}

export async function buildState(projectRoot: string, opts: BuildStateOptions = {}): Promise<DashboardState> {
  const fs = opts.fs ?? nodeFs.promises;
  const { hasBmad, artifacts } = await scanArtifacts(projectRoot, { fs });

  let stories: SprintStory[] = [];
  const sprintPath = path.join(projectRoot, '_bmad-output/implementation-artifacts/sprint-status.yaml');
  try {
    const yamlContent = await fs.readFile(sprintPath, 'utf8');
    stories = parseSprintStatus(yamlContent);
  } catch { /* no sprint file */ }

  const projectName = await resolveProjectName(projectRoot, fs);

  const manifestResult = await loadWorkflowsFromManifest(projectRoot, fs);
  const workflowDefs: WorkflowDefinition[] = (manifestResult?.workflows ?? FALLBACK_WORKFLOWS)
    .map(def => applyHintsToDefinition({ ...def }));
  const modules: ModuleInfo[] = manifestResult?.modules ?? [];
  const workflowSource: 'manifest' | 'fallback' = manifestResult ? 'manifest' : 'fallback';

  const phase = currentPhase(artifacts);
  const nextStep = computeNextStep({ hasBmad, artifacts, stories });

  const workflows: Workflow[] = [];
  for (const def of workflowDefs) {
    const matched = artifacts.filter(a => a.workflowId === def.id);
    let status: WorkflowStatus = matched.length > 0 ? 'done' : 'pending';
    if (def.id === nextStep?.workflowId) status = 'in-progress';
    const subSteps = await computeSubSteps(def.id, artifacts, projectRoot, fs);
    workflows.push({ definition: def, status, artifacts: matched.map(a => a.path), subSteps });
  }

  return {
    projectRoot,
    projectName,
    hasBmad,
    currentPhase: phase,
    workflows,
    artifacts,
    nextStep,
    stories,
    modules,
    workflowSource,
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
