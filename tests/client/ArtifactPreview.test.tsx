import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArtifactPreview } from '../../src/client/components/ArtifactPreview.js';

describe('ArtifactPreview', () => {
  it('returns null when no path', () => {
    const { container } = render(<ArtifactPreview path={null} content={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders filename and rendered markdown', () => {
    render(<ArtifactPreview path="_bmad-output/planning-artifacts/PRD.md" content="# Hello world" onClose={() => {}} />);
    expect(screen.getByText('PRD.md')).toBeTruthy();
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('calls onClose on close click', async () => {
    const onClose = vi.fn();
    render(<ArtifactPreview path="x.md" content="x" onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
