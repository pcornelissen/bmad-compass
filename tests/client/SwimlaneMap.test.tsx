import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SwimlaneMap } from '../../src/client/components/SwimlaneMap.js';
import type { Workflow } from '../../src/shared/types.js';

const wf = (id: string, phase: 1|2|3|4, status: 'done'|'pending'|'in-progress'): Workflow => ({
  definition: { id, command: `bmad-${id}`, title: id, description: '', phase, agent: 'a', optional: false, produces: [], requires: [], docsUrl: '' },
  status, artifacts: [],
});

describe('SwimlaneMap', () => {
  const workflows = [
    wf('create-prd', 2, 'done'),
    wf('create-architecture', 3, 'in-progress'),
    wf('sprint-planning', 4, 'pending'),
  ];

  it('renders 4 phase columns', () => {
    render(<SwimlaneMap workflows={workflows} selectedId={null} onSelect={() => {}} currentPhase={3} />);
    expect(screen.getByText(/Phase 1/)).toBeTruthy();
    expect(screen.getByText(/Phase 2/)).toBeTruthy();
    expect(screen.getByText(/Phase 3/)).toBeTruthy();
    expect(screen.getByText(/Phase 4/)).toBeTruthy();
  });

  it('renders each workflow in its phase column', () => {
    render(<SwimlaneMap workflows={workflows} selectedId={null} onSelect={() => {}} currentPhase={3} />);
    expect(screen.getByText('create-prd')).toBeTruthy();
    expect(screen.getByText('create-architecture')).toBeTruthy();
  });

  it('calls onSelect when a step is clicked', async () => {
    const onSelect = vi.fn();
    render(<SwimlaneMap workflows={workflows} selectedId={null} onSelect={onSelect} currentPhase={3} />);
    await userEvent.click(screen.getByText('create-architecture'));
    expect(onSelect).toHaveBeenCalledWith('create-architecture');
  });

  it('renders done counter when workflow has done substeps', () => {
    const withSubsteps = [
      {
        ...wf('create-prd', 2, 'in-progress'),
        subSteps: [
          { id: 'a', label: 'Goals', status: 'done' as const, kind: 'section' as const },
          { id: 'b', label: 'Personas', status: 'done' as const, kind: 'section' as const },
          { id: 'c', label: 'Metrics', status: 'hinted' as const, kind: 'section' as const },
        ],
      },
    ];
    render(<SwimlaneMap workflows={withSubsteps} selectedId={null} onSelect={() => {}} currentPhase={2} />);
    expect(screen.getByText(/\(2\)/)).toBeTruthy();
  });

  it('renders no counter when only hinted substeps exist', () => {
    const onlyHinted = [
      {
        ...wf('create-prd', 2, 'pending'),
        subSteps: [
          { id: 'a', label: 'Goals', status: 'hinted' as const, kind: 'section' as const },
        ],
      },
    ];
    render(<SwimlaneMap workflows={onlyHinted} selectedId={null} onSelect={() => {}} currentPhase={2} />);
    expect(screen.queryByText(/\(\d+\)/)).toBeNull();
  });
});
