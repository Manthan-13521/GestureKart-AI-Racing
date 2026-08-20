import { Component } from '../core/Component';
import { isMotionReduced } from '../core/AnimationSystem';

export type LineStyle = 'straight' | 'curve' | 'pulse' | 'glow';
export type LineRole = 'connector' | 'accent' | 'progress' | 'selection' | 'decoration';

export interface RacingLineOptions {
  style?: LineStyle;
  role?: LineRole;
  color?: string;
  width?: number;
  animated?: boolean;
}

/**
 * Racing Line — the shared visual grammar of Virtual Steering.
 *
 * A reusable SVG-based line system that connects UI elements,
 * emphasizes selection, and provides screen transition animations.
 *
 * Design principles (§39):
 * - Thin, precise, restrained, semantic
 * - Never interferes with input
 * - Never reduces readability
 * - Supports screen entry/exit, contextual transitions, selection emphasis
 */
export class RacingLine extends Component<HTMLDivElement> {
  private svg: SVGSVGElement;
  private path: SVGPathElement;
  private glowPath: SVGPathElement | null = null;
  private readonly style: LineStyle;
  private readonly role: LineRole;
  private readonly lineColor: string;
  private readonly lineWidth: number;
  private pathLength = 0;

  constructor(opts: RacingLineOptions = {}) {
    super('div', 'racing-line');
    const {
      style = 'straight',
      role = 'connector',
      color = 'var(--accent-primary)',
      width = 2,
      animated = true,
    } = opts;

    this.style = style;
    this.role = role;
    this.lineColor = color;
    this.lineWidth = width;

    this.el.style.position = 'absolute';
    this.el.style.top = '0';
    this.el.style.left = '0';
    this.el.style.width = '100%';
    this.el.style.height = '100%';
    this.el.style.pointerEvents = 'none';
    this.el.style.zIndex = '50';
    this.el.style.overflow = 'visible';

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.style.position = 'absolute';
    this.svg.style.top = '0';
    this.svg.style.left = '0';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.pointerEvents = 'none';
    this.el.appendChild(this.svg);

    this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.path.setAttribute('fill', 'none');
    this.path.setAttribute('stroke', color);
    this.path.setAttribute('stroke-width', String(width));
    this.path.setAttribute('stroke-linecap', 'round');
    this.path.setAttribute('stroke-linejoin', 'round');
    if (animated) {
      this.path.setAttribute('stroke-dasharray', '1000');
      this.path.setAttribute('stroke-dashoffset', '1000');
    }
    this.path.classList.add('racing-line-path');
    this.svg.appendChild(this.path);

    if (style === 'glow' || role === 'selection') {
      this.glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      this.glowPath.setAttribute('fill', 'none');
      this.glowPath.setAttribute('stroke', color);
      this.glowPath.setAttribute('stroke-width', String(width + 4));
      this.glowPath.setAttribute('stroke-linecap', 'round');
      this.glowPath.setAttribute('stroke-linejoin', 'round');
      this.glowPath.setAttribute('opacity', '0.3');
      this.glowPath.setAttribute('filter', 'blur(4px)');
      if (animated) {
        this.glowPath.setAttribute('stroke-dasharray', '1000');
        this.glowPath.setAttribute('stroke-dashoffset', '1000');
      }
      this.glowPath.classList.add('racing-line-glow');
      this.svg.insertBefore(this.glowPath, this.path);
    }
  }

  /**
   * Draw a line between two points with optional curve control.
   */
  draw(
    from: { x: number; y: number },
    to: { x: number; y: number },
    controlPoint?: { x: number; y: number }
  ): void {
    let d: string;
    if (controlPoint) {
      d = `M ${from.x} ${from.y} Q ${controlPoint.x} ${controlPoint.y} ${to.x} ${to.y}`;
    } else if (this.style === 'curve') {
      const midX = (from.x + to.x) / 2;
      const midY = Math.min(from.y, to.y) - 30;
      d = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
    } else {
      d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }

    this.path.setAttribute('d', d);
    if (this.glowPath) this.glowPath.setAttribute('d', d);

    try {
      this.pathLength = this.path.getTotalLength();
    } catch {
      this.pathLength = 1000;
    }

    const dashArray = String(this.pathLength);
    this.path.setAttribute('stroke-dasharray', dashArray);
    this.path.setAttribute('stroke-dashoffset', String(this.pathLength));
    if (this.glowPath) {
      this.glowPath.setAttribute('stroke-dasharray', dashArray);
      this.glowPath.setAttribute('stroke-dashoffset', String(this.pathLength));
    }
  }

