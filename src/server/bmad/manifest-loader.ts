import * as nodeFs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { parse } from 'csv-parse/sync';
import type { ModuleInfo, Phase, WorkflowDefinition } from '../../shared/types.js';

type FsLike = typeof nodeFs.promises;

interface ManifestYaml {
  modules?: Array<{ name?: unknown; version?: unknown; source?: unknown }>;
}

interface CsvRow {
  module?: string;
  skill?: string;
  'display-name'?: string;
  description?: string;
  phase?: string;
  after?: string;
  required?: string;
  'output-location'?: string;
}

export async function loadWorkflowsFromManifest(
  projectRoot: string,
  fs: FsLike,
): Promise<{ workflows: WorkflowDefinition[]; modules: ModuleInfo[] } | null> {
  const manifestPath = path.join(projectRoot, '_bmad/_config/manifest.yaml');
  let manifestRaw: string;
  try { manifestRaw = await fs.readFile(manifestPath, 'utf8'); }
  catch { return null; }

  let manifest: ManifestYaml;
  try { manifest = yaml.load(manifestRaw) as ManifestYaml; }
  catch { return null; }
  if (!manifest || typeof manifest !== 'object') return null;

  const modules: ModuleInfo[] = (manifest.modules ?? []).flatMap(m => {
    const name = String(m?.name ?? '').trim();
    if (!name) return [];
    return [{
      name,
      version: String(m?.version ?? ''),
      source: m?.source === 'external' ? 'external' as const : 'built-in' as const,
    }];
  });

  const workflows: WorkflowDefinition[] = [];
  for (const mod of modules) {
    const csvPath = path.join(projectRoot, `_bmad/${mod.name}/module-help.csv`);
    let csvRaw: string;
    try { csvRaw = await fs.readFile(csvPath, 'utf8'); }
    catch { continue; }

    let rows: CsvRow[];
    try {
      rows = parse(csvRaw, { columns: true, skip_empty_lines: true, relax_column_count: true }) as CsvRow[];
    } catch { continue; }

    for (const row of rows) {
      const skill = (row.skill ?? '').trim();
      if (!skill.startsWith('bmad-') || skill === 'bmad-help') continue;

      const phaseRaw = (row.phase ?? '').trim().toLowerCase();
      const phase = phaseToNumber(phaseRaw);
      if (phase === null) continue;

      const id = skill.replace(/^bmad-/, '');
      const requires = parseAfter(row.after);
      const isRequired = (row.required ?? '').trim().toLowerCase() === 'true';

      // Dedupe by skill — BMAD's CSV lists multiple rows when a workflow has internal
      // sub-actions (e.g. create-story has create/validate). The user invokes the
      // skill once; keep one entry, preferring the required variant.
      const existing = workflows.find(w => w.id === id);
      if (existing) {
        if (isRequired && existing.optional) {
          // Upgrade the existing entry with required info.
          existing.optional = false;
          existing.title = (row['display-name'] ?? existing.title).trim();
          if (row.description) existing.description = row.description.trim();
          if (requires.length > 0) existing.requires = requires;
        }
        continue;
      }

      workflows.push({
        id,
        command: skill,
        title: (row['display-name'] ?? id).trim(),
        description: (row.description ?? '').trim(),
        phase,
        agent: '',
        optional: !isRequired,
        produces: [],
        requires,
        docsUrl: `https://docs.bmad-method.org/workflows/${id}`,
      });
    }
  }

  return { workflows, modules };
}

function phaseToNumber(value: string): Phase | null {
  if (value.startsWith('1-')) return 1;
  if (value.startsWith('2-')) return 2;
  if (value.startsWith('3-')) return 3;
  if (value.startsWith('4-')) return 4;
  return null;
}

function parseAfter(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,|]/)
    .map(s => s.trim().replace(/^bmad-/, '').split(':')[0])
    .filter(s => s.length > 0);
}
