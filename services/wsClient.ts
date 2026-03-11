import type { WsEventMap, WsEventName, ConnectionStatus } from '../types';

type EventCallback<E extends WsEventName> = (data: WsEventMap[E]) => void;
type ConnectionCallback = (status: ConnectionStatus) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEventCallback = (data: any) => void;

const BACKOFF_INITIAL_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

export class NexusWsClient {
  private url: string;
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private backoffMs = BACKOFF_INITIAL_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  // Per-event listeners: Map<eventName, Set<callback>>
  private listeners = new Map<WsEventName, Set<AnyEventCallback>>();
  // Connection-status listeners
  private connectionListeners = new Set<ConnectionCallback>();

  constructor(url: string) {
    this.url = url;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  connect(): void {
    if (this.destroyed) return;
    this._setStatus('connecting');
    this._openSocket();
  }

  disconnect(): void {
    this.destroyed = true;
    this._clearReconnectTimer();
    if (this.ws) {
      this.ws.onclose = null; // suppress reconnect
      this.ws.close();
      this.ws = null;
    }
    this._setStatus('disconnected');
  }

  on<E extends WsEventName>(event: E, cb: EventCallback<E>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb as AnyEventCallback);
  }

  off<E extends WsEventName>(event: E, cb: EventCallback<E>): void {
    this.listeners.get(event)?.delete(cb as AnyEventCallback);
  }

  onConnectionChange(cb: ConnectionCallback): void {
    this.connectionListeners.add(cb);
  }

  offConnectionChange(cb: ConnectionCallback): void {
    this.connectionListeners.delete(cb);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _openSocket(): void {
    if (this.destroyed) return;

    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      if (this.destroyed) { ws.close(); return; }
      this.backoffMs = BACKOFF_INITIAL_MS; // reset backoff on success
      this._setStatus('connected');
    };

    ws.onmessage = (evt: MessageEvent) => {
      try {
        const msg = JSON.parse(evt.data as string) as { event: WsEventName; data: unknown };
        const cbs = this.listeners.get(msg.event);
        if (cbs) {
          cbs.forEach(cb => cb(msg.data));
        }
      } catch {
        // malformed JSON — ignore
      }
    };

    ws.onerror = () => {
      // onerror always fires before onclose; let onclose handle reconnect
    };

    ws.onclose = () => {
      this.ws = null;
      if (this.destroyed) return;
      this._setStatus('reconnecting');
      this._scheduleReconnect();
    };
  }

  private _scheduleReconnect(): void {
    this._clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      if (this.destroyed) return;
      this.backoffMs = Math.min(this.backoffMs * 2, BACKOFF_MAX_MS);
      this._openSocket();
    }, this.backoffMs);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private _setStatus(s: ConnectionStatus): void {
    this.status = s;
    this.connectionListeners.forEach(cb => cb(s));
  }
}

// Singleton factory — one client per URL across the app lifetime
const clients = new Map<string, NexusWsClient>();

export function getNexusWsClient(url: string): NexusWsClient {
  if (!clients.has(url)) {
    clients.set(url, new NexusWsClient(url));
  }
  return clients.get(url)!;
}
