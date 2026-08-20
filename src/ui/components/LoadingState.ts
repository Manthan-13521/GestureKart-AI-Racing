import { Component } from '../core/Component';

export interface LoadingStateOptions {
  label?: string;
  size?: number;
}

export class LoadingState extends Component<HTMLDivElement> {
  constructor(opts: LoadingStateOptions = {}) {
    super('div', 'loading-state');
    const { label = 'Loading...', size = 40 } = opts;

    this.el.setAttribute('role', 'status');
    this.el.setAttribute('aria-busy', 'true');
    this.el.style.display = 'flex';
    this.el.style.flexDirection = 'column';
    this.el.style.alignItems = 'center';
    this.el.style.gap = '12px';
    this.el.style.padding = '32px';
    this.el.style.justifyContent = 'center';

    const ring = document.createElement('div');
    ring.className = 'loading-ring';
    ring.style.width = `${size}px`;
    ring.style.height = `${size}px`;
    ring.style.border = '3px solid var(--border)';
    ring.style.borderTopColor = 'var(--accent-primary)';
    ring.style.borderRadius = '50%';
    ring.style.animation = 'spin 0.8s linear infinite';

    const text = document.createElement('div');
    text.className = 'loading-label';
    text.textContent = label;
    text.style.fontFamily = 'var(--ff-hud)';
    text.style.fontSize = '13px';
    text.style.color = 'var(--text-muted)';
    text.style.textTransform = 'uppercase';
    text.style.letterSpacing = '0.08em';

    this.el.append(ring, text);
  }
}
