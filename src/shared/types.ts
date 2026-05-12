export type Phase = 1 | 2 | 3 | 4;
export type WorkflowStatus = 'done' | 'in-progress' | 'pending' | 'blocked' | 'not-applicable';

export interface WorkflowDefinition {
  id: string;                  // e.g. "create-architecture"
  command: string;             // e.g. "bmad-create-architecture"
  title: string;               // human readable
  description: string;
  phase: Phase;
  agent: string;               // e.g. "bmad-agent-architect"
  optional: boolean;
  produces: string[];          // relative paths or glob-ish patterns under _bmad-output/
  requires: string[];          // workflow ids that must be done first
  docsUrl: string;
  cross?: boolean;             // true = cross-phase helper (anytime), shown in Helpers row instead of swimlane
}

export interface Workflow {
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  artifacts: string[];         // matched artifact paths (relative)
  subSteps?: SubStep[];
}

export interface Artifact {
  path: string;                // relative to projectRoot
  displayName: string;         // human readable (e.g. "PRD", "UX Spec")
  workflowId: string | null;   // resolved via path or frontmatter
  agent: string | null;        // from frontmatter or workflow default
  mtime: number;               // ms epoch
  sizeBytes: number;
}

export interface NextStep {
  workflowId: string;
  command: string;
  agent: string;
  title: string;
  reason: string;
}

export interface SprintStory {
  id: string;
  title: string;
  epicId: string;
  status: 'backlog' | 'in-progress' | 'done' | 'blocked';
}

export interface DashboardState {
  projectRoot: string;
  projectName: string;
  hasBmad: boolean;            // false when no _bmad/ or _bmad-output/ dir
  currentPhase: Phase;
  workflows: Workflow[];
  artifacts: Artifact[];
  nextStep: NextStep | null;
  stories: SprintStory[];      // empty if no sprint-status.yaml
  modules: ModuleInfo[];
  workflowSource: 'manifest' | 'fallback';
  generatedAt: number;
}

export type WsMessage =
  | { type: 'state'; payload: DashboardState }
  | { type: 'hello'; payload: { serverVersion: string } };

export interface SubStep {
  id: string;
  label: string;
  status: 'done' | 'hinted';
  kind: 'section' | 'file';
}

export interface ModuleInfo {
  name: string;
  version: string;
  source: 'built-in' | 'external';
}
