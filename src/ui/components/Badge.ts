import { Component } from '../core/Component';

export type BadgeVariant = 'primary' | 'gold' | 'cyan' | 'red' | 'magenta';

export interface BadgeOptions {
  variant?: BadgeVariant;
  label: string;
  icon?: string;
}

export class Badge extends Component<HTMLElement> {
  constructor(opts: BadgeOptions) {
    super('span', 'badge');
    const { variant = 'primary', label, icon } = opts;

    this.el.classList.add(`badge-${variant}`);
    this.el.style.display = 'inline-flex';
    this.el.style.alignItems = 'center';
    this.el.style.gap = '4px';
    this.el.style.padding = '3px 10px';
    this.el.style.borderRadius = 'var(--radius-pill)';
    this.el.style.fontFamily = 'var(--ff-hud)';
    this.el.style.fontSize = '9px';
    this.el.style.fontWeight = '700';
    this.el.style.letterSpacing = '0.08em';
    this.el.style.textTransform = 'uppercase';

    if (icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'badge-icon';
      iconEl.textContent = icon;
      this.el.appendChild(iconEl);
    }

    const text = document.createElement('span');
    text.textContent = label;
    this.el.appendChild(text);
  }

  static variants = {
    primary: {
      background: 'var(--accent-primary-dim)',
      color: 'var(--accent-primary)',
      border: '1px solid var(--accent-primary)',
    },
    gold: {
      background: 'var(--accent-gold-dim)',
      color: 'var(--accent-gold)',
      border: '1px solid var(--accent-gold)',
    },
    cyan: {
      background: 'var(--accent-cyan-dim)',
      color: 'var(--accent-cyan)',
      border: '1px solid var(--accent-cyan)',
    },
    red: {
      background: 'var(--accent-red-dim)',
      color: 'var(--accent-red)',
      border: '1px solid var(--accent-red)',
    },
    magenta: {
      background: 'var(--accent-magenta-dim)',
      color: 'var(--accent-magenta)',
      border: '1px solid var(--accent-magenta)',
    },
  };
}
