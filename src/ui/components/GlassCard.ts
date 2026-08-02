import { Component } from '../core/Component';
import { SoundHooks } from '../core/SoundHooks';

export interface GlassCardOptions {
  title?: string;
  subtitle?: string;
  badge?: string;
  preview?: string;
  onClick?: () => void;
  focusable?: boolean;
}

export interface CardMeta {
  label: string;
  value: string;
}

/**
 * Glassmorphism card used by track / mode selection. Optionally focusable
 * (for keyboard/gamepad grids) and interactive.
 */
export class GlassCard extends Component<HTMLElement> {
  private readonly body: HTMLElement;

  constructor(opts: GlassCardOptions = {}) {
    super('article', 'glass-card');
    if (opts.focusable) {
      this.el.setAttribute('tabindex', '0');
      this.el.setAttribute('role', 'button');
    }
    if (opts.preview) {
      const preview = document.createElement('div');
      preview.className = 'glass-card-preview';
      preview.style.backgroundImage = `linear-gradient(160deg, ${opts.preview} 0%, transparent 70%)`;
      this.el.appendChild(preview);
    }
    this.body = document.createElement('div');
    this.body.className = 'glass-card-body';
    this.el.appendChild(this.body);

    if (opts.badge) {
      const badge = document.createElement('span');
      badge.className = 'glass-card-badge';
      badge.textContent = opts.badge;
      this.body.appendChild(badge);
    }
    if (opts.title) {
      const title = document.createElement('h3');
      title.className = 'glass-card-title';
      title.textContent = opts.title;
      this.body.appendChild(title);
    }
    if (opts.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'glass-card-subtitle';
      subtitle.textContent = opts.subtitle;
      this.body.appendChild(subtitle);
    }

    if (opts.onClick) {
      this.on('click', '.glass-card', opts.onClick);
      this.el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          SoundHooks.confirm();
          opts.onClick?.();
        }
      });
    }
  }

  addMeta(meta: CardMeta): void {
    const row = document.createElement('dl');
    row.className = 'glass-card-meta';
    const dt = document.createElement('dt');
    dt.textContent = meta.label;
    const dd = document.createElement('dd');
    dd.textContent = meta.value;
    row.append(dt, dd);
    this.body.appendChild(row);
  }

  setDescription(text: string): void {
    const desc = document.createElement('p');
    desc.className = 'glass-card-description';
    desc.textContent = text;
    this.body.appendChild(desc);
  }

  addSlot(el: HTMLElement): void {
    this.body.appendChild(el);
  }
}
