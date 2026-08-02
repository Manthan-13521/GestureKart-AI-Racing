export interface NetMessage {
  type: string;
  payload: unknown;
}

export class NetworkManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostId: string | null = null;
  public isHost = false;

  private onMessageCallback: ((senderId: string, msg: NetMessage) => void) | null = null;
  private onPeerConnectedCallback: ((peerId: string) => void) | null = null;
  private onPeerDisconnectedCallback: ((peerId: string) => void) | null = null;

  constructor() {}

  public onMessage(cb: (senderId: string, msg: NetMessage) => void): void {
    this.onMessageCallback = cb;
  }

  public onPeerConnected(cb: (peerId: string) => void): void {
    this.onPeerConnectedCallback = cb;
  }

  public onPeerDisconnected(cb: (peerId: string) => void): void {
    this.onPeerDisconnectedCallback = cb;
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

  public async joinLobby(hostId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.hostId = hostId;
      this.peer = new Peer();

      this.peer.on('open', (myId) => {
        if (!this.peer) return;
        const conn = this.peer.connect(hostId);
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
      if (this.onMessageCallback) {
        this.onMessageCallback(conn.peer, data as NetMessage);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (this.onPeerDisconnectedCallback) {
        this.onPeerDisconnectedCallback(conn.peer);
      }
    });

    if (this.onPeerConnectedCallback) {
      this.onPeerConnectedCallback(conn.peer);
    }
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
  }
}
