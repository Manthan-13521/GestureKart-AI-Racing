import { Component } from '../core/Component';

export interface StatBlockOptions {
  label: string;
  value: string | number;
  delta?: { value: number; positive: boolean };
  icon?: string;
}

export class StatBlock extends Component<HTMLDivElement> {
  private valueEl: HTMLElement;

  constructor(opts: StatBlockOptions) {
    super('div', 'stat-block');
    const { label, value, delta, icon } = opts;

    if (icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'stat-icon';
      iconEl.textContent = icon;
      iconEl.setAttribute('aria-hidden', 'true');
      this.el.appendChild(iconEl);
    }

    const content = document.createElement('div');
    content.className = 'stat-content';

    const labelEl = document.createElement('div');
    labelEl.className = 'stat-label';
    labelEl.textContent = label;

    this.valueEl = document.createElement('div');
    this.valueEl.className = 'stat-value';
    this.valueEl.textContent = String(value);
    this.valueEl.style.fontVariantNumeric = 'tabular-nums';

    content.append(labelEl, this.valueEl);
    this.el.appendChild(content);

    if (delta) {
      const deltaEl = document.createElement('div');
      deltaEl.className = `stat-delta ${delta.positive ? 'delta-positive' : 'delta-negative'}`;
      deltaEl.textContent = `${delta.positive ? '+' : ''}${delta.value}`;
      deltaEl.setAttribute('aria-label', delta.positive ? 'increased' : 'decreased');
      this.el.appendChild(deltaEl);
    }
  }

  setValue(value: string | number): void {
    this.valueEl.textContent = String(value);
  }
}
