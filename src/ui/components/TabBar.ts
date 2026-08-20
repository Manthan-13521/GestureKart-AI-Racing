import { Component } from '../core/Component';

export interface TabBarOptions {
  tabs?: Array<{ id: string; label: string; icon?: string }>;
  active?: string;
  onChange?: (id: string) => void;
}

export class TabBar extends Component<HTMLElement> {
  private activeId: string;
  private onChange: ((id: string) => void) | null;
  private tabs: Map<string, HTMLButtonElement> = new Map();

  constructor(opts: TabBarOptions = {}) {
    super('div', 'tab-bar');
    this.activeId = opts.active ?? (opts.tabs?.length ? opts.tabs[0].id : '') ?? '';
    this.onChange = opts.onChange ?? null;

    for (const tab of opts.tabs ?? []) {
      const btn = document.createElement('button');
      btn.className = 'tab';
      btn.dataset.tabId = tab.id;
      btn.type = 'button';

      if (tab.icon) {
        const icon = document.createElement('span');
        icon.className = 'tab-icon';
        icon.textContent = tab.icon;
        btn.appendChild(icon);
      }
      const label = document.createElement('span');
      label.className = 'tab-label';
      label.textContent = tab.label;
      btn.appendChild(label);

      btn.addEventListener('click', () => this.setActive(tab.id));
      this.tabs.set(tab.id, btn);
      this.el.appendChild(btn);
    }

    this.setActive(this.activeId);
  }

  setActive(id: string): void {
    if (!this.tabs.has(id)) return;
    this.activeId = id;
    for (const [tid, btn] of this.tabs) {
      btn.classList.toggle('active', tid === id);
    }
    this.onChange?.(id);
  }

  getActive(): string {
    return this.activeId;
  }
}