  /**
   * Draw a polyline through multiple points.
   */
  drawPolyline(points: Array<{ x: number; y: number }>): void {
    if (points.length < 2) return;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    this.path.setAttribute('d', d);
    if (this.glowPath) this.glowPath.setAttribute('d', d);

    try {
      this.pathLength = this.path.getTotalLength();
    } catch {
      this.pathLength = 1000;
    }

    const dashArray = String(this.pathLength);
    this.path.setAttribute('stroke-dasharray', dashArray);
    this.path.setAttribute('stroke-dashoffset', String(this.pathLength));
    if (this.glowPath) {
      this.glowPath.setAttribute('stroke-dasharray', dashArray);
      this.glowPath.setAttribute('stroke-dashoffset', String(this.pathLength));
    }
  }

  /**
   * Animate the line drawing in.
   */
  async animateDraw(duration = 400): Promise<void> {
    if (isMotionReduced()) {
      this.path.setAttribute('stroke-dashoffset', '0');
      if (this.glowPath) this.glowPath.setAttribute('stroke-dashoffset', '0');
      return;
    }
    const dur = this.role === 'decoration' ? duration * 0.6 : duration;
    this.path.style.transition = `stroke-dashoffset ${dur}ms var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1))`;
    this.path.setAttribute('stroke-dashoffset', '0');
    if (this.glowPath) {
      this.glowPath.style.transition = `stroke-dashoffset ${dur}ms var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1))`;
      this.glowPath.setAttribute('stroke-dashoffset', '0');
    }
    await new Promise((resolve) => setTimeout(resolve, dur));
  }

  /**
   * Animate the line retracting.
   */
  async animateRetract(duration = 200): Promise<void> {
    if (isMotionReduced()) {
      this.clear();
      return;
    }
    this.path.style.transition = `stroke-dashoffset ${duration}ms var(--ease-in, cubic-bezier(0.55, 0.06, 0.68, 0.19))`;
    this.path.setAttribute('stroke-dashoffset', String(this.pathLength || 1000));
    if (this.glowPath) {
      this.glowPath.style.transition = `stroke-dashoffset ${duration}ms var(--ease-in, cubic-bezier(0.55, 0.06, 0.68, 0.19))`;
      this.glowPath.setAttribute('stroke-dashoffset', String(this.pathLength || 1000));
    }
    await new Promise((resolve) => setTimeout(resolve, duration));
  }

  /**
   * Pulse animation for emphasis.
   */
  async pulse(count = 2, interval = 300): Promise<void> {
    if (isMotionReduced()) return;
    for (let i = 0; i < count; i++) {
      this.path.style.opacity = '0.3';
      if (this.glowPath) this.glowPath.style.opacity = '0.6';
      await new Promise((resolve) => setTimeout(resolve, interval / 2));
      this.path.style.opacity = '1';
      if (this.glowPath) this.glowPath.style.opacity = '0.3';
      await new Promise((resolve) => setTimeout(resolve, interval / 2));
    }
    this.path.style.opacity = '1';
    if (this.glowPath) this.glowPath.style.opacity = '0.3';
  }

  /**
   * Connect two DOM elements with a racing line.
   */
  connectElements(
    from: HTMLElement,
    to: HTMLElement,
    options: {
      fromSide?: 'right' | 'left' | 'bottom' | 'top';
      toSide?: 'left' | 'right' | 'top' | 'bottom';
    } = {}
  ): void {
    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();
    const containerRect = this.el.parentElement?.getBoundingClientRect() ?? { left: 0, top: 0 };

    const getPoint = (rect: DOMRect, side: string): { x: number; y: number } => {
      switch (side) {
        case 'right':
          return { x: rect.right - containerRect.left, y: rect.top + rect.height / 2 - containerRect.top };
        case 'left':
          return { x: rect.left - containerRect.left, y: rect.top + rect.height / 2 - containerRect.top };
        case 'bottom':
          return { x: rect.left + rect.width / 2 - containerRect.left, y: rect.bottom - containerRect.top };
        case 'top':
          return { x: rect.left + rect.width / 2 - containerRect.left, y: rect.top - containerRect.top };
        default:
          return { x: rect.right - containerRect.left, y: rect.top + rect.height / 2 - containerRect.top };
      }
    };

    const fromPoint = getPoint(fromRect, options.fromSide ?? 'right');
    const toPoint = getPoint(toRect, options.toSide ?? 'left');

    this.draw(fromPoint, toPoint);
  }

  clear(): void {
    this.path.removeAttribute('d');
    this.path.setAttribute('stroke-dashoffset', String(this.pathLength || 1000));
    if (this.glowPath) {
      this.glowPath.removeAttribute('d');
      this.glowPath.setAttribute('stroke-dashoffset', String(this.pathLength || 1000));
    }
  }
}
