import express, { type Express } from 'express';
import * as nodeFs from 'node:fs';
import path from 'node:path';
import { buildState } from './bmad/state-builder.js';

type FsLike = typeof nodeFs.promises;

export interface ApiOptions {
  projectRoot: string;
  fs?: FsLike;
}

export function createApi(opts: ApiOptions): Express {
  const fs = opts.fs ?? nodeFs.promises;
  const app = express();

  app.get('/api/state', async (_req, res, next) => {
    try {
      const state = await buildState(opts.projectRoot, { fs });
      return res.json(state);
    } catch (err) {
      return next(err);
    }
  });

  app.get('/api/artifact', async (req, res) => {
    const rel = String(req.query.path ?? '');
    if (!rel) return res.status(400).json({ error: 'missing path' });

    const resolved = path.resolve(opts.projectRoot, rel);
    const rootResolved = path.resolve(opts.projectRoot);
    if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
      return res.status(400).json({ error: 'path traversal denied' });
    }

    try {
      const content = await fs.readFile(resolved, 'utf8');
      return res.type('text/plain').send(content);
    } catch {
      return res.status(404).json({ error: 'not found' });
    }
  });

  return app;
}
