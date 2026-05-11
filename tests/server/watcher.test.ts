import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { watchProject } from '../../src/server/watcher.js';

describe('watchProject', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-'));
    fs.mkdirSync(path.join(tmp, '_bmad-output/planning-artifacts'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('emits change events for files under _bmad-output', async () => {
    const changes: string[] = [];
    const watcher = await watchProject(tmp, (changePath) => { changes.push(changePath); }, { debounceMs: 50 });
    try {
      fs.writeFileSync(path.join(tmp, '_bmad-output/planning-artifacts/PRD.md'), '# x');
      // Poll up to 3s for the watcher event (CI and parallel test runs can delay FS events).
      const start = Date.now();
      while (changes.length === 0 && Date.now() - start < 3000) {
        await new Promise(r => setTimeout(r, 50));
      }
      expect(changes.length).toBeGreaterThan(0);
    } finally {
      await watcher.close();
    }
  });

  it('debounces rapid changes to a single callback', async () => {
    let calls = 0;
    const watcher = await watchProject(tmp, () => { calls++; }, { debounceMs: 100 });
    try {
      const f = path.join(tmp, '_bmad-output/planning-artifacts/PRD.md');
      fs.writeFileSync(f, 'a');
      fs.writeFileSync(f, 'b');
      fs.writeFileSync(f, 'c');
      await new Promise(r => setTimeout(r, 800));
      expect(calls).toBe(1);
    } finally {
      await watcher.close();
    }
  });
});
