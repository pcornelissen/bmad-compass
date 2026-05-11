import { describe, it, expect } from 'vitest';
import { WORKFLOWS, getWorkflow, workflowsByPhase } from '../../src/server/bmad/workflows.js';

describe('workflow catalog', () => {
  it('contains all 21 BMAD workflows', () => {
    expect(WORKFLOWS.length).toBe(21);
  });

  it('exposes 4 distinct phases', () => {
    const phases = new Set(WORKFLOWS.map(w => w.phase));
    expect([...phases].sort()).toEqual([1, 2, 3, 4]);
  });

  it('has create-prd in phase 2 with agent pm', () => {
    const w = getWorkflow('create-prd');
    expect(w.phase).toBe(2);
    expect(w.agent).toBe('bmad-agent-pm');
    expect(w.command).toBe('bmad-create-prd');
  });

  it('create-architecture requires create-prd', () => {
    expect(getWorkflow('create-architecture').requires).toContain('create-prd');
  });

  it('groups workflows by phase', () => {
    const grouped = workflowsByPhase();
    expect(grouped[1].some(w => w.id === 'brainstorming')).toBe(true);
    expect(grouped[4].some(w => w.id === 'dev-story')).toBe(true);
  });

  it('marks phase 1 workflows as optional', () => {
    expect(getWorkflow('brainstorming').optional).toBe(true);
    expect(getWorkflow('create-prd').optional).toBe(false);
  });

  it('throws on unknown workflow id', () => {
    expect(() => getWorkflow('not-a-workflow')).toThrow();
  });
});
