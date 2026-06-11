import * as nodeFs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

type FsLike = typeof nodeFs.promises;

export interface WorkflowHint {
  agent?: string;
  docsUrl?: string;
  sectionHints?: string[];
}

export const HINTS: Record<string, WorkflowHint> = {
  'brainstorming': { agent: 'bmad-agent-analyst' },
  'market-research': { agent: 'bmad-agent-analyst' },
  'domain-research': { agent: 'bmad-agent-analyst' },
  'technical-research': { agent: 'bmad-agent-analyst' },
  'product-brief': { agent: 'bmad-agent-analyst' },
  'prfaq': { agent: 'bmad-agent-analyst' },
  'create-prd': {
    agent: 'bmad-agent-pm',
    sectionHints: [
      'Problem Statement',
      'Goals',
      'User Personas',
      'Functional Requirements',
      'Non-Functional Requirements',
      'Success Metrics',
    ],
  },
  'create-ux-design': {
    agent: 'bmad-agent-ux-designer',
    sectionHints: ['User Flows', 'Wireframes', 'Personas', 'Accessibility'],
  },
  'create-architecture': {
    agent: 'bmad-agent-architect',
    sectionHints: ['Components', 'Data Model', 'API Design', 'Tech Stack', 'Deployment'],
  },
  'create-epics-and-stories': { agent: 'bmad-agent-pm' },
  'check-implementation-readiness': { agent: 'bmad-agent-architect' },
  'sprint-planning': { agent: 'bmad-agent-pm' },
  'create-story': { agent: 'bmad-agent-pm' },
  'dev-story': { agent: 'bmad-agent-dev' },
  'code-review': { agent: 'bmad-agent-dev' },
  'retrospective': { agent: 'bmad-agent-pm' },
};

export function getHint(workflowId: string, hints: Record<string, WorkflowHint> = HINTS): WorkflowHint | undefined {
  return hints[workflowId];
}

export function applyHintsToDefinition<T extends { id: string; agent: string; docsUrl: string }>(
  def: T,
  hints: Record<string, WorkflowHint> = HINTS,
): T {
  const hint = hints[def.id];
  if (!hint) return def;
  if (!def.agent && hint.agent) def.agent = hint.agent;
  if (!def.docsUrl || def.docsUrl.endsWith(`/workflows/${def.id}`)) {
    if (hint.docsUrl) def.docsUrl = hint.docsUrl;
  }
  return def;
}

/** Merge project hints over a base table without mutating either. Project values win per field. */
export function mergeHints(
  base: Record<string, WorkflowHint>,
  overrides: Record<string, WorkflowHint>,
): Record<string, WorkflowHint> {
  const merged: Record<string, WorkflowHint> = {};
  for (const [id, hint] of Object.entries(base)) merged[id] = { ...hint };
  for (const [id, hint] of Object.entries(overrides)) {
    merged[id] = { ...merged[id], ...hint };
  }
  return merged;
}

/**
 * Load project-specific hints from `.compass-hints.yaml` (or `.yml`) at the project root.
 * Expected shape: `workflows: { <id>: { agent?, docsUrl?, sectionHints?: string[] } }`.
 * Returns {} when the file is missing or unparseable; ignores malformed entries.
 */
export async function loadProjectHints(projectRoot: string, fs: FsLike = nodeFs.promises): Promise<Record<string, WorkflowHint>> {
  let content: string | null = null;
  for (const name of ['.compass-hints.yaml', '.compass-hints.yml']) {
    try {
      content = await fs.readFile(path.join(projectRoot, name), 'utf8');
      break;
    } catch { /* try next */ }
  }
  if (content === null) return {};

  let data: unknown;
  try { data = yaml.load(content); }
  catch { return {}; }

  const workflows = (data as { workflows?: unknown } | null)?.workflows;
  if (!workflows || typeof workflows !== 'object' || Array.isArray(workflows)) return {};

  const result: Record<string, WorkflowHint> = {};
  for (const [id, raw] of Object.entries(workflows as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const entry = raw as Record<string, unknown>;
    const hint: WorkflowHint = {};
    if (typeof entry.agent === 'string') hint.agent = entry.agent;
    if (typeof entry.docsUrl === 'string') hint.docsUrl = entry.docsUrl;
    if (Array.isArray(entry.sectionHints)) {
      const sections = entry.sectionHints.filter((s): s is string => typeof s === 'string');
      if (sections.length > 0) hint.sectionHints = sections;
    }
    if (Object.keys(hint).length > 0) result[id] = hint;
  }
  return result;
}
