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

  return phase4NextStep(input);
}

function phase4NextStep(input: NextStepInput): NextStep | null {
  const allStories = input.stories.filter(s => s.kind === 'story');
  const allEpics = input.stories.filter(s => s.kind === 'epic');

  // No story-level data at all → recommend create-story to kick off the sprint.
  if (allStories.length === 0) {
    return recommend('create-story', 'Sprint planned — create the first story file.');
  }

  // Pick the most-progressed story that still needs work. Priority: review > in-progress > ready-for-dev > backlog.
  const inReview = allStories.find(s => s.status === 'review');
  if (inReview) {
    return recommend('code-review', `Story ${inReview.id} is ready for review.`);
  }

  const inProgress = allStories.find(s => s.status === 'in-progress' || s.status === 'ready-for-dev');
  if (inProgress) {
    return recommend('dev-story', `Continue with ${inProgress.id} (${inProgress.status}).`);
  }

  const nextBacklog = pickNextBacklog(allStories);
  if (nextBacklog) {
    const epic = nextBacklog.epicId;
    const epicEntry = allEpics.find(e => e.id === epic);
    const epicStatus = epicEntry?.status ?? 'unknown';
    if (epicStatus === 'backlog') {
      return recommend('create-story', `Start ${epic} with story ${nextBacklog.id}.`);
    }
    return recommend('create-story', `Next story to start: ${nextBacklog.id}.`);
  }

  // All stories done. Check retrospectives, then next epic.
  const pendingRetro = input.stories.find(s => s.kind === 'retrospective' && s.status !== 'done' && s.status !== 'optional');
  if (pendingRetro) {
    return recommend('retrospective', `Reflect on ${pendingRetro.epicId} before moving on.`);
  }

  // All actionable stories done and retros handled — surface an optional retrospective if any exist.
  const optionalRetro = input.stories.find(s => s.kind === 'retrospective' && s.status === 'optional');
  if (optionalRetro) {
    return recommend('retrospective', `Optional: run the retrospective for ${optionalRetro.epicId}.`);
  }

  return null;
}

/** Sort stories by epic number then story number, return first backlog one. */
function pickNextBacklog(stories: SprintStory[]): SprintStory | undefined {
  const backlog = stories.filter(s => s.status === 'backlog');
  if (backlog.length === 0) return undefined;
  return [...backlog].sort((a, b) => storySortKey(a.id) - storySortKey(b.id))[0];
}

function storySortKey(id: string): number {
  const m = id.match(/^(\d+)-(\d+)/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return parseInt(m[1], 10) * 1000 + parseInt(m[2], 10);
}

/** Highest phase reached given known artifacts. */
export function currentPhase(artifacts: Artifact[]): 1 | 2 | 3 | 4 {
  if (has('sprint-planning', artifacts) || has('create-story', artifacts)) return 4;
  if (has('create-architecture', artifacts) || has('create-epics-and-stories', artifacts)) return 3;
  if (has('create-prd', artifacts)) return 2;
  return 1;
}
