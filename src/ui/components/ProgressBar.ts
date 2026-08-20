import { Component } from '../core/Component';

export interface ProgressBarOptions {
  height?: number;
  trackColor?: string;
  fillColor?: string;
  initialProgress?: number;
  shimmer?: boolean;
}

export class ProgressBar extends Component<HTMLElement> {
  private fillEl: HTMLElement;
  private shimmerEl: HTMLElement | null = null;

  constructor(opts: ProgressBarOptions = {}) {
    super('div', 'progress-bar');
    const {
      height = 6,
      trackColor = 'var(--glass)',
      fillColor = 'linear-gradient(90deg, var(--accent-primary), var(--accent-gold))',
      initialProgress = 0,
      shimmer = true,
    } = opts;

    this.el.style.height = `${height}px`;
    this.el.style.borderRadius = '3px';
    this.el.style.background = trackColor;
    this.el.style.overflow = 'hidden';
    this.el.style.position = 'relative';

    this.fillEl = document.createElement('div');
    this.fillEl.className = 'progress-fill';
    this.fillEl.style.height = '100%';
    this.fillEl.style.width = '0%';
    this.fillEl.style.background = fillColor;
    this.fillEl.style.borderRadius = '3px';
    this.fillEl.style.transition = 'width var(--motion-medium) var(--ease-out)';
    this.fillEl.style.position = 'relative';
    this.el.appendChild(this.fillEl);

    if (shimmer) {
      this.shimmerEl = document.createElement('div');
      this.shimmerEl.className = 'shimmer';
      this.shimmerEl.style.position = 'absolute';
      this.shimmerEl.style.inset = '0';
      this.shimmerEl.style.background =
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)';
      this.shimmerEl.style.animation = 'shimmer 1.5s infinite';
      this.el.appendChild(this.shimmerEl);
    }

    this.setProgress(initialProgress, false);
  }

  setProgress(progress: number, animate = true): void {
    const clamped = Math.max(0, Math.min(1, progress));
    if (!animate) {
      this.fillEl.style.transition = 'none';
      this.fillEl.style.width = `${clamped * 100}%`;
      this.fillEl.getBoundingClientRect();
      this.fillEl.style.transition = 'width var(--motion-medium) var(--ease-out)';
    } else {
      this.fillEl.style.width = `${clamped * 100}%`;
    }
  }
}
