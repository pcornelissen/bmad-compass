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
import { applyHintsToDefinition, loadProjectHints, mergeHints, HINTS } from './hints.js';
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

  const projectHints = await loadProjectHints(projectRoot, fs);
  const hints = mergeHints(HINTS, projectHints);

  const manifestResult = await loadWorkflowsFromManifest(projectRoot, fs);
  const workflowDefs: WorkflowDefinition[] = (manifestResult?.workflows ?? FALLBACK_WORKFLOWS)
    .map(def => applyHintsToDefinition({ ...def }, hints));
  const modules: ModuleInfo[] = manifestResult?.modules ?? [];
  const workflowSource: 'manifest' | 'fallback' = manifestResult ? 'manifest' : 'fallback';

  const phase = currentPhase(artifacts);
  const nextStep = computeNextStep({ hasBmad, artifacts, stories });

  const retroAggregate = aggregateRetroStatus(stories);

  const workflows: Workflow[] = [];
  for (const def of workflowDefs) {
    const matched = artifacts.filter(a => a.workflowId === def.id);
    let status: WorkflowStatus = matched.length > 0 ? 'done' : 'pending';
    // Retrospectives are tracked per-epic in sprint-status, not always as files.
    if (def.id === 'retrospective' && retroAggregate) status = retroAggregate;
    if (def.id === nextStep?.workflowId) status = 'in-progress';
    const subSteps = await computeSubSteps(def.id, artifacts, projectRoot, fs, hints);
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

/**
 * Aggregate per-epic retrospective entries from sprint-status into a single status
 * for the retrospective workflow. Returns null when there are no retro entries, so the
 * caller falls back to artifact-based detection.
 *   done    → at least one retro done and no actionable (non-done, non-optional) retros remain
 *   pending → otherwise (some retro still actionable, or all optional and untouched)
 */
function aggregateRetroStatus(stories: SprintStory[]): WorkflowStatus | null {
  const retros = stories.filter(s => s.kind === 'retrospective');
  if (retros.length === 0) return null;
  const actionable = retros.filter(s => s.status !== 'done' && s.status !== 'optional');
  const anyDone = retros.some(s => s.status === 'done');
  return actionable.length === 0 && anyDone ? 'done' : 'pending';
}

async function resolveProjectName(projectRoot: string, fs: FsLike): Promise<string> {
  // 1) Try human-readable title from BMAD planning artifacts (product brief preferred, then PRD).
  const candidates = [
    'product-brief.md',
    'brief.md',
    'product-brief-distillate.md',
    'PRD.md',
    'prd.md',
  ];
  for (const name of candidates) {
    const title = await readArtifactTitle(path.join(projectRoot, '_bmad-output/planning-artifacts', name), fs);
    if (title) return title;
  }
  // Also scan any product-brief*.md or prd*.md file (BMAD adds suffixes).
  try {
    const planningDir = path.join(projectRoot, '_bmad-output/planning-artifacts');
    const entries = await fs.readdir(planningDir);
    const preferred = entries
      .filter(n => /^(product-)?brief.*\.md$/i.test(n) || /^prd.*\.md$/i.test(n))
      .filter(n => !/validation|review|distillate/i.test(n))
      .sort();
    for (const n of preferred) {
      const title = await readArtifactTitle(path.join(planningDir, n), fs);
      if (title) return title;
    }
  } catch { /* no planning dir */ }

  // 2) package.json fallback.
  try {
    const pkg = await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8');
    const parsed = JSON.parse(pkg) as { name?: string };
    if (parsed.name) return parsed.name;
  } catch { /* no package.json */ }

  // 3) Last resort: folder name.
  return path.basename(projectRoot);
}

async function readArtifactTitle(filePath: string, fs: FsLike): Promise<string | null> {
  let content: string;
  try { content = await fs.readFile(filePath, 'utf8'); }
  catch { return null; }
  // Skip optional frontmatter.
  const body = content.replace(/^---[\s\S]*?---\s*/m, '');
  const match = body.match(/^#\s+(.+?)\s*$/m);
  if (!match) return null;
  return cleanProjectTitle(match[1]);
}

const GENERIC_DOC_WORDS = /^(product\s+brief|product\s+requirements?\s+document|prd|brief|architecture(?:\s+decision\s+document)?|ux\s+design\s+specification|distillate|epic\s+breakdown)$/i;

function cleanProjectTitle(raw: string): string | null {
  // Strip generic doc-type prefix when followed by separator (colon, dash, em-dash).
  const prefixPattern = /^(product\s+brief|product\s+requirements?\s+document|prd|brief|architecture(?:\s+decision\s+document)?|ux\s+design\s+specification)\s*[:\-—]\s*/i;
  let title = raw.replace(prefixPattern, '').trim();
  // Strip trailing project descriptors.
  title = title.replace(/\s+(prd|brief|distillate|specification|document)$/i, '').trim();
  if (!title) return null;
  // Reject result if it's still just a generic doc-type word (e.g. raw was "PRD" alone).
  if (GENERIC_DOC_WORDS.test(title)) return null;
  return title;
}
