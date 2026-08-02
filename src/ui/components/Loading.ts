import { Component } from '../core/Component';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingOptions {
  label?: string;
  spinner?: SpinnerSize;
  progress?: boolean;
}

/**
 * Loading indicators: spinner, optional progress bar, optional caption.
 * The progress bar can be driven externally via `setProgress`.
 */
export class Loading extends Component<HTMLElement> {
  private readonly bar: HTMLElement | null = null;
  private readonly labelEl: HTMLElement | null = null;

  constructor(opts: LoadingOptions = {}) {
    super('div', 'loading');
    const spinner = document.createElement('div');
    spinner.className = `loading-spinner loading-spinner--${opts.spinner ?? 'md'}`;
    spinner.setAttribute('role', 'progressbar');
    spinner.setAttribute('aria-valuetext', 'Loading');
    this.el.appendChild(spinner);
    if (opts.progress) {
      const track = document.createElement('div');
      track.className = 'loading-track';
      this.bar = document.createElement('div');
      this.bar.className = 'loading-bar';
      track.appendChild(this.bar);
      this.el.appendChild(track);
    }
    if (opts.label) {
      this.labelEl = document.createElement('p');
      this.labelEl.className = 'loading-label';
      this.labelEl.textContent = opts.label;
      this.el.appendChild(this.labelEl);
    }
  }

  setProgress(ratio: number): void {
    if (!this.bar) return;
    this.bar.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  }

  setLabel(text: string): void {
    if (this.labelEl) this.labelEl.textContent = text;
  }
}
