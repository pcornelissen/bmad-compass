import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { loadProjectHints, mergeHints, HINTS } from '../../src/server/bmad/hints.js';

describe('loadProjectHints', () => {
  beforeEach(() => vol.reset());

  it('returns empty object when no hint file exists', async () => {
    vol.fromJSON({ '/proj/README.md': '# x' }, '/proj');
    const hints = await loadProjectHints('/proj', vol.promises as any);
    expect(hints).toEqual({});
  });

  it('parses a .compass-hints.yaml workflows map', async () => {
    vol.fromJSON({
      '/proj/.compass-hints.yaml':
        'workflows:\n  create-prd:\n    agent: custom-pm\n    sectionHints:\n      - Problem\n      - Custom Bit\n',
    }, '/proj');
    const hints = await loadProjectHints('/proj', vol.promises as any);
    expect(hints['create-prd'].agent).toBe('custom-pm');
    expect(hints['create-prd'].sectionHints).toEqual(['Problem', 'Custom Bit']);
  });

  it('reads the .yml extension as a fallback', async () => {
    vol.fromJSON({
      '/proj/.compass-hints.yml': 'workflows:\n  dev-story:\n    agent: my-dev\n',
    }, '/proj');
    const hints = await loadProjectHints('/proj', vol.promises as any);
    expect(hints['dev-story'].agent).toBe('my-dev');
  });

  it('ignores malformed entries and non-string section hints', async () => {
    vol.fromJSON({
      '/proj/.compass-hints.yaml':
        'workflows:\n  good:\n    sectionHints:\n      - Keep\n      - 42\n  bad: "not an object"\n',
    }, '/proj');
    const hints = await loadProjectHints('/proj', vol.promises as any);
    expect(hints['good'].sectionHints).toEqual(['Keep']);
    expect(hints['bad']).toBeUndefined();
  });

  it('returns empty object on invalid yaml', async () => {
    vol.fromJSON({ '/proj/.compass-hints.yaml': ':::not yaml:::\n  - [' }, '/proj');
    const hints = await loadProjectHints('/proj', vol.promises as any);
    expect(hints).toEqual({});
  });
});

describe('mergeHints', () => {
  it('lets project hints override base section hints per workflow', () => {
    const merged = mergeHints(
      { 'create-prd': { agent: 'base-pm', sectionHints: ['A', 'B'] } },
      { 'create-prd': { sectionHints: ['Custom'] } },
    );
    expect(merged['create-prd'].sectionHints).toEqual(['Custom']);
    expect(merged['create-prd'].agent).toBe('base-pm');
  });

  it('keeps base hints for workflows the project does not mention', () => {
    const merged = mergeHints({ a: { agent: 'x' } }, { b: { agent: 'y' } });
    expect(merged.a.agent).toBe('x');
    expect(merged.b.agent).toBe('y');
  });

  it('does not mutate the base HINTS table', () => {
    const before = JSON.stringify(HINTS['create-prd']);
    mergeHints(HINTS, { 'create-prd': { sectionHints: ['Z'] } });
    expect(JSON.stringify(HINTS['create-prd'])).toBe(before);
  });
});
