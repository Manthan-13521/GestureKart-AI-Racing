import type { Screen } from '../components/Screen';
import { TransitionSystem, type TransitionKind } from './TransitionSystem';

export interface NavigateOptions {
  transition?: TransitionKind;
  replace?: boolean;
}

export interface ScreenFactory {
  create(): Screen;
}

/**
 * Stack-based screen router. Screens register under an id and are mounted
 * into a single host element; transitions are handled by TransitionSystem.
 */
export class NavigationSystem {
  private registry = new Map<string, ScreenFactory>();
  private stack: Screen[] = [];
  private readonly mount: HTMLElement;
  private currentId: string | null = null;
  private navigating = false;

  constructor(mount: HTMLElement) {
    this.mount = mount;
  }

  register(id: string, factory: ScreenFactory): void {
    this.registry.set(id, factory);
  }

  get current(): string | null {
    return this.currentId;
  }

  get currentScreen(): Screen | null {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }

  get depth(): number {
    return this.stack.length;
  }

  get canGoBack(): boolean {
    return this.stack.length > 1;
  }

  async go(id: string, params: Record<string, unknown> = {}, opts: NavigateOptions = {}): Promise<void> {
    const factory = this.registry.get(id);
    if (!factory) throw new Error(`NavigationSystem: unknown screen "${id}"`);
    if (this.navigating) return;
    this.navigating = true;
    try {
      const screen = factory.create();
      screen.onBeforeEnter();
      screen.mount(params);
      const transition = opts.transition ?? screen.getTransition();
      if (opts.replace) {
        await TransitionSystem.swap(this.mount, screen.el, {
          kind: transition,
          direction: 'back',
        });
        this.stack[this.stack.length - 1]?.dispose();
        this.stack.pop();
      } else {
        await TransitionSystem.swap(this.mount, screen.el, { kind: transition });
      }
      screen.onAfterEnter();
      this.stack.push(screen);
      this.currentId = id;
      // Focus is only delivered once the incoming screen is actually attached
      // and visible (mount() runs before the DOM swap), so re-assert it after
      // the transition completes. Fixes focus falling to <body> on every nav.
      screen.refreshFocus();
    } finally {
      this.navigating = false;
    }
  }

  /** Navigate to a screen that already exists deeper in the stack. */
  async back(params: Record<string, unknown> = {}, opts: NavigateOptions = {}): Promise<void> {
    if (!this.canGoBack) return;
    const previous = this.stack[this.stack.length - 2];
    const exiting = this.stack[this.stack.length - 1];
    if (!previous) return;
    if (this.navigating) return;
    this.navigating = true;
    try {
      previous.screenWake(params);
      await TransitionSystem.swap(this.mount, previous.el, {
        kind: opts.transition ?? 'fade',
        direction: 'back',
      });
      exiting.dispose();
      this.stack.pop();
      this.currentId = previous.screenId ?? this.currentId;
      // Re-assert focus after the swap restores the previous screen's visibility.
      previous.refreshFocus();
    } finally {
      this.navigating = false;
    }
  }

  async reset(id: string, params: Record<string, unknown> = {}, opts: NavigateOptions = {}): Promise<void> {
    while (this.stack.length > 0) {
      this.stack.pop()?.dispose();
    }
    this.mount.replaceChildren();
    this.currentId = null;
    await this.go(id, params, { ...opts, replace: false });
  }

  dispose(): void {
    for (const screen of this.stack) {
      screen.dispose();
    }
    this.stack = [];
    this.registry.clear();
    this.mount.replaceChildren();
  }
}
