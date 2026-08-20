import { Component } from '../core/Component';
import type { TransitionKind } from '../core/TransitionSystem';
import { FocusNavigator } from '../core/FocusNavigator';
import { AnimationSystem, type AnimKind } from '../core/AnimationSystem';

/**
 * Base class for navigable screens with entrance/exit choreography and stagger support.
 */
export abstract class Screen extends Component<HTMLElement> {
  screenId: string;
  params: Record<string, unknown> = {};
  onBack: (() => void) | null = null;

  private focusNavigator: FocusNavigator | null = null;
  private entrancePlayed = false;

  constructor(id: string) {
    super('section', 'screen');
    this.screenId = id;
    this.el.setAttribute('data-screen', id);
    this.el.setAttribute('aria-hidden', 'true');
  }

  protected abstract build(params: Record<string, unknown>): void;

  protected transition(): TransitionKind {
    return 'fade';
  }

  onBeforeEnter(): void {}

  mount(params: Record<string, unknown>): void {
    this.params = params;
    this.build(params);
    this.el.setAttribute('aria-hidden', 'false');
    this.focusNavigator?.dispose();
    this.focusNavigator = new FocusNavigator(this.el, { onCancel: () => this.onBack?.() });
    this.focusNavigator.bind();
    this.focusNavigator.focusFirst();
    this.playEntrance();
  }

  onAfterEnter(): void {}

  screenWake(_params: Record<string, unknown>): void {
    this.el.setAttribute('aria-hidden', 'false');
    this.focusNavigator?.focusFirst();
  }

  refreshFocus(): void {
    this.focusNavigator?.focusFirst();
  }

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

  /** Play entrance choreography: stagger children with --i index. */
  playEntrance(): void {
    if (this.entrancePlayed) return;
    this.entrancePlayed = true;

    // Find stagger children
    const staggerChildren = this.el.querySelectorAll<HTMLElement>('.stagger-child');
    staggerChildren.forEach((child, i) => {
      child.style.setProperty('--i', String(i));
    });

    // Play screen entrance animation
    AnimationSystem.play(this.el, 'fade-in', { duration: 200 });
  }

  /** Play exit animation. */
  async playExit(): Promise<void> {
    return new Promise((resolve) => {
      this.el.classList.add('screen-exit');
      this.el.addEventListener('animationend', () => resolve(), { once: true });
    });
  }

  /** Stagger children of a container. */
  stagger(
    container: HTMLElement,
    animation: AnimKind = 'slide-in-up',
    options: { duration?: number; delay?: number } = {}
  ): void {
    const children = container.querySelectorAll<HTMLElement>(':scope > *');
    children.forEach((child, i) => {
      child.style.setProperty('--i', String(i));
      AnimationSystem.play(child, animation, {
        duration: options.duration || 280,
        delay: options.delay || i * 60,
      });
    });
  }
}
