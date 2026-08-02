import { AnimationSystem } from './AnimationSystem';
import { ZTokens } from '../tokens';

export interface ModalOptions {
  title?: string;
  dismissible?: boolean;
  onClose?: () => void;
  width?: string;
}

/**
 * Stacked modal host with focus trapping and ESC / backdrop dismissal.
 * Rendered lazily into a singleton container on the first open.
 */
export class ModalSystem {
  private static instance: ModalSystem | null = null;

  static getInstance(): ModalSystem {
    if (!ModalSystem.instance) {
      ModalSystem.instance = new ModalSystem();
    }
    return ModalSystem.instance;
  }

  private host: HTMLElement | null = null;
  private stack: Array<{ modal: HTMLElement; opts: ModalOptions }> = [];
  private lastFocused: HTMLElement | null = null;
  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.stack.length > 0) {
      const top = this.stack[this.stack.length - 1];
      if (top.opts.dismissible !== false) this.close();
    }
    if (e.key === 'Tab' && this.stack.length > 0) this.trapFocus(e);
  };

  private ensureHost(): HTMLElement {
    if (!this.host) {
      this.host = document.createElement('div');
      this.host.className = 'modal-host';
      this.host.style.zIndex = String(ZTokens.modal);
      document.body.appendChild(this.host);
    }
    return this.host;
  }

  open(content: HTMLElement, opts: ModalOptions = {}): void {
    const host = this.ensureHost();
    this.lastFocused = document.activeElement as HTMLElement | null;

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.dataset.visible = 'false';

    const modal = document.createElement('div');
    modal.className = 'modal-panel';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    if (opts.title) {
      const title = document.createElement('h2');
      title.className = 'modal-title';
      title.textContent = opts.title;
      modal.appendChild(title);
    }
    if (opts.dismissible !== false) {
      const close = document.createElement('button');
      close.className = 'btn-icon';
      close.setAttribute('aria-label', 'Close dialog');
      close.innerHTML = '&times;';
      close.addEventListener('click', () => this.close());
      modal.appendChild(close);
    }
    if (opts.width) modal.style.width = opts.width;
    modal.appendChild(content);

    backdrop.appendChild(modal);
    host.appendChild(backdrop);
    this.stack.push({ modal, opts });
    document.addEventListener('keydown', this.onKeyDown);

    void AnimationSystem.play(backdrop, 'fade-in');
    void AnimationSystem.play(modal, 'scale-in');

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop && opts.dismissible !== false) this.close();
    });
    this.focusFirst(modal);
  }

  close(): void {
    const top = this.stack.pop();
    if (!top) return;
    const backdrop = top.modal.parentElement as HTMLElement | null;
    if (backdrop) backdrop.remove();
    top.opts.onClose?.();
    if (this.stack.length === 0) document.removeEventListener('keydown', this.onKeyDown);
    this.lastFocused?.focus();
  }

  closeAll(): void {
    while (this.stack.length > 0) this.close();
  }

  get openCount(): number {
    return this.stack.length;
  }

  private focusablesOf(modal: HTMLElement): HTMLElement[] {
    return Array.from(
      modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled'));
  }

  private focusFirst(modal: HTMLElement): void {
    this.focusablesOf(modal)[0]?.focus();
  }

  private trapFocus(e: KeyboardEvent): void {
    const top = this.stack[this.stack.length - 1];
    if (!top) return;
    const focusables = this.focusablesOf(top.modal);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
