export interface NetMessage {
  type: string;
  payload: unknown;
}

export class NetworkManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostId: string | null = null;
  public isHost = false;

  private messageHandlers: ((senderId: string, msg: NetMessage) => void)[] = [];
  private connectedHandlers: ((peerId: string) => void)[] = [];
  private disconnectedHandlers: ((peerId: string) => void)[] = [];

  constructor() {}

  public onMessage(cb: (senderId: string, msg: NetMessage) => void): void {
    this.messageHandlers.push(cb);
  }

  public onPeerConnected(cb: (peerId: string) => void): void {
    this.connectedHandlers.push(cb);
  }

  public onPeerDisconnected(cb: (peerId: string) => void): void {
    this.disconnectedHandlers.push(cb);
  }

  public async createLobby(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      const id = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 char room code
      this.peer = new Peer(id);

      this.peer.on('open', (peerId) => {
        this.hostId = peerId as string;
        resolve(peerId as string);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn as DataConnection);
      });

      this.peer.on('error', (err) => {
        reject(err);
      });
    });
  }

  public async joinLobby(hostId: string, connectOptions?: unknown): Promise<string> {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.hostId = hostId;
      this.peer = new Peer();

      this.peer.on('open', (myId) => {
        if (!this.peer) return;
        const conn = this.peer.connect(hostId, connectOptions);
        conn.on('open', () => {
          this.setupConnection(conn);
          resolve(myId as string);
        });
        conn.on('error', (err) => reject(err));
      });

      this.peer.on('error', (err) => reject(err));
    });
  }

  private setupConnection(conn: DataConnection): void {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data: unknown) => {
      for (const h of this.messageHandlers) h(conn.peer, data as NetMessage);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      for (const h of this.disconnectedHandlers) h(conn.peer);
    });

    for (const h of this.connectedHandlers) h(conn.peer);
  }

  public broadcast(msg: NetMessage): void {
    for (const conn of this.connections.values()) {
      conn.send(msg);
    }
  }

  public sendTo(peerId: string, msg: NetMessage): void {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.send(msg);
    }
  }

  public getPeerId(): string {
    return this.peer?.id || '';
  }

  public getConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  public disconnect(): void {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.clearListeners();
  }

  /** Drop all registered callbacks without tearing down the peer (P12). */
  public clearListeners(): void {
    this.messageHandlers = [];
    this.connectedHandlers = [];
    this.disconnectedHandlers = [];
  }
}
