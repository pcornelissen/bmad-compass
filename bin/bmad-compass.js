#!/usr/bin/env node
// bin/bmad-compass.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootstrap } from '../dist/server/server/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const opts = { dir: process.cwd(), port: undefined, openBrowser: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') opts.dir = path.resolve(argv[++i]);
    else if (a === '--port') opts.port = Number(argv[++i]);
    else if (a === '--no-open') opts.openBrowser = false;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: bmad-compass [--dir <path>] [--port <n>] [--no-open]');
      process.exit(0);
    }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
bootstrap({
  projectRoot: opts.dir,
  port: opts.port,
  openBrowser: opts.openBrowser,
  staticDir: path.join(__dirname, '..', 'dist', 'client'),
}).then(({ url }) => {
  console.log(`Opened ${url}`);
}).catch((err) => {
  console.error('Failed to start bmad-compass:', err);
  process.exit(1);
});
