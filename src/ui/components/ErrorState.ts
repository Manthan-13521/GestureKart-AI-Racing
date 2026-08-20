import { Component } from '../core/Component';
import { Button } from './Button';

export interface ErrorStateOptions {
  message: string;
  onRetry?: () => void;
}

export class ErrorState extends Component<HTMLDivElement> {
  constructor(opts: ErrorStateOptions) {
    super('div', 'error-state');
    const { message, onRetry } = opts;

    this.el.setAttribute('role', 'alert');
    this.el.style.display = 'flex';
    this.el.style.flexDirection = 'column';
    this.el.style.alignItems = 'center';
    this.el.style.gap = '12px';
    this.el.style.padding = '32px';
    this.el.style.textAlign = 'center';
    this.el.style.background = 'var(--accent-red-dim)';
    this.el.style.border = '1px solid var(--accent-red)';
    this.el.style.borderRadius = 'var(--radius)';

    const iconEl = document.createElement('div');
    iconEl.className = 'error-icon';
    iconEl.textContent = '✕';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.style.fontSize = '24px';
    iconEl.style.color = 'var(--accent-red)';
    iconEl.style.fontWeight = '700';

    const textEl = document.createElement('div');
    textEl.className = 'error-message';
    textEl.textContent = message;
    textEl.style.fontFamily = 'var(--ff-body)';
    textEl.style.fontSize = 'var(--fs-body)';
    textEl.style.color = 'var(--text)';

    this.el.append(iconEl, textEl);

    if (onRetry) {
      const btn = new Button('Retry', { variant: 'danger', size: 'sm' });
      btn.el.addEventListener('click', onRetry);
      this.el.appendChild(btn.el);
    }
  }
}
