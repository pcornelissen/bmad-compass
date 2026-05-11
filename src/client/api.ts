import type { DashboardState, WsMessage } from '../shared/types.js';

export async function fetchState(): Promise<DashboardState> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error(`fetchState failed: ${res.status}`);
  return res.json();
}

export async function fetchArtifact(relativePath: string): Promise<string> {
  const res = await fetch(`/api/artifact?path=${encodeURIComponent(relativePath)}`);
  if (!res.ok) throw new Error(`fetchArtifact failed: ${res.status}`);
  return res.text();
}

export type WsHandler = (msg: WsMessage) => void;

export function connectWs(onMessage: WsHandler, onStatusChange?: (online: boolean) => void): () => void {
  let socket: WebSocket | null = null;
  let closed = false;

  const open = () => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${proto}://${location.host}/ws`);
    socket.onopen = () => onStatusChange?.(true);
    socket.onclose = () => {
      onStatusChange?.(false);
      if (!closed) setTimeout(open, 1000);
    };
    socket.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data) as WsMessage); } catch { /* ignore */ }
    };
  };
  open();

  return () => { closed = true; socket?.close(); };
}
