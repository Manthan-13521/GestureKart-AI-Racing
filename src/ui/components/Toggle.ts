import { Component } from '../core/Component';
import { SoundHooks } from '../core/SoundHooks';

export interface ToggleOptions {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

/**
 * Accessible toggle switch. Uses a hidden checkbox for semantics.
 */
export class Toggle extends Component<HTMLDivElement> {
  private _checked: boolean;
  private readonly track: HTMLElement;
  private readonly thumb: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly labelEl: HTMLElement | null = null;

  constructor(opts: ToggleOptions = {}) {
    super('div', 'toggle');
    const { label, checked = false, disabled = false, onChange } = opts;
    this._checked = checked;

    this.input = document.createElement('input');
    this.input.type = 'checkbox';
    this.input.className = 'toggle-input';
    this.input.checked = checked;
    this.input.disabled = disabled;
    this.input.setAttribute('role', 'switch');
    this.input.setAttribute('aria-checked', String(checked));
    if (label) this.input.setAttribute('aria-label', label);
    this.input.style.position = 'absolute';
    this.input.style.opacity = '0';
    this.input.style.pointerEvents = 'none';

    this.track = document.createElement('div');
    this.track.className = 'toggle-track';

    this.thumb = document.createElement('span');
    this.thumb.className = 'toggle-thumb';
    this.track.appendChild(this.thumb);

    this.el.style.position = 'relative';
    this.el.appendChild(this.input);
    this.el.appendChild(this.track);

    if (label) {
      const labelEl = document.createElement('span');
      labelEl.className = 'toggle-label';
      labelEl.textContent = label;
      this.el.appendChild(labelEl);
      this.labelEl = labelEl;
    }

    SoundHooks.attach(this.input);

    this.input.addEventListener('change', () => {
      this._checked = this.input.checked;
      this.input.setAttribute('aria-checked', String(this._checked));
      this.track.classList.toggle('toggle-checked', this._checked);
      onChange?.(this._checked);
    });

    this.track.classList.toggle('toggle-checked', checked);
  }

  get checked(): boolean {
    return this._checked;
  }

  set checked(value: boolean) {
    this._checked = value;
    this.input.checked = value;
    this.input.setAttribute('aria-checked', String(value));
    this.track.classList.toggle('toggle-checked', value);
  }
}
