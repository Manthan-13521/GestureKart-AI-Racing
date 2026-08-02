import { Component } from '../core/Component';

export interface PanelOptions {
  title?: string;
  eyebrow?: string;
  footer?: boolean;
}

/**
 * Section container with optional header (eyebrow + title) and footer.
 * Used to group settings categories and content blocks.
 */
export class Panel extends Component<HTMLElement> {
  readonly footer: HTMLElement;

  constructor(opts: PanelOptions = {}) {
    super('section', 'panel');
    if (opts.eyebrow) {
      const eyebrow = document.createElement('span');
      eyebrow.className = 'panel-eyebrow';
      eyebrow.textContent = opts.eyebrow;
      this.el.appendChild(eyebrow);
    }
    if (opts.title) {
      const title = document.createElement('h2');
      title.className = 'panel-title';
      title.textContent = opts.title;
      this.el.appendChild(title);
    }
    const content = document.createElement('div');
    content.className = 'panel-content';
    this.el.appendChild(content);
    this.body = content;

    this.footer = document.createElement('footer');
    this.footer.className = 'panel-footer';
    if (opts.footer) this.el.appendChild(this.footer);
  }

  private body: HTMLElement;

  addChild(child: HTMLElement): void {
    this.body.appendChild(child);
  }

  clear(): void {
    this.body.replaceChildren();
  }
}
