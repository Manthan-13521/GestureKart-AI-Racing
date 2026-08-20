import { Component } from '../core/Component';
import { Button } from './Button';

export interface EmptyStateOptions {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export class EmptyState extends Component<HTMLDivElement> {
  constructor(opts: EmptyStateOptions) {
    super('div', 'empty-state');
    const { icon, title, description, actionLabel, onAction } = opts;

    this.el.style.display = 'flex';
    this.el.style.flexDirection = 'column';
    this.el.style.alignItems = 'center';
    this.el.style.gap = '12px';
    this.el.style.padding = '48px 24px';
    this.el.style.textAlign = 'center';

    const iconEl = document.createElement('div');
    iconEl.className = 'empty-icon';
    iconEl.textContent = icon;
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.style.fontSize = '48px';
    iconEl.style.opacity = '0.5';

    const titleEl = document.createElement('div');
    titleEl.className = 'empty-title';
    titleEl.textContent = title;
    titleEl.style.fontFamily = 'var(--ff-display)';
    titleEl.style.fontSize = 'var(--fs-h2)';
    titleEl.style.fontWeight = '700';
    titleEl.style.color = 'var(--text)';

    const descEl = document.createElement('div');
    descEl.className = 'empty-desc';
    descEl.textContent = description;
    descEl.style.fontFamily = 'var(--ff-body)';
    descEl.style.fontSize = 'var(--fs-body)';
    descEl.style.color = 'var(--text-muted)';
    descEl.style.maxWidth = '320px';

    this.el.append(iconEl, titleEl, descEl);

    if (actionLabel && onAction) {
      const btn = new Button(actionLabel, { variant: 'primary' });
      btn.el.addEventListener('click', onAction);
      this.el.appendChild(btn.el);
    }
  }
}
