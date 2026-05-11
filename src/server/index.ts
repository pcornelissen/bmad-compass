import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import open from 'open';
import { createApi } from './api.js';
import { attachWebSocket } from './ws.js';
import { watchProject } from './watcher.js';
import { buildState } from './bmad/state-builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface BootstrapOptions {
  projectRoot: string;
  port?: number;
  openBrowser?: boolean;
  staticDir?: string;
}

export async function bootstrap(opts: BootstrapOptions): Promise<{ url: string; close: () => Promise<void> }> {
  const port = opts.port ?? 0; // 0 = OS picks free port
  const staticDir = opts.staticDir ?? path.join(__dirname, '../client');

  const app = createApi({ projectRoot: opts.projectRoot });
  app.use(express.static(staticDir));
  // SPA fallback — anything non-API serves index.html
  app.get(/^(?!\/api|\/ws).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });

  const server = http.createServer(app);
  const ws = attachWebSocket(server, () => buildState(opts.projectRoot));

  const watcher = await watchProject(opts.projectRoot, async () => {
    await ws.broadcastState();
  });

  await new Promise<void>(resolve => server.listen(port, () => resolve()));
  const actualPort = (server.address() as { port: number }).port;
  const url = `http://localhost:${actualPort}`;
  console.log(`bmad-compass listening on ${url}`);
  console.log(`watching ${opts.projectRoot}`);

  if (opts.openBrowser !== false) {
    try { await open(url); } catch { /* ignore */ }
  }

  return {
    url,
    close: async () => {
      await watcher.close();
      ws.close();
      await new Promise<void>(r => server.close(() => r()));
    },
  };
}
