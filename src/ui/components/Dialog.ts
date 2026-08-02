import { ModalSystem } from '../core/ModalSystem';
import { SoundHooks } from '../core/SoundHooks';

export interface DialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  dismissible?: boolean;
}

/**
 * Promise-based confirm dialog built on the ModalSystem. Resolves `true`
 * on confirm, `false` on cancel / backdrop / ESC.
 */
export function showDialog(opts: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const content = document.createElement('div');
    content.className = 'dialog';

    if (opts.message) {
      const message = document.createElement('p');
      message.className = 'dialog-message';
      message.textContent = opts.message;
      content.appendChild(message);
    }

    const actions = document.createElement('div');
    actions.className = 'dialog-actions';

    const cancel = document.createElement('button');
    cancel.className = 'btn btn--ghost';
    cancel.textContent = opts.cancelLabel ?? 'Cancel';
    cancel.addEventListener('click', () => {
      SoundHooks.back();
      finish(false);
    });
    actions.appendChild(cancel);

    const confirm = document.createElement('button');
    confirm.className = opts.danger ? 'btn btn--danger' : 'btn btn--primary';
    confirm.textContent = opts.confirmLabel ?? 'Confirm';
    confirm.addEventListener('click', () => {
      SoundHooks.confirm();
      finish(true);
    });
    actions.appendChild(confirm);
    content.appendChild(actions);

    const modal = ModalSystem.getInstance();
    let done = false;
    function finish(result: boolean): void {
      if (done) return;
      done = true;
      modal.close();
      resolve(result);
    }

    modal.open(content, {
      title: opts.title,
      dismissible: opts.dismissible !== false,
      onClose: () => finish(false),
    });
  });
}
