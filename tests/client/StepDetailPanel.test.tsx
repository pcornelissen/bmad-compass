import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepDetailPanel } from '../../src/client/components/StepDetailPanel.js';
import type { Workflow } from '../../src/shared/types.js';

const workflow: Workflow = {
  definition: {
    id: 'create-architecture',
    command: 'bmad-create-architecture',
    title: 'Create Architecture',
    description: 'Technical design.',
    phase: 3, agent: 'bmad-agent-architect', optional: false,
    produces: ['planning-artifacts/architecture.md'],
    requires: ['create-prd'],
    docsUrl: 'https://docs.bmad-method.org/workflows/create-architecture',
  },
  status: 'in-progress', artifacts: [],
};

describe('StepDetailPanel', () => {
  it('renders workflow title, description, command, agent, doc link', () => {
    render(<StepDetailPanel workflow={workflow} onClose={() => {}} />);
    expect(screen.getByText('Create Architecture')).toBeTruthy();
    expect(screen.getByText(/Technical design/)).toBeTruthy();
    expect(screen.getByText('bmad-create-architecture')).toBeTruthy();
    expect(screen.getByText(/bmad-agent-architect/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /docs/i })).toHaveProperty('href');
  });

  it('lists requirements and produces', () => {
    render(<StepDetailPanel workflow={workflow} onClose={() => {}} />);
    expect(screen.getByText(/create-prd/)).toBeTruthy();
    expect(screen.getByText(/architecture\.md/)).toBeTruthy();
  });

  it('calls onClose when close clicked', async () => {
    const onClose = vi.fn();
    render(<StepDetailPanel workflow={workflow} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /✕|close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders no progress block when subSteps undefined', () => {
    render(<StepDetailPanel workflow={workflow} onClose={() => {}} />);
    expect(screen.queryByText(/FORTSCHRITT/i)).toBeNull();
    expect(screen.queryByText(/VIELLEICHT/i)).toBeNull();
  });

  it('renders only done block when subSteps has done items only', () => {
    const wf = {
      ...workflow,
      subSteps: [
        { id: 'a', label: 'Problem Statement', status: 'done' as const, kind: 'section' as const },
        { id: 'b', label: 'Goals', status: 'done' as const, kind: 'section' as const },
      ],
    };
    render(<StepDetailPanel workflow={wf} onClose={() => {}} />);
    expect(screen.getByText(/FORTSCHRITT/i)).toBeTruthy();
    expect(screen.getByText('Problem Statement')).toBeTruthy();
    expect(screen.queryByText(/VIELLEICHT ALS NÄCHSTES/i)).toBeNull();
  });

  it('renders both done and hinted when both present', () => {
    const wf = {
      ...workflow,
      subSteps: [
        { id: 'a', label: 'Goals', status: 'done' as const, kind: 'section' as const },
        { id: 'b', label: 'User Personas', status: 'hinted' as const, kind: 'section' as const },
      ],
    };
    render(<StepDetailPanel workflow={wf} onClose={() => {}} />);
    expect(screen.getByText(/FORTSCHRITT/i)).toBeTruthy();
    expect(screen.getByText('Goals')).toBeTruthy();
    expect(screen.getByText(/VIELLEICHT ALS NÄCHSTES/i)).toBeTruthy();
    expect(screen.getByText('User Personas')).toBeTruthy();
  });
});
