import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../../src/client/components/Header.js';

describe('Header', () => {
  it('renders brand and project name', () => {
    render(<Header projectName="my-proj" projectRoot="/x/my-proj" phase={2} wsOnline={true} modules={[]} workflowSource="fallback" />);
    expect(screen.getByText(/BMAD COMPASS/i)).toBeTruthy();
    expect(screen.getByText('/x/my-proj')).toBeTruthy();
    expect(screen.getByText(/Phase 2/i)).toBeTruthy();
  });

  it('shows live status when wsOnline true', () => {
    render(<Header projectName="x" projectRoot="/x" phase={1} wsOnline={true} modules={[]} workflowSource="fallback" />);
    expect(screen.getByText(/live/i)).toBeTruthy();
  });

  it('shows offline status when wsOnline false', () => {
    render(<Header projectName="x" projectRoot="/x" phase={1} wsOnline={false} modules={[]} workflowSource="fallback" />);
    expect(screen.getByText(/offline/i)).toBeTruthy();
  });

  it('shows module names when workflowSource is manifest', () => {
    render(<Header projectName="x" projectRoot="/x" phase={1} wsOnline={true}
      modules={[{ name: 'bmm', version: '6.6.0', source: 'built-in' as const },
                { name: 'cis', version: 'v0.2', source: 'external' as const }]}
      workflowSource="manifest" />);
    expect(screen.getByText(/bmm/)).toBeTruthy();
    expect(screen.getByText(/cis/)).toBeTruthy();
  });

  it('shows no module indicator when workflowSource is fallback', () => {
    render(<Header projectName="x" projectRoot="/x" phase={1} wsOnline={true}
      modules={[]} workflowSource="fallback" />);
    expect(screen.queryByText(/bmm|cis|tea/)).toBeNull();
  });
});
