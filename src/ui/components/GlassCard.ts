import { Component } from '../core/Component';

export interface GlassCardOptions {
  title?: string;
  subtitle?: string;
  badge?: string;
  preview?: string;
  onClick?: () => void;
  focusable?: boolean;
  selected?: boolean;
}

export interface CardMeta {
  label: string;
  value: string;
}

/**
 * Premium glassmorphism card with sheen effect, selection states, and stagger support.
 */
export class GlassCard extends Component<HTMLElement> {
  private readonly body: HTMLElement;
  private readonly sheenEl: HTMLElement;

  constructor(opts: GlassCardOptions = {}) {
    super('article', 'card glass-card');
    if (opts.focusable) {
      this.el.setAttribute('tabindex', '0');
      this.el.setAttribute('role', 'button');
    }

    // Sheen element
    this.sheenEl = document.createElement('div');
    this.sheenEl.className = 'card-sheen';
    this.el.appendChild(this.sheenEl);

    if (opts.preview) {
      const preview = document.createElement('div');
      preview.className = 'card-preview';
      preview.style.backgroundImage = `linear-gradient(160deg, ${opts.preview} 0%, transparent 70%)`;
      this.el.appendChild(preview);
    }

    this.body = document.createElement('div');
    this.body.className = 'card-body';
    this.el.appendChild(this.body);

    if (opts.badge) {
      const badge = document.createElement('span');
      badge.className = 'card-badge';
      badge.textContent = opts.badge;
      this.body.appendChild(badge);
    }

    if (opts.title) {
      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = opts.title;
      this.body.appendChild(title);
    }

    if (opts.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'card-subtitle';
      subtitle.textContent = opts.subtitle;
      this.body.appendChild(subtitle);
    }

    if (opts.onClick) {
      this.on('click', '.card', opts.onClick);
    }

    if (opts.selected) {
      this.setSelected(true);
    }

    // Stagger support
    if (opts.focusable) {
      this.el.style.setProperty('--i', '0');
    }
  }

  setSelected(on: boolean): void {
    this.el.classList.toggle('card-selected', on);
  }

  setStaggerIndex(index: number): void {
    this.el.style.setProperty('--i', String(index));
  }

  addMeta(meta: CardMeta): void {
    const row = document.createElement('dl');
    row.className = 'card-meta';
    const dt = document.createElement('dt');
    dt.textContent = meta.label;
    const dd = document.createElement('dd');
    dd.textContent = meta.value;
    row.append(dt, dd);
    this.body.appendChild(row);
  }

  setDescription(text: string): void {
    const desc = document.createElement('p');
    desc.className = 'card-description';
    desc.textContent = text;
    this.body.appendChild(desc);
  }

  addSlot(el: HTMLElement): void {
    this.body.appendChild(el);
  }
}
