import { Component } from '../core/Component';
import { SoundHooks } from '../core/SoundHooks';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownOptions {
  options: DropdownOption[];
  value?: string;
  label?: string;
  onChange?: (value: string) => void;
}

/**
 * Accessible select dropdown.
 */
export class Dropdown extends Component<HTMLDivElement> {
  private readonly select: HTMLSelectElement;

  constructor(opts: DropdownOptions) {
    super('div', 'dropdown');
    const { options, value, label, onChange } = opts;

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'dropdown-label';
      labelEl.textContent = label;
      this.el.appendChild(labelEl);
    }

    const wrap = document.createElement('div');
    wrap.className = 'dropdown-select-wrap';

    this.select = document.createElement('select');
    this.select.className = 'dropdown-select';
    if (label) this.select.setAttribute('aria-label', label);

    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      this.select.appendChild(option);
    }

    if (value) this.select.value = value;

    wrap.appendChild(this.select);
    this.el.appendChild(wrap);

    SoundHooks.attach(this.select);

    this.select.addEventListener('change', () => {
      onChange?.(this.select.value);
    });
  }

  get value(): string {
    return this.select.value;
  }

  set value(v: string) {
    this.select.value = v;
  }
}
