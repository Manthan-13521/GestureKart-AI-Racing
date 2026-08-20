import { Component } from '../core/Component';
import { SoundHooks } from '../core/SoundHooks';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  sound?: boolean;
}

export class Button extends Component<HTMLButtonElement> {
  constructor(label: string, opts: ButtonOptions = {}) {
    super('button', 'btn');
    const { variant = 'primary', size = 'md', icon, sound = true } = opts;
    this.el.classList.add(`btn-${variant}`, `btn-${size}`);
    if (icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'btn-icon';
      iconEl.textContent = icon;
      this.el.appendChild(iconEl);
    }
    const text = document.createElement('span');
    text.className = 'btn-label';
    text.textContent = label;
    this.el.appendChild(text);
    if (sound) SoundHooks.attach(this.el);

    // Ripple effect
    this.el.addEventListener('click', (e) => this.createRipple(e));
  }

  private createRipple(event: MouseEvent): void {
    if (document.documentElement.dataset.reducedMotion === 'true') return;
    const rect = this.el.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const size = Math.max(this.el.clientWidth, this.el.clientHeight);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    this.el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  set label(value: string) {
    this.el.querySelector('.btn-label')!.textContent = value;
  }

  set disabled(value: boolean) {
    this.el.disabled = value;
    this.el.classList.toggle('is-disabled', value);
  }

  get disabled(): boolean {
    return this.el.disabled;
  }
}
