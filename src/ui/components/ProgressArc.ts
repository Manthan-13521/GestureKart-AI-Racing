import { Component } from '../core/Component';

export interface ProgressArcOptions {
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  fillColor?: string;
  initialProgress?: number; // 0-1
  label?: string;
}

export class ProgressArc extends Component<HTMLElement> {
  private readonly svg: SVGSVGElement;
  private readonly fillCircle: SVGCircleElement;
  private readonly bgCircle: SVGCircleElement;
  private readonly radius: number;
  private readonly circumference: number;
  private readonly size: number;
  private readonly strokeWidth: number;
  private readonly trackColor: string;
  private readonly fillColor: string;

  constructor(opts: ProgressArcOptions = {}) {
    super('div', 'progress-arc');
    const {
      size = 80,
      strokeWidth = 6,
      trackColor = 'var(--border)',
      fillColor = 'var(--accent-primary)',
      initialProgress = 0,
      label,
    } = opts;

    this.size = size;
    this.strokeWidth = strokeWidth;
    this.trackColor = trackColor;
    this.fillColor = fillColor;
    this.radius = (size - strokeWidth) / 2;
    this.circumference = 2 * Math.PI * this.radius;

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', String(size));
    this.svg.setAttribute('height', String(size));
    this.svg.setAttribute('class', 'progress-arc-svg');
    this.svg.style.transform = 'rotate(-90deg)';
    this.el.appendChild(this.svg);

    const cx = size / 2;
    const r = size / 2 - strokeWidth / 2;
    this.bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.bgCircle.setAttribute('cx', String(cx));
    this.bgCircle.setAttribute('cy', String(cx));
    this.bgCircle.setAttribute('r', String(r));
    this.bgCircle.setAttribute('fill', 'none');
    this.bgCircle.setAttribute('stroke', trackColor);
    this.bgCircle.setAttribute('stroke-width', String(strokeWidth));
    this.bgCircle.classList.add('progress-arc-bg');
    this.svg.appendChild(this.bgCircle);

    this.fillCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.fillCircle.setAttribute('cx', String(cx));
    this.fillCircle.setAttribute('cy', String(cx));
    this.fillCircle.setAttribute('r', String(r));
    this.fillCircle.setAttribute('fill', 'none');
    this.fillCircle.setAttribute('stroke', fillColor);
    this.fillCircle.setAttribute('stroke-width', String(strokeWidth));
    this.fillCircle.setAttribute('stroke-linecap', 'round');
    this.fillCircle.setAttribute('stroke-dasharray', String(this.circumference));
    this.fillCircle.setAttribute('stroke-dashoffset', String(this.circumference));
    this.fillCircle.style.strokeLinecap = 'round';
    this.fillCircle.style.filter = 'drop-shadow(0 0 6px rgba(0,255,102,0.4))';
    this.fillCircle.style.transition = 'stroke-dashoffset var(--motion-medium) var(--ease-out)';
    this.fillCircle.classList.add('progress-arc-fill');
    this.svg.appendChild(this.fillCircle);

    this.el.style.width = `${size}px`;
    this.el.style.height = `${size}px`;

    if (label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'progress-arc-label';
      labelEl.textContent = label;
      this.el.appendChild(labelEl);
    }

    this.setProgress(initialProgress, false);
  }

  setProgress(progress: number, animate = true): void {
    const clamped = Math.max(0, Math.min(1, progress));
    const offset = this.circumference * (1 - clamped);
    if (!animate) {
      this.fillCircle.style.transition = 'none';
      this.fillCircle.setAttribute('stroke-dashoffset', String(offset));
      this.fillCircle.getBoundingClientRect();
      this.fillCircle.style.transition = 'stroke-dashoffset var(--motion-medium) var(--ease-out)';
    } else {
      this.fillCircle.setAttribute('stroke-dashoffset', String(offset));
    }
  }
}
