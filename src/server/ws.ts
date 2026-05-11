import { WebSocketServer, OPEN, WebSocket } from 'ws';
import type { Server } from 'node:http';
import type { DashboardState, WsMessage } from '../shared/types.js';

export interface WsLayer {
  broadcastState: () => Promise<void>;
  close: () => void;
}

export function attachWebSocket(server: Server, getState: () => Promise<DashboardState> | DashboardState): WsLayer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  const send = (ws: WebSocket, msg: WsMessage) => {
    if (ws.readyState === OPEN) ws.send(JSON.stringify(msg));
  };

  wss.on('connection', async (ws) => {
    ws.send(JSON.stringify({ type: 'hello', payload: { serverVersion: '0.1.0' } }));
    const state = await getState();
    ws.send(JSON.stringify({ type: 'state', payload: state }));
  });

  const broadcastState = async () => {
    const state = await getState();
    const msg: WsMessage = { type: 'state', payload: state };
    for (const client of wss.clients) send(client, msg);
  };

  return {
    broadcastState,
    close: () => wss.close(),
  };
}
