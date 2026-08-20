import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import { SoundHooks } from '../ui/core/SoundHooks';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import type { PhoneSource, PhoneStatePayload } from '../input/PhoneSource';
import type { TrackId } from './TrackSelectScreen';
import type { ModeId } from './ModeSelectScreen';
import qrcode from 'qrcode-generator';

function qrSvg(text: string): string {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
}

type ViewState = 'creating' | 'ready' | 'connected' | 'error';

/**
 * Phone Controller pairing screen. Hosts a PeerJS room, shows a QR code
 * (plus manual room-code fallback), and enables "Start Race" once a phone
 * has connected. Functional UI only — a dedicated UX pass happens later.
 */
export class PhoneControllerScreen extends Screen {
  onBack: (() => void) | null = null;
  onStartRace: ((track: TrackId, mode: ModeId) => void) | null = null;

  private track: TrackId = 'cyber-city';
  private mode: ModeId = 'survival';
  private state: ViewState = 'creating';
  private container!: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor(private phone: PhoneSource) {
    super('phone-pairing');
  }

  protected transition(): TransitionKind {
    return 'fade';
  }

  protected build(params: Record<string, unknown>): void {
    if (params.track) this.track = params.track as TrackId;
    if (params.mode) this.mode = params.mode as ModeId;

    this.unsubscribe = this.phone ? this.bindEvents() : null;
    void this.host();

    const wrap = document.createElement('div');
    wrap.className = 'screen-inner';
    this.container = document.createElement('div');
    this.container.className = 'phone-pairing';
    wrap.appendChild(this.container);

    const header = document.createElement('div');
    header.className = 'screen-header';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'screen-eyebrow';
    eyebrow.textContent = `${this.track.replace(/-/g, ' ')} · ${this.mode.replace(/-/g, ' ')}`;
    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = 'Phone Controller';
    header.append(eyebrow, title);
    wrap.appendChild(header);

    wrap.appendChild(this.container);

    const footer = document.createElement('div');
    footer.className = 'screen-footer';
    const backBtn = new Button('Back', { variant: 'ghost' });
    backBtn.el.addEventListener('click', () => {
      SoundHooks.back();
      this.onBack?.();
    });
    footer.appendChild(backBtn.el);
    wrap.appendChild(footer);

    this.el.appendChild(wrap);
    this.render();
    void AnimationSystem.play(header, 'fade-in');
  }

  private bindEvents(): () => void {
    return this.phone.onState((st: PhoneStatePayload) => {
      this.state = st.connected ? 'connected' : this.phone.roomCode ? 'ready' : 'creating';
      this.render();
    });
  }

  private async host(): Promise<void> {
    try {
      await this.phone.start();
      this.state = 'ready';
    } catch (err: unknown) {
      console.error(err);
      this.state = 'error';
    }
    this.render();
  }

  private render(): void {
    if (!this.container) return;
    this.container.innerHTML = '';

    const block = document.createElement('div');
    block.className = 'phone-pairing-card';

    if (this.state === 'creating') {
      block.innerHTML = '<div class="lobby-status">Creating Room…</div>';
    } else if (this.state === 'error') {
      const err = document.createElement('div');
      err.style.color = 'var(--red)';
      err.textContent = 'Failed to create room. Check your connection.';
      block.appendChild(err);
      const retry = new Button('Retry', { variant: 'primary' });
      retry.el.addEventListener('click', () => {
        this.state = 'creating';
        this.render();
        void this.host();
      });
      block.appendChild(retry.el);
    } else {
      const url = this.phone.controllerUrl();
      const code = this.phone.roomCode ?? '';

      const qrWrap = document.createElement('div');
      qrWrap.className = 'phone-pairing-qr-wrap';
      qrWrap.innerHTML = qrSvg(url);
      block.appendChild(qrWrap);

      const codeLabel = document.createElement('div');
      codeLabel.className = 'phone-pairing-code-label';
      codeLabel.textContent = 'OR ENTER ROOM CODE';
      block.appendChild(codeLabel);

      const codeVal = document.createElement('div');
      codeVal.className = 'phone-pairing-code';
      codeVal.textContent = code;
      block.appendChild(codeVal);

      // Horizontal steering instruction box
      const steerGuide = document.createElement('div');
      steerGuide.className = 'phone-pairing-guide';
      steerGuide.innerHTML = `
        <div class="phone-guide-badge">HORIZONTAL WHEEL MODE</div>
        <div class="phone-guide-desc">Hold your phone <strong>horizontally</strong> like a steering wheel. Turn clockwise to steer <strong>Right</strong> and counter-clockwise to steer <strong>Left</strong>.</div>
      `;
      block.appendChild(steerGuide);

      const status = document.createElement('div');
      status.className = 'phone-pairing-status';
      status.textContent =
        this.state === 'connected' ? '✓ Phone connected & calibrated' : 'Waiting for phone connection…';
      status.style.color = this.state === 'connected' ? 'var(--accent-primary)' : 'var(--text-muted)';
      block.appendChild(status);

      const hint = document.createElement('div');
      hint.className = 'phone-pairing-hint';
      hint.textContent =
        'Scan QR code with your phone camera or enter the room code on the controller web page.';
      block.appendChild(hint);

      const startBtn = new Button('Start Race', { variant: 'primary', size: 'lg' });
      startBtn.el.style.width = '100%';
      startBtn.el.style.marginTop = '12px';
      if (this.state !== 'connected') startBtn.disabled = true;
      startBtn.el.addEventListener('click', () => {
        SoundHooks.confirm();
        this.onStartRace?.(this.track, this.mode);
      });
      block.appendChild(startBtn.el);
    }

    this.container.appendChild(block);
  }

  protected destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  dispose(): void {
    this.destroy();
    super.dispose();
  }
}
