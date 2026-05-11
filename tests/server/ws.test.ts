// @vitest-environment node
import { describe, it, expect } from 'vitest';
import http from 'node:http';
import WebSocket from 'ws';
import { attachWebSocket } from '../../src/server/ws.js';
import type { DashboardState } from '../../src/shared/types.js';

const fakeState = (n = 1): DashboardState => ({
  projectRoot: '/x', projectName: 'x', hasBmad: true, currentPhase: 1,
  workflows: [], artifacts: [], nextStep: null, stories: [], generatedAt: n,
});

describe('WebSocket server', () => {
  it('sends hello and current state on client connection', async () => {
    const server = http.createServer();
    const ws = attachWebSocket(server, () => fakeState(7));
    await new Promise<void>(r => server.listen(0, r));
    const port = (server.address() as { port: number }).port;

    const client = new WebSocket(`ws://localhost:${port}/ws`);
    const messages: unknown[] = [];
    await new Promise<void>((resolve, reject) => {
      client.on('message', (m) => { messages.push(JSON.parse(m.toString())); if (messages.length === 2) resolve(); });
      client.on('error', reject);
    });

    expect((messages[0] as any).type).toBe('hello');
    expect((messages[1] as any).type).toBe('state');
    expect((messages[1] as any).payload.generatedAt).toBe(7);

    client.close();
    ws.close();
    server.close();
  });

  it('broadcasts state when notified', async () => {
    const server = http.createServer();
    let state = fakeState(1);
    const ws = attachWebSocket(server, () => state);
    await new Promise<void>(r => server.listen(0, r));
    const port = (server.address() as { port: number }).port;

    const client = new WebSocket(`ws://localhost:${port}/ws`);
    await new Promise<void>(r => client.once('open', () => r()));
    // consume hello + initial state
    await new Promise<void>(r => { let n=0; client.on('message', () => { if (++n===2) r(); }); });

    state = fakeState(99);
    ws.broadcastState();
    const next = await new Promise<any>(r => client.once('message', (m) => r(JSON.parse(m.toString()))));
    expect(next.type).toBe('state');
    expect(next.payload.generatedAt).toBe(99);

    client.close();
    ws.close();
    server.close();
  });
});
