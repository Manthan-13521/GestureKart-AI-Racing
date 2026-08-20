import { Component } from '../core/Component';

export interface TooltipOptions {
  content: string;
  target: HTMLElement;
  delay?: number;
  offset?: number;
}

export class Tooltip extends Component<HTMLDivElement> {
  private target: HTMLElement;
  private delay: number;
  private offset: number;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: TooltipOptions) {
    super('div', 'tooltip');
    this.target = opts.target;
    this.delay = opts.delay ?? 120;
    this.offset = opts.offset ?? 8;

    this.el.setAttribute('role', 'tooltip');
    this.el.textContent = opts.content;
    this.el.style.position = 'fixed';
    this.el.style.zIndex = 'var(--z-toast)';
    this.el.style.pointerEvents = 'none';
    this.el.style.opacity = '0';
    this.el.style.transition = 'opacity var(--motion-fast) var(--ease-out)';
    this.el.style.background = 'var(--surface-elevated)';
    this.el.style.border = '1px solid var(--glass-border)';
    this.el.style.borderRadius = 'var(--radius-sm)';
    this.el.style.padding = '6px 10px';
    this.el.style.fontSize = '12px';
    this.el.style.fontFamily = 'var(--ff-body)';
    this.el.style.color = 'var(--text)';
    this.el.style.whiteSpace = 'nowrap';
    this.el.style.boxShadow = 'var(--shadow-card)';

    this.target.setAttribute('aria-describedby', this.el.id || '');

    this.target.addEventListener('mouseenter', () => this.scheduleShow());
    this.target.addEventListener('mouseleave', () => this.hide());
    this.target.addEventListener('focus', () => this.scheduleShow());
    this.target.addEventListener('blur', () => this.hide());
    this.target.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  private scheduleShow(): void {
    if (this.showTimeout) clearTimeout(this.showTimeout);
    this.showTimeout = setTimeout(() => this.show(), this.delay);
  }

  show(): void {
    document.body.appendChild(this.el);
    const rect = this.target.getBoundingClientRect();
    this.el.style.left = `${rect.left + rect.width / 2}px`;
    this.el.style.top = `${rect.top - this.offset}px`;
    this.el.style.transform = 'translate(-50%, -100%)';
    this.el.style.opacity = '1';
  }

  hide(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.el.style.opacity = '0';
    setTimeout(() => this.el.remove(), 150);
  }

  dispose(): void {
    if (this.showTimeout) clearTimeout(this.showTimeout);
    this.el.remove();
    this.target.removeAttribute('aria-describedby');
  }
}
