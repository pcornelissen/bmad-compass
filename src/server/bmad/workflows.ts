import type { WorkflowDefinition, Phase } from '../../shared/types.js';

const docs = (slug: string) => `https://docs.bmad-method.org/workflows/${slug}`;

export const WORKFLOWS: WorkflowDefinition[] = [
  // Phase 1 — Analysis (all optional)
  { id: 'brainstorming', command: 'bmad-brainstorming', title: 'Brainstorming', description: 'Guided ideation and concept exploration.', phase: 1, agent: 'bmad-agent-analyst', optional: true, produces: ['planning-artifacts/brainstorming-report.md'], requires: [], docsUrl: docs('brainstorming') },
  { id: 'market-research', command: 'bmad-market-research', title: 'Market Research', description: 'Competitive and market analysis.', phase: 1, agent: 'bmad-agent-analyst', optional: true, produces: ['planning-artifacts/market-research.md'], requires: [], docsUrl: docs('market-research') },
  { id: 'domain-research', command: 'bmad-domain-research', title: 'Domain Research', description: 'Domain-specific investigation.', phase: 1, agent: 'bmad-agent-analyst', optional: true, produces: ['planning-artifacts/domain-research.md'], requires: [], docsUrl: docs('domain-research') },
  { id: 'technical-research', command: 'bmad-technical-research', title: 'Technical Research', description: 'Technology stack evaluation.', phase: 1, agent: 'bmad-agent-analyst', optional: true, produces: ['planning-artifacts/technical-research.md'], requires: [], docsUrl: docs('technical-research') },
  { id: 'product-brief', command: 'bmad-product-brief', title: 'Product Brief', description: 'Foundation document for concept validation.', phase: 1, agent: 'bmad-agent-analyst', optional: true, produces: ['planning-artifacts/brief.md'], requires: [], docsUrl: docs('product-brief') },
  { id: 'prfaq', command: 'bmad-prfaq', title: 'PR FAQ', description: 'Working backwards to stress-test concepts.', phase: 1, agent: 'bmad-agent-analyst', optional: true, produces: ['planning-artifacts/prfaq-*.md'], requires: [], docsUrl: docs('prfaq') },

  // Phase 2 — Planning
  { id: 'create-prd', command: 'bmad-create-prd', title: 'Create PRD', description: 'Generate the Product Requirements Document.', phase: 2, agent: 'bmad-agent-pm', optional: false, produces: ['planning-artifacts/PRD.md'], requires: [], docsUrl: docs('create-prd') },
  { id: 'create-ux-design', command: 'bmad-create-ux-design', title: 'Create UX Design', description: 'Design user interface and flows.', phase: 2, agent: 'bmad-agent-ux-designer', optional: true, produces: ['planning-artifacts/ux-spec.md', 'planning-artifacts/ux-design.md'], requires: ['create-prd'], docsUrl: docs('create-ux-design') },

  // Phase 3 — Solutioning
  { id: 'create-architecture', command: 'bmad-create-architecture', title: 'Create Architecture', description: 'Technical design and system architecture from the PRD.', phase: 3, agent: 'bmad-agent-architect', optional: false, produces: ['planning-artifacts/architecture.md'], requires: ['create-prd'], docsUrl: docs('create-architecture') },
  { id: 'create-epics-and-stories', command: 'bmad-create-epics-and-stories', title: 'Create Epics & Stories', description: 'Break requirements into implementable work units.', phase: 3, agent: 'bmad-agent-pm', optional: false, produces: ['planning-artifacts/epics/'], requires: ['create-architecture'], docsUrl: docs('create-epics-and-stories') },
  { id: 'check-implementation-readiness', command: 'bmad-check-implementation-readiness', title: 'Implementation Readiness', description: 'Validate planning cohesion across documents.', phase: 3, agent: 'bmad-agent-architect', optional: false, produces: [], requires: ['create-epics-and-stories'], docsUrl: docs('check-implementation-readiness') },

  // Phase 4 — Implementation
  { id: 'sprint-planning', command: 'bmad-sprint-planning', title: 'Sprint Planning', description: 'Initialize sprint tracking infrastructure.', phase: 4, agent: 'bmad-agent-pm', optional: false, produces: ['implementation-artifacts/sprint-status.yaml'], requires: ['create-epics-and-stories'], docsUrl: docs('sprint-planning') },
  { id: 'create-story', command: 'bmad-create-story', title: 'Create Story', description: 'Generate individual story file from epic.', phase: 4, agent: 'bmad-agent-pm', optional: false, produces: ['implementation-artifacts/stories/'], requires: ['sprint-planning'], docsUrl: docs('create-story') },
  { id: 'dev-story', command: 'bmad-dev-story', title: 'Dev Story', description: 'Implement a story end-to-end.', phase: 4, agent: 'bmad-agent-dev', optional: false, produces: [], requires: ['create-story'], docsUrl: docs('dev-story') },
  { id: 'code-review', command: 'bmad-code-review', title: 'Code Review', description: 'Quality validation of implementation.', phase: 4, agent: 'bmad-agent-dev', optional: false, produces: [], requires: ['dev-story'], docsUrl: docs('code-review') },
  { id: 'retrospective', command: 'bmad-retrospective', title: 'Retrospective', description: 'Review epic completion and learnings.', phase: 4, agent: 'bmad-agent-pm', optional: true, produces: [], requires: ['dev-story'], docsUrl: docs('retrospective') },

  // Cross-phase utility (not shown on the swimlane map but in catalog)
  { id: 'quick-dev', command: 'bmad-quick-dev', title: 'Quick Dev', description: 'Plan and implement a single focused change.', phase: 4, agent: 'bmad-agent-dev', optional: true, produces: [], requires: [], docsUrl: docs('quick-dev') },
  { id: 'generate-project-context', command: 'bmad-generate-project-context', title: 'Project Context', description: 'Extract conventions from codebase.', phase: 4, agent: 'bmad-agent-dev', optional: true, produces: ['project-context.md'], requires: [], docsUrl: docs('generate-project-context') },
  { id: 'correct-course', command: 'bmad-correct-course', title: 'Correct Course', description: 'Handle scope changes mid-implementation.', phase: 4, agent: 'bmad-agent-pm', optional: true, produces: [], requires: [], docsUrl: docs('correct-course') },
  { id: 'customize', command: 'bmad-customize', title: 'Customize', description: 'Author agent and workflow overrides.', phase: 4, agent: 'bmad-agent-dev', optional: true, produces: [], requires: [], docsUrl: docs('customize') },
  { id: 'help', command: 'bmad-help', title: 'Help', description: 'Intelligent guide for project status and next steps.', phase: 1, agent: 'bmad-agent-analyst', optional: true, produces: [], requires: [], docsUrl: docs('help') },
];

const byId = new Map(WORKFLOWS.map(w => [w.id, w]));

export function getWorkflow(id: string): WorkflowDefinition {
  const w = byId.get(id);
  if (!w) throw new Error(`Unknown workflow: ${id}`);
  return w;
}

export function workflowsByPhase(): Record<Phase, WorkflowDefinition[]> {
  const acc: Record<Phase, WorkflowDefinition[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const w of WORKFLOWS) acc[w.phase].push(w);
  return acc;
}

/** Workflows that appear in the swimlane map (excludes pure utilities). */
export const MAP_WORKFLOW_IDS = new Set([
  'brainstorming', 'market-research', 'domain-research', 'technical-research', 'product-brief', 'prfaq',
  'create-prd', 'create-ux-design',
  'create-architecture', 'create-epics-and-stories', 'check-implementation-readiness',
  'sprint-planning', 'create-story', 'dev-story', 'code-review', 'retrospective',
]);
