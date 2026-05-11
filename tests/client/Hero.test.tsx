import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero } from '../../src/client/components/Hero.js';

describe('Hero', () => {
  const step = {
    workflowId: 'create-architecture',
    command: 'bmad-create-architecture',
    agent: 'bmad-agent-architect',
    title: 'Create Architecture',
    reason: 'PRD ready.',
  };

  it('renders title, reason, command, agent', () => {
    render(<Hero nextStep={step} />);
    expect(screen.getByText('Create Architecture')).toBeTruthy();
    expect(screen.getByText(/PRD ready/i)).toBeTruthy();
    expect(screen.getByText('bmad-create-architecture')).toBeTruthy();
    expect(screen.getByText(/bmad-agent-architect/)).toBeTruthy();
  });

  it('copies command to clipboard on copy click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);
    render(<Hero nextStep={step} />);
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith('bmad-create-architecture');
  });

  it('renders fallback when no next step', () => {
    render(<Hero nextStep={null} />);
    expect(screen.getByText(/no next step/i)).toBeTruthy();
  });
});
