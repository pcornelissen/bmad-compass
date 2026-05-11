import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../../src/server/bmad/frontmatter.js';

describe('parseFrontmatter', () => {
  it('returns empty meta when no frontmatter present', () => {
    const result = parseFrontmatter('# Title\n\nBody only.');
    expect(result.meta).toEqual({});
    expect(result.body).toBe('# Title\n\nBody only.');
  });

  it('extracts workflow and agent from valid frontmatter', () => {
    const input = `---\nworkflow: create-architecture\nagent: bmad-agent-architect\nphase: 3\n---\n# Architecture`;
    const result = parseFrontmatter(input);
    expect(result.meta.workflow).toBe('create-architecture');
    expect(result.meta.agent).toBe('bmad-agent-architect');
    expect(result.meta.phase).toBe(3);
    expect(result.body.trim()).toBe('# Architecture');
  });

  it('returns empty meta on malformed YAML (silent fail)', () => {
    const input = `---\nworkflow: [\n---\n# Body`;
    const result = parseFrontmatter(input);
    expect(result.meta).toEqual({});
    // Body falls back to original content
    expect(result.body).toContain('# Body');
  });
});
