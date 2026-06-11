import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DependencyGraph } from '../../src/client/components/DependencyGraph.js';
import type { Workflow, WorkflowStatus, Phase } from '../../src/shared/types.js';

const wf = (id: string, phase: Phase, requires: string[], status: WorkflowStatus = 'pending', cross = false): Workflow => ({
  definition: { id, command: `bmad-${id}`, title: id, description: '', phase, agent: 'a', optional: false, produces: [], requires, docsUrl: '', cross },
  status, artifacts: [],
});

describe('DependencyGraph', () => {
  const workflows = [
    wf('create-prd', 2, [], 'done'),
    wf('create-architecture', 3, ['create-prd'], 'in-progress'),
    wf('create-epics-and-stories', 3, ['create-architecture']),
    wf('helper', 4, [], 'pending', true),
  ];

  it('renders an svg', () => {
    const { container } = render(<DependencyGraph workflows={workflows} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders one node per non-cross workflow', () => {
    const { container } = render(<DependencyGraph workflows={workflows} />);
    const nodes = container.querySelectorAll('[data-testid="dep-node"]');
    expect(nodes.length).toBe(3);
    const ids = Array.from(nodes).map(n => n.getAttribute('data-id'));
    expect(ids).not.toContain('helper');
  });

  it('draws an edge for each satisfied requires relationship', () => {
    const { container } = render(<DependencyGraph workflows={workflows} />);
    const edges = container.querySelectorAll('[data-testid="dep-edge"]');
    const pairs = Array.from(edges).map(e => `${e.getAttribute('data-from')}->${e.getAttribute('data-to')}`);
    expect(pairs).toContain('create-prd->create-architecture');
    expect(pairs).toContain('create-architecture->create-epics-and-stories');
    expect(edges.length).toBe(2);
  });

  it('omits edges whose required workflow is absent', () => {
    const orphan = [wf('dev-story', 4, ['create-story'])];
    const { container } = render(<DependencyGraph workflows={orphan} />);
    expect(container.querySelectorAll('[data-testid="dep-edge"]').length).toBe(0);
  });

  it('returns null when there are no graph workflows', () => {
    const { container } = render(<DependencyGraph workflows={[wf('helper', 4, [], 'pending', true)]} />);
    expect(container.firstChild).toBeNull();
  });
});
