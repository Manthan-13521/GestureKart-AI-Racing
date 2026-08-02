import { Component } from '../core/Component';
import { SoundHooks } from '../core/SoundHooks';

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'outline';
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
    this.el.classList.add(`btn--${variant}`, `btn--${size}`);
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
