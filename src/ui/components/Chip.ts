import { Component } from '../core/Component';

export interface ChipOptions {
  label: string;
  icon?: string;
  selected?: boolean;
  disabled?: boolean;
}

export class Chip extends Component<HTMLButtonElement> {
  private _selected: boolean;

  constructor(opts: ChipOptions) {
    super('button', 'chip');
    const { label, icon, selected = false, disabled = false } = opts;
    this._selected = selected;

    this.el.type = 'button';
    this.el.classList.toggle('chip-selected', selected);
    this.el.classList.toggle('chip-disabled', disabled);
    this.el.disabled = disabled;
    this.el.setAttribute('role', 'option');
    this.el.setAttribute('aria-selected', String(selected));

    if (icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'chip-icon';
      iconEl.textContent = icon;
      iconEl.setAttribute('aria-hidden', 'true');
      this.el.appendChild(iconEl);
    }

    const text = document.createElement('span');
    text.className = 'chip-label';
    text.textContent = label;
    this.el.appendChild(text);

    this.el.addEventListener('click', () => {
      if (!this.el.disabled) {
        this.selected = !this._selected;
      }
    });
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(value: boolean) {
    this._selected = value;
    this.el.classList.toggle('chip-selected', value);
    this.el.setAttribute('aria-selected', String(value));
  }
}
