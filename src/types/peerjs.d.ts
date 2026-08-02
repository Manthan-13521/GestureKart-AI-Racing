declare class Peer {
  constructor(id?: string, options?: unknown);
  id: string;
  on(event: string, callback: (data?: unknown) => void): void;
  connect(id: string, options?: unknown): DataConnection;
  destroy(): void;
}

declare class DataConnection {
  on(event: string, callback: (data?: unknown) => void): void;
  send(data: unknown): void;
  close(): void;
  peer: string;
}

declare interface Window {
  Peer: typeof Peer;
}
