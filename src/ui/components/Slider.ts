import { Component } from '../core/Component';
import { SoundHooks } from '../core/SoundHooks';

export interface SliderOptions {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  label?: string;
  onChange?: (value: number) => void;
}

/**
 * Accessible range slider with label and value display.
 */
export class Slider extends Component<HTMLDivElement> {
  private readonly range: HTMLInputElement;
  private readonly valueEl: HTMLElement;
  private _value: number;

  constructor(opts: SliderOptions = {}) {
    super('div', 'slider');
    const { min = 0, max = 100, step = 1, value = 50, label, onChange } = opts;
    this._value = value;

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'slider-label';
      labelEl.textContent = label;
      this.el.appendChild(labelEl);
    }

    const row = document.createElement('div');
    row.className = 'slider-row';

    this.range = document.createElement('input');
    this.range.type = 'range';
    this.range.className = 'slider-range';
    this.range.min = String(min);
    this.range.max = String(max);
    this.range.step = String(step);
    this.range.value = String(value);
    if (label) this.range.setAttribute('aria-label', label);

    this.valueEl = document.createElement('span');
    this.valueEl.className = 'slider-value';
    this.valueEl.textContent = String(value);

    row.appendChild(this.range);
    row.appendChild(this.valueEl);
    this.el.appendChild(row);

    SoundHooks.attach(this.range);

    this.range.addEventListener('input', () => {
      this._value = Number(this.range.value);
      this.valueEl.textContent = String(this._value);
      onChange?.(this._value);
    });
  }

  get value(): number {
    return this._value;
  }

  set value(v: number) {
    this._value = v;
    this.range.value = String(v);
    this.valueEl.textContent = String(v);
  }
}
