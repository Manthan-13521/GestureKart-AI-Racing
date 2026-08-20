import { ModalSystem } from '../core/ModalSystem';
import { Component } from '../core/Component';

export interface ModalOptions {
  title?: string;
  dismissible?: boolean;
  onClose?: () => void;
}

/**
 * Modal component wrapping ModalSystem. Provides a structured overlay container.
 */
export class Modal extends Component<HTMLDivElement> {
  private readonly header: HTMLElement;
  private readonly body: HTMLElement;
  private readonly modal: ModalSystem;
  private done = false;

  constructor(opts: ModalOptions = {}) {
    super('div', 'modal');

    this.modal = ModalSystem.getInstance();

    const content = document.createElement('div');
    content.className = 'modal-content';

    if (opts.title) {
      this.header = document.createElement('div');
      this.header.className = 'modal-header';
      const h = document.createElement('h3');
      h.className = 'modal-title';
      h.textContent = opts.title;
      this.header.appendChild(h);
      content.appendChild(this.header);
    } else {
      this.header = document.createElement('div');
    }

    this.body = document.createElement('div');
    this.body.className = 'modal-body';
    content.appendChild(this.body);

    this.el.appendChild(content);
  }

  open(opts: ModalOptions = {}): void {
    this.done = false;
    this.modal.open(this.el, {
      title: opts.title,
      dismissible: opts.dismissible !== false,
      onClose: () => {
        if (!this.done) {
          this.done = true;
          opts.onClose?.();
        }
      },
    });
  }

  close(): void {
    if (!this.done) {
      this.done = true;
      this.modal.close();
    }
  }

  getBody(): HTMLElement {
    return this.body;
  }
}
