import * as nodeFs from 'node:fs';
import path from 'node:path';
import type { Artifact } from '../../shared/types.js';
import { WORKFLOWS } from './workflows.js';
import { parseFrontmatter } from './frontmatter.js';

type FsLike = typeof nodeFs.promises;

export interface ScanOptions {
  fs?: FsLike;
}

export interface ScanResult {
  hasBmad: boolean;
  artifacts: Artifact[];
}

const OUTPUT_DIR = '_bmad-output';
const BMAD_DIR = '_bmad';

const PATH_TO_WORKFLOW: Array<{ pattern: RegExp; workflowId: string; displayName: (m: RegExpMatchArray) => string }> = [
  { pattern: /^planning-artifacts\/brainstorming-report\.md$/i, workflowId: 'brainstorming', displayName: () => 'Brainstorming Report' },
  { pattern: /^planning-artifacts\/market-research\.md$/i, workflowId: 'market-research', displayName: () => 'Market Research' },
  { pattern: /^planning-artifacts\/domain-research\.md$/i, workflowId: 'domain-research', displayName: () => 'Domain Research' },
  { pattern: /^planning-artifacts\/technical-research\.md$/i, workflowId: 'technical-research', displayName: () => 'Technical Research' },
  { pattern: /^planning-artifacts\/brief\.md$/i, workflowId: 'product-brief', displayName: () => 'Product Brief' },
  { pattern: /^planning-artifacts\/prfaq-.*\.md$/i, workflowId: 'prfaq', displayName: () => 'PR FAQ' },
  { pattern: /^planning-artifacts\/PRD\.md$/i, workflowId: 'create-prd', displayName: () => 'PRD' },
  { pattern: /^planning-artifacts\/prd-validation.*\.md$/i, workflowId: 'validate-prd', displayName: () => 'PRD Validation' },
  { pattern: /^planning-artifacts\/ux[-_].*\.md$/i, workflowId: 'create-ux-design', displayName: (m) => `UX: ${path.basename(m[0], '.md').replace(/^ux[-_]/, '')}` },
  { pattern: /^planning-artifacts\/architecture\.md$/i, workflowId: 'create-architecture', displayName: () => 'Architecture' },
  { pattern: /^planning-artifacts\/epics\/.+\.md$/i, workflowId: 'create-epics-and-stories', displayName: (m) => `Epic: ${path.basename(m[0], '.md')}` },
  { pattern: /^implementation-artifacts\/sprint-status\.yaml$/i, workflowId: 'sprint-planning', displayName: () => 'Sprint Status' },
  { pattern: /^implementation-artifacts\/stories\/.+\.md$/i, workflowId: 'create-story', displayName: (m) => `Story: ${path.basename(m[0], '.md')}` },
  { pattern: /^project-context\.md$/i, workflowId: 'generate-project-context', displayName: () => 'Project Context' },
];

const workflowAgentLookup = new Map(WORKFLOWS.map(w => [w.id, w.agent]));

export async function scanArtifacts(projectRoot: string, opts: ScanOptions = {}): Promise<ScanResult> {
  const fs = opts.fs ?? nodeFs.promises;
  const outputDir = path.join(projectRoot, OUTPUT_DIR);
  const bmadDir = path.join(projectRoot, BMAD_DIR);

  let hasBmad = false;
  try {
    await fs.access(bmadDir);
    hasBmad = true;
  } catch { /* may still be true if output exists */ }
  try {
    await fs.access(outputDir);
    hasBmad = true;
  } catch {
    return { hasBmad, artifacts: [] };
  }

  const artifacts: Artifact[] = [];
  for await (const file of walk(outputDir, fs)) {
    const rel = path.relative(projectRoot, file).split(path.sep).join('/');
    const relUnderOutput = rel.replace(/^_bmad-output\//, '');
    const match = matchWorkflow(relUnderOutput);
    const stat = await fs.stat(file);

    let meta: { workflow?: string; agent?: string } = {};
    if (file.endsWith('.md')) {
      try {
        const content = await fs.readFile(file, 'utf8');
        meta = parseFrontmatter(content).meta;
      } catch { /* ignore unreadable */ }
    }

    const workflowId = meta.workflow ?? match?.workflowId ?? null;
    const agent = meta.agent ?? (workflowId ? workflowAgentLookup.get(workflowId) ?? null : null);

    artifacts.push({
      path: rel,
      displayName: match ? match.displayName : path.basename(rel),
      workflowId,
      agent,
      mtime: stat.mtimeMs,
      sizeBytes: stat.size,
    });
  }

  artifacts.sort((a, b) => b.mtime - a.mtime);
  return { hasBmad, artifacts };
}

function matchWorkflow(relPath: string): { workflowId: string; displayName: string } | null {
  for (const entry of PATH_TO_WORKFLOW) {
    const m = relPath.match(entry.pattern);
    if (m) return { workflowId: entry.workflowId, displayName: entry.displayName(m) };
  }
  return null;
}

async function* walk(dir: string, fs: FsLike): AsyncGenerator<string> {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch { return; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full, fs);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}
