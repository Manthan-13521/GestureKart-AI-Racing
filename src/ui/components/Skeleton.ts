import { Component } from '../core/Component';

export interface SkeletonOptions {
  width?: string;
  height?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export class Skeleton extends Component<HTMLDivElement> {
  constructor(opts: SkeletonOptions = {}) {
    super('div', 'skeleton');
    const { width = '100%', height = '16px', variant = 'text' } = opts;

    this.el.setAttribute('aria-hidden', 'true');
    this.el.setAttribute('aria-busy', 'true');
    this.el.style.background = 'var(--glass)';
    this.el.style.borderRadius = variant === 'circle' ? '50%' : 'var(--radius-sm)';
    this.el.style.width = variant === 'circle' ? height : width;
    this.el.style.height = height;
    this.el.style.position = 'relative';
    this.el.style.overflow = 'hidden';

    const shimmer = document.createElement('div');
    shimmer.className = 'skeleton-shimmer';
    shimmer.style.position = 'absolute';
    shimmer.style.inset = '0';
    shimmer.style.background = 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)';
    shimmer.style.animation = 'shimmer 1.5s infinite';
    this.el.appendChild(shimmer);
  }
}
