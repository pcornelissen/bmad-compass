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

export function getHint(workflowId: string): WorkflowHint | undefined {
  return HINTS[workflowId];
}

export function applyHintsToDefinition<T extends { id: string; agent: string; docsUrl: string }>(def: T): T {
  const hint = HINTS[def.id];
  if (!hint) return def;
  if (!def.agent && hint.agent) def.agent = hint.agent;
  if (!def.docsUrl || def.docsUrl.endsWith(`/workflows/${def.id}`)) {
    if (hint.docsUrl) def.docsUrl = hint.docsUrl;
  }
  return def;
}
