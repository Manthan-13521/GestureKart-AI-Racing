import { Component } from '../core/Component';
import type { TransitionKind } from '../core/TransitionSystem';

/**
 * Base class for navigable screens. Screens own their DOM subtree and are
 * mounted into the navigation host by NavigationSystem.
 */
export abstract class Screen extends Component<HTMLElement> {
  screenId: string;
  params: Record<string, unknown> = {};

  constructor(id: string) {
    super('section', 'screen');
    this.screenId = id;
    this.el.setAttribute('data-screen', id);
    this.el.setAttribute('aria-hidden', 'true');
  }

  /** Build the screen's DOM inside `this.el`. */
  protected abstract build(params: Record<string, unknown>): void;

  /** Default transition used when this screen is entered. */
  protected transition(): TransitionKind {
    return 'fade';
  }

  /** Called by NavigationSystem before mounting. */
  onBeforeEnter(): void {}

  /** Mounts the screen into the navigation host. */
  mount(params: Record<string, unknown>): void {
    this.params = params;
    this.build(params);
    this.el.setAttribute('aria-hidden', 'false');
    this.focusFirst();
  }

  /** Called by NavigationSystem after enter animation completes. */
  onAfterEnter(): void {}

  /** Called when navigation returns to an existing screen instance. */
  screenWake(_params: Record<string, unknown>): void {
    this.el.setAttribute('aria-hidden', 'false');
    this.focusFirst();
  }

  /** Move focus into the screen so keyboard users land on usable content. */
  private focusFirst(): void {
    const target = this.el.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (target) {
      target.focus({ preventScroll: true });
      return;
    }
    this.el.tabIndex = -1;
    this.el.focus({ preventScroll: true });
  }

  getTransition(): TransitionKind {
    return this.transition();
  }
}
