import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';
import request from 'supertest';
import { createApi } from '../../src/server/api.js';

describe('REST API', () => {
  beforeEach(() => vol.reset());

  it('GET /api/state returns DashboardState', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# PRD',
    }, '/proj');
    const app = createApi({ projectRoot: '/proj', fs: vol.promises as any });
    const res = await request(app).get('/api/state');
    expect(res.status).toBe(200);
    expect(res.body.hasBmad).toBe(true);
    expect(res.body.projectName).toBe('proj');
  });

  it('GET /api/artifact returns markdown body for valid path', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# Hello',
    }, '/proj');
    const app = createApi({ projectRoot: '/proj', fs: vol.promises as any });
    const res = await request(app).get('/api/artifact').query({ path: '_bmad-output/planning-artifacts/PRD.md' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('# Hello');
  });

  it('GET /api/artifact rejects path traversal', async () => {
    vol.fromJSON({
      '/proj/_bmad-output/planning-artifacts/PRD.md': '# x',
      '/etc/passwd': 'root:x',
    });
    const app = createApi({ projectRoot: '/proj', fs: vol.promises as any });
    const res = await request(app).get('/api/artifact').query({ path: '../../../etc/passwd' });
    expect(res.status).toBe(400);
  });

  it('GET /api/artifact returns 404 for missing file', async () => {
    vol.fromJSON({ '/proj/anything.md': 'x' }, '/proj');
    const app = createApi({ projectRoot: '/proj', fs: vol.promises as any });
    const res = await request(app).get('/api/artifact').query({ path: '_bmad-output/nope.md' });
    expect(res.status).toBe(404);
  });
});
