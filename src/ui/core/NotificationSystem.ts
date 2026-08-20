import { AnimationSystem } from './AnimationSystem';

export type ToastKind = 'info' | 'success' | 'error' | 'warn';

export interface ToastOptions {
  kind?: ToastKind;
  timeout?: number;
}

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

/**
 * Stacked toast notifications with auto-dismiss. Used for transient
 * feedback (settings saved, camera errors, etc.).
 */
export class NotificationSystem {
  private static instance: NotificationSystem | null = null;

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  private host: HTMLElement | null = null;
  private nextId = 1;
  private items: ToastItem[] = [];

  private ensureHost(): HTMLElement {
    if (!this.host) {
      this.host = document.createElement('div');
      this.host.className = 'toast-host';
      this.host.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.host);
    }
    return this.host;
  }

  notify(title: string, message?: string, opts: ToastOptions = {}): void {
    const kind = opts.kind ?? 'info';
    const item: ToastItem = { id: this.nextId++, kind, title, message };
    this.items.push(item);
    const el = this.render(item);
    const host = this.ensureHost();
    host.appendChild(el);
    void AnimationSystem.play(el, 'slide-in-up');

    const timeout = opts.timeout ?? (kind === 'error' ? 6000 : 3500);
    setTimeout(() => this.dismiss(item.id), timeout);
  }

  success(title: string, message?: string): void {
    this.notify(title, message, { kind: 'success' });
  }

  warn(title: string, message?: string): void {
    this.notify(title, message, { kind: 'warn' });
  }

  error(title: string, message?: string): void {
    this.notify(title, message, { kind: 'error' });
  }

  dismiss(id: number): void {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const [item] = this.items.splice(idx, 1);
    const el = this.host?.querySelector<HTMLElement>(`[data-toast-id="${item.id}"]`);
    if (!el) return;
    void AnimationSystem.play(el, 'fade-out').then(() => el.remove());
  }

  private render(item: ToastItem): HTMLElement {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `toast toast--${item.kind}`;
    el.dataset.toastId = String(item.id);
    el.setAttribute('aria-label', `Dismiss: ${item.title}`);
    const title = document.createElement('strong');
    title.className = 'toast-title';
    title.textContent = item.title;
    el.appendChild(title);
    if (item.message) {
      const msg = document.createElement('span');
      msg.className = 'toast-message';
      msg.textContent = item.message;
      el.appendChild(msg);
    }
    el.addEventListener('click', () => this.dismiss(item.id));
    return el;
  }
}
