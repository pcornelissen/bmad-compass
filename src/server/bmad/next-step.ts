import type { Artifact, NextStep, SprintStory } from '../../shared/types.js';
import { getWorkflow } from './workflows.js';

export interface NextStepInput {
  hasBmad: boolean;
  artifacts: Artifact[];
  stories: SprintStory[];
}

function has(workflowId: string, artifacts: Artifact[]): boolean {
  return artifacts.some(a => a.workflowId === workflowId);
}

function recommend(workflowId: string, reason: string): NextStep {
  const w = getWorkflow(workflowId);
  return { workflowId, command: w.command, agent: w.agent, title: w.title, reason };
}

export function computeNextStep(input: NextStepInput): NextStep | null {
  if (!input.hasBmad) {
    return recommend('help', 'BMAD seems uninitialized. Start with help to set up your project.');
  }

  if (!has('create-prd', input.artifacts)) {
    return recommend('create-prd', 'No PRD yet — define the product requirements first.');
  }

  if (!has('create-architecture', input.artifacts)) {
    return recommend('create-architecture', 'PRD ready — now design the technical architecture.');
  }

  if (!has('create-epics-and-stories', input.artifacts)) {
    return recommend('create-epics-and-stories', 'Architecture done — break the plan into epics and stories.');
  }

  if (!has('sprint-planning', input.artifacts)) {
    return recommend('sprint-planning', 'Epics in place — initialize sprint tracking.');
  }

  const pending = input.stories.filter(s => s.status === 'backlog' || s.status === 'in-progress');
  if (pending.length > 0) {
    return recommend('dev-story', `${pending.length} story/stories remaining — pick one up.`);
  }

  if (input.stories.length > 0 && input.stories.every(s => s.status === 'done')) {
    return recommend('retrospective', 'All stories done — run the retrospective.');
  }

  return null;
}

/** Highest phase reached given known artifacts. */
export function currentPhase(artifacts: Artifact[]): 1 | 2 | 3 | 4 {
  if (has('sprint-planning', artifacts) || has('create-story', artifacts)) return 4;
  if (has('create-architecture', artifacts) || has('create-epics-and-stories', artifacts)) return 3;
  if (has('create-prd', artifacts)) return 2;
  return 1;
}
