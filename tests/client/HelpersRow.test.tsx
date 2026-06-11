import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpersRow } from '../../src/client/components/HelpersRow.js';
import type { Workflow, WorkflowStatus } from '../../src/shared/types.js';

const helper = (id: string, status: WorkflowStatus): Workflow => ({
  definition: { id, command: `bmad-${id}`, title: id, description: '', phase: 4, agent: 'a', optional: true, produces: [], requires: [], docsUrl: '', cross: true },
  status, artifacts: [],
});

const swimlane = (id: string, status: WorkflowStatus): Workflow => ({
  definition: { id, command: `bmad-${id}`, title: id, description: '', phase: 4, agent: 'a', optional: false, produces: [], requires: [], docsUrl: '' },
  status, artifacts: [],
});

describe('HelpersRow', () => {
  it('renders nothing when there are no cross helpers', () => {
    const { container } = render(<HelpersRow workflows={[swimlane('dev-story', 'pending')]} selectedId={null} onSelect={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders only cross helpers', () => {
    const workflows = [helper('retrospective', 'done'), swimlane('dev-story', 'pending')];
    render(<HelpersRow workflows={workflows} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('retrospective')).toBeTruthy();
    expect(screen.queryByText('dev-story')).toBeNull();
  });

  it('shows a done dot for a completed retrospective helper', () => {
    render(<HelpersRow workflows={[helper('retrospective', 'done')]} selectedId={null} onSelect={() => {}} />);
    const dot = document.querySelector('span[style*="status-done"]') as HTMLElement | null;
    expect(dot).not.toBeNull();
  });

  it('shows a pulsing orange dot for an in-progress helper', () => {
    render(<HelpersRow workflows={[helper('retrospective', 'in-progress')]} selectedId={null} onSelect={() => {}} />);
    const dot = document.querySelector('span[style*="pulse"]') as HTMLElement | null;
    expect(dot).not.toBeNull();
  });

  it('calls onSelect when a helper is clicked', async () => {
    const onSelect = vi.fn();
    render(<HelpersRow workflows={[helper('retrospective', 'pending')]} selectedId={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('retrospective'));
    expect(onSelect).toHaveBeenCalledWith('retrospective');
  });
});
