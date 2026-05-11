import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArtifactList } from '../../src/client/components/ArtifactList.js';
import type { Artifact } from '../../src/shared/types.js';

const artifacts: Artifact[] = [
  { path: '_bmad-output/planning-artifacts/PRD.md', displayName: 'PRD', workflowId: 'create-prd', agent: null, mtime: Date.now() - 3600_000, sizeBytes: 12000 },
  { path: '_bmad-output/planning-artifacts/brief.md', displayName: 'Product Brief', workflowId: 'product-brief', agent: null, mtime: Date.now() - 86_400_000, sizeBytes: 6000 },
];

describe('ArtifactList', () => {
  it('renders artifact rows', () => {
    render(<ArtifactList artifacts={artifacts} onOpen={() => {}} />);
    expect(screen.getByText('PRD')).toBeTruthy();
    expect(screen.getByText('Product Brief')).toBeTruthy();
  });

  it('shows empty state when none', () => {
    render(<ArtifactList artifacts={[]} onOpen={() => {}} />);
    expect(screen.getByText(/no artifacts/i)).toBeTruthy();
  });

  it('calls onOpen with path when row clicked', async () => {
    const onOpen = vi.fn();
    render(<ArtifactList artifacts={artifacts} onOpen={onOpen} />);
    await userEvent.click(screen.getByText('PRD'));
    expect(onOpen).toHaveBeenCalledWith(artifacts[0].path);
  });
});
