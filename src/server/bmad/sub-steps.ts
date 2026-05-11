import * as nodeFs from 'node:fs';
import path from 'node:path';
import type { Artifact, SubStep } from '../../shared/types.js';
import { getHint } from './hints.js';

type FsLike = typeof nodeFs.promises;

const FILE_WORKFLOWS = new Set(['create-epics-and-stories', 'create-story']);

export async function computeSubSteps(
  workflowId: string,
  artifacts: Artifact[],
  projectRoot: string,
  fs: FsLike,
): Promise<SubStep[] | undefined> {
  if (FILE_WORKFLOWS.has(workflowId)) {
    return computeFileSubSteps(workflowId, artifacts);
  }
  return computeSectionSubSteps(workflowId, artifacts, projectRoot, fs);
}

function computeFileSubSteps(workflowId: string, artifacts: Artifact[]): SubStep[] | undefined {
  const matched = artifacts.filter(a => a.workflowId === workflowId);
  if (matched.length === 0) return undefined;
  return matched.map(a => {
    const base = path.basename(a.path, path.extname(a.path));
    const label = labelFromFile(workflowId, base);
    return { id: base, label, status: 'done' as const, kind: 'file' as const };
  });
}

function labelFromFile(workflowId: string, basename: string): string {
  const stripped = workflowId === 'create-epics-and-stories'
    ? basename.replace(/^epic-\d+-/, '').replace(/^epic-/, '')
    : basename.replace(/^story-\d+-/, '').replace(/^story-/, '');
  return stripped || basename;
}

async function computeSectionSubSteps(
  workflowId: string,
  artifacts: Artifact[],
  projectRoot: string,
  fs: FsLike,
): Promise<SubStep[] | undefined> {
  const hint = getHint(workflowId);
  const mdArtifact = artifacts.find(a => a.workflowId === workflowId && a.path.endsWith('.md'));

  let doneSubSteps: SubStep[] = [];
  if (mdArtifact) {
    try {
      const content = await fs.readFile(path.join(projectRoot, mdArtifact.path), 'utf8');
      doneSubSteps = extractHeadings(content);
    } catch { /* unreadable — treat as empty */ }
  }

  const sectionHints = hint?.sectionHints ?? [];
  if (sectionHints.length === 0 && doneSubSteps.length === 0) {
    return undefined;
  }

  const hintedSubSteps: SubStep[] = sectionHints
    .filter(h => !doneSubSteps.some(d => matchesHint(d.label, h)))
    .map(h => ({
      id: toKebab(h),
      label: h,
      status: 'hinted' as const,
      kind: 'section' as const,
    }));

  return [...doneSubSteps, ...hintedSubSteps];
}

function extractHeadings(markdown: string): SubStep[] {
  const re = /^(#{2,3})\s+(.+?)\s*$/gm;
  const result: SubStep[] = [];
  let match;
  while ((match = re.exec(markdown)) !== null) {
    const label = match[2].trim();
    result.push({
      id: toKebab(label),
      label,
      status: 'done',
      kind: 'section',
    });
  }
  return result;
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function matchesHint(heading: string, hint: string): boolean {
  return normalize(heading).includes(normalize(hint));
}

function toKebab(s: string): string {
  return normalize(s).replace(/\s+/g, '-');
}
