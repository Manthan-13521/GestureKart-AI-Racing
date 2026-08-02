/**
 * Base UI component. Owns one root element and provides a minimal
 * lifecycle (mount/dispose) with delegated event binding.
 */
export abstract class Component<T extends HTMLElement = HTMLElement> {
  readonly el: T;
  private delegated: Array<{ el: HTMLElement; type: string; fn: EventListener }> = [];

  constructor(tag: string, className: string) {
    this.el = document.createElement(tag) as T;
    if (className) this.el.className = className;
  }

  /** Attach a delegated listener scoped to descendants matching `selector`. */
  protected on<K extends keyof HTMLElementEventMap>(
    type: K,
    selector: string,
    handler: (event: HTMLElementEventMap[K]) => void
  ): void {
    const fn: EventListener = (e) => {
      const target = e.target as Element | null;
      if (target && target.closest(selector)) {
        handler(e as HTMLElementEventMap[K]);
      }
    };
    this.el.addEventListener(type, fn);
    this.delegated.push({ el: this.el, type, fn });
  }

  show(): void {
    this.el.hidden = false;
  }

  hide(): void {
    this.el.hidden = true;
  }

  dispose(): void {
    for (const { el, type, fn } of this.delegated) {
      el.removeEventListener(type, fn);
    }
    this.delegated = [];
    this.el.remove();
  }
}
