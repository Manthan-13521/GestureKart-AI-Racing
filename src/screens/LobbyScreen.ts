import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import { SoundHooks } from '../ui/core/SoundHooks';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import { NetworkManager } from '../network/NetworkManager';
import type { TrackId } from './TrackSelectScreen';

export class LobbyScreen extends Screen {
  trackId: TrackId | null = null;
  onBack: (() => void) | null = null;
  onStartRace: ((hostId: string, isHost: boolean) => void) | null = null;

  private network: NetworkManager | null = null;
  private roomCode: string | null = null;
  private peers: string[] = [];

  private viewState: 'select' | 'hosting' | 'joining' | 'lobby' = 'select';

  private container!: HTMLElement;
  private joinInput!: HTMLInputElement;

  constructor() {
    super('lobby');
  }

  protected transition(): TransitionKind {
    return 'fade';
  }

  protected build(params: Record<string, unknown>): void {
    if (params.track) this.trackId = params.track as TrackId;

    this.network = new NetworkManager();
    this.network.onPeerConnected((id) => this.handlePeerConnected(id));
    this.network.onPeerDisconnected((id) => this.handlePeerDisconnected(id));
    this.network.onMessage((id, msg) => this.handleMessage(id, msg));

    this.container = document.createElement('div');
    this.container.className = 'screen-inner lobby-screen';
    this.el.appendChild(this.container);

    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'screen-header';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'screen-eyebrow';
    eyebrow.textContent = `Track: ${this.trackId?.replace(/-/g, ' ')}`;
    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = 'Multiplayer Lobby';
    header.append(eyebrow, title);
    this.container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'lobby-content';
    this.container.appendChild(content);

    if (this.viewState === 'select') {
      this.renderSelectView(content);
    } else if (this.viewState === 'hosting') {
      content.innerHTML = '<div class="lobby-status">Creating Room...</div>';
    } else if (this.viewState === 'joining') {
      content.innerHTML = '<div class="lobby-status">Joining Room...</div>';
    } else if (this.viewState === 'lobby') {
      this.renderLobbyView(content);
    }

    const footer = document.createElement('div');
    footer.className = 'screen-footer';
    const backBtn = new Button('Back', { variant: 'ghost' });
    backBtn.el.addEventListener('click', () => {
      SoundHooks.back();
      if (this.viewState === 'lobby') {
        this.network?.disconnect();
        this.viewState = 'select';
        this.render();
      } else {
        this.onBack?.();
      }
    });
    footer.appendChild(backBtn.el);
    this.container.appendChild(footer);

    AnimationSystem.play(this.container, 'fade-in');
  }

  private renderSelectView(parent: HTMLElement): void {
    const card = document.createElement('div');
    card.className = 'lobby-select-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '24px';
    card.style.padding = '40px';
    card.style.background = 'rgba(255,255,255,0.05)';
    card.style.borderRadius = '16px';

    const hostBtn = new Button('Host Game', { variant: 'primary' });
    hostBtn.el.addEventListener('click', () => this.startHosting());

    const joinRow = document.createElement('div');
    joinRow.style.display = 'flex';
    joinRow.style.gap = '12px';

    this.joinInput = document.createElement('input');
    this.joinInput.type = 'text';
    this.joinInput.placeholder = 'Enter 6-Digit Code';
    this.joinInput.maxLength = 6;
    this.joinInput.style.flex = '1';
    this.joinInput.style.padding = '0 16px';
    this.joinInput.style.fontSize = '24px';
    this.joinInput.style.fontFamily = 'monospace';
    this.joinInput.style.textTransform = 'uppercase';
    this.joinInput.style.background = 'rgba(0,0,0,0.5)';
    this.joinInput.style.color = '#fff';
    this.joinInput.style.border = '2px solid rgba(255,255,255,0.2)';
    this.joinInput.style.borderRadius = '8px';

    const joinBtn = new Button('Join Game', { variant: 'primary' });
    joinBtn.el.addEventListener('click', () => this.startJoining());

    joinRow.appendChild(this.joinInput);
    joinRow.appendChild(joinBtn.el);

    card.appendChild(hostBtn.el);
    const div = document.createElement('div');
    div.textContent = '— OR —';
    div.style.textAlign = 'center';
    div.style.color = 'var(--text2)';
    card.appendChild(div);
    card.appendChild(joinRow);

    parent.appendChild(card);
  }

