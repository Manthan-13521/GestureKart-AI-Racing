import { Component } from '../core/Component';
import type { TransitionKind } from '../core/TransitionSystem';
import { FocusNavigator } from '../core/FocusNavigator';

/**
 * Base class for navigable screens. Screens own their DOM subtree and are
 * mounted into the navigation host by NavigationSystem. Each screen gets a
 * FocusNavigator scoped to its root so arrow/Enter/Escape navigation works
 * consistently across the whole app (P0.4).
 */
export abstract class Screen extends Component<HTMLElement> {
  screenId: string;
  params: Record<string, unknown> = {};
  /** Back behavior invoked by Escape (wired per screen in flow.ts). */
  onBack: (() => void) | null = null;

  private focusNavigator: FocusNavigator | null = null;

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
    this.focusNavigator?.dispose();
    this.focusNavigator = new FocusNavigator(this.el, { onCancel: () => this.onBack?.() });
    this.focusNavigator.bind();
    this.focusNavigator.focusFirst();
  }

  /** Called by NavigationSystem after enter animation completes. */
  onAfterEnter(): void {}

  /** Called when navigation returns to an existing screen instance. */
  screenWake(_params: Record<string, unknown>): void {
    this.el.setAttribute('aria-hidden', 'false');
    this.focusNavigator?.focusFirst();
  }

  /** Re-scan the current DOM for focusable controls. */
  refreshFocus(): void {
    this.focusNavigator?.focusFirst();
  }

  /** The control the navigator currently considers focused (tests/tools). */
  get focused(): HTMLElement | null {
    return this.focusNavigator?.active ?? null;
  }

  override dispose(): void {
    this.focusNavigator?.dispose();
    this.focusNavigator = null;
    super.dispose();
  }

  getTransition(): TransitionKind {
    return this.transition();
  }
}
