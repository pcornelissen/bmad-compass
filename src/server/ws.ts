import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import type { DashboardState, WsMessage } from '../shared/types.js';

export interface WsLayer {
  broadcastState: () => Promise<void>;
  close: () => void;
}

export function attachWebSocket(server: Server, getState: () => Promise<DashboardState> | DashboardState): WsLayer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  const send = (ws: WebSocket, msg: WsMessage) => {
    ws.send(JSON.stringify(msg));
  };

  wss.on('connection', async (ws) => {
    // Defer message sending with setTimeout to ensure client handlers are registered
    await new Promise(r => setTimeout(r, 50));
    send(ws, { type: 'hello', payload: { serverVersion: '0.1.0' } });
    const state = await getState();
    send(ws, { type: 'state', payload: state });
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