  private renderLobbyView(parent: HTMLElement): void {
    const roomInfo = document.createElement('div');
    roomInfo.className = 'lobby-room-info';
    roomInfo.style.textAlign = 'center';
    roomInfo.style.marginBottom = '40px';

    const codeLabel = document.createElement('div');
    codeLabel.textContent = 'ROOM CODE';
    codeLabel.style.color = 'var(--text2)';
    codeLabel.style.fontSize = '14px';

    const codeVal = document.createElement('div');
    codeVal.textContent = this.roomCode || 'UNKNOWN';
    codeVal.style.color = 'var(--gold)';
    codeVal.style.fontSize = '48px';
    codeVal.style.fontFamily = 'monospace';
    codeVal.style.letterSpacing = '4px';

    roomInfo.appendChild(codeLabel);
    roomInfo.appendChild(codeVal);
    parent.appendChild(roomInfo);

    const playersList = document.createElement('div');
    playersList.className = 'lobby-players';
    playersList.style.display = 'flex';
    playersList.style.flexDirection = 'column';
    playersList.style.gap = '12px';

    // Self
    playersList.appendChild(this.createPlayerCard(this.network?.getPeerId() || 'Me', true));

    // Peers
    for (const peer of this.peers) {
      playersList.appendChild(this.createPlayerCard(peer, false));
    }

    parent.appendChild(playersList);

    if (this.network?.isHost) {
      const startBtn = new Button('Start Race', { variant: 'primary' });
      startBtn.el.style.marginTop = '40px';
      startBtn.el.style.width = '100%';
      if (this.peers.length === 0) {
        startBtn.el.disabled = true;
        startBtn.el.style.opacity = '0.5';
      }
      startBtn.el.addEventListener('click', () => {
        this.network?.broadcast({ type: 'start_race', payload: {} });
        if (this.roomCode) {
          this.onStartRace?.(this.roomCode, true);
        }
      });
      parent.appendChild(startBtn.el);
    } else {
      const waiting = document.createElement('div');
      waiting.textContent = 'Waiting for host to start...';
      waiting.style.marginTop = '40px';
      waiting.style.textAlign = 'center';
      waiting.style.color = 'var(--text2)';
      parent.appendChild(waiting);
    }
  }

  private createPlayerCard(id: string, isSelf: boolean): HTMLElement {
    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';
    card.style.padding = '16px 24px';
    card.style.background = isSelf ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)';
    card.style.border = isSelf ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent';
    card.style.borderRadius = '8px';

    const name = document.createElement('div');
    name.textContent = isSelf ? 'Player 1 (You)' : `Player 2 (${id})`;
    name.style.fontSize = '18px';
    name.style.fontWeight = '600';
    name.style.color = isSelf ? 'var(--gold)' : '#fff';

    const ping = document.createElement('div');
    ping.textContent = isSelf ? 'Host' : 'Ready';
    ping.style.color = 'var(--green)';
    ping.style.fontSize = '14px';

    card.appendChild(name);
    card.appendChild(ping);
    return card;
  }

  private async startHosting(): Promise<void> {
    SoundHooks.confirm();
    this.viewState = 'hosting';
    this.render();
    try {
      if (!this.network) return;
      const code = await this.network.createLobby();
      this.roomCode = code;
      this.viewState = 'lobby';
      this.render();
    } catch (err: unknown) {
      console.error(err);
      this.viewState = 'select';
      this.render();
      alert('Failed to host lobby: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  private async startJoining(): Promise<void> {
    const code = this.joinInput.value.toUpperCase();
    if (!code || code.length !== 6) {
      SoundHooks.back();
      return;
    }
    SoundHooks.confirm();
    this.viewState = 'joining';
    this.render();
    try {
      if (!this.network) return;
      await this.network.joinLobby(code);
      this.roomCode = code;
      this.viewState = 'lobby';
      this.render();
    } catch (err: unknown) {
      console.error(err);
      this.viewState = 'select';
      this.render();
      alert('Failed to join lobby: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  private handlePeerConnected(id: string): void {
    if (!this.peers.includes(id)) {
      this.peers.push(id);
    }
    SoundHooks.hover();
    if (this.viewState === 'lobby') {
      this.render();
    }
  }

  private handlePeerDisconnected(id: string): void {
    this.peers = this.peers.filter((p) => p !== id);
    if (this.viewState === 'lobby') {
      this.render();
    }
  }

  private handleMessage(_senderId: string, msg: unknown): void {
    if ((msg as { type?: string }).type === 'start_race') {
      if (this.roomCode) {
        this.onStartRace?.(this.roomCode, false);
      }
    }
  }

  protected destroy(): void {
    if (this.network) {
      // Disconnecting the lobby network, as actual gameplay network might be passed?
      // Wait, we need to pass this network instance to GameplayScreen so it can use it!
      // I'll expose this.network, but for now we won't destroy it here if we start race.
    }
  }

  public getNetworkInstance(): NetworkManager | null {
    return this.network;
  }
}
