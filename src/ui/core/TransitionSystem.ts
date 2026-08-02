import { AnimationSystem, type AnimKind } from './AnimationSystem';

export type TransitionKind = 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'scale' | 'blur';

const ENTER_KIND: Record<TransitionKind, AnimKind> = {
  fade: 'fade-in',
  'slide-left': 'slide-in-left',
  'slide-right': 'slide-in-right',
  'slide-up': 'slide-in-up',
  scale: 'scale-in',
  blur: 'blur-in',
};

const EXIT_KIND: Record<TransitionKind, AnimKind> = {
  fade: 'fade-out',
  'slide-left': 'slide-out-right',
  'slide-right': 'slide-out-left',
  'slide-up': 'fade-out',
  scale: 'scale-out',
  blur: 'blur-out',
};

export type ExitDirection = 'forward' | 'back';

/**
 * Orchestrates screen enter/exit animation pairs so that navigation feels
 * continuous rather than abrupt.
 */
export const TransitionSystem = {
  async enter(el: HTMLElement, kind: TransitionKind = 'fade'): Promise<void> {
    await AnimationSystem.play(el, ENTER_KIND[kind]);
  },

  async exit(el: HTMLElement, kind: TransitionKind = 'fade'): Promise<void> {
    await AnimationSystem.play(el, EXIT_KIND[kind]);
  },

  /**
   * Fade the outgoing screen out, swap the mount point, fade the incoming
   * screen in. Returns when both are done.
   */
  async swap(
    mount: HTMLElement,
    incoming: HTMLElement,
    opts: { kind?: TransitionKind; direction?: ExitDirection } = {}
  ): Promise<void> {
    const kind = opts.kind ?? 'fade';
    const direction = opts.direction ?? 'forward';
    const exitKind: TransitionKind =
      direction === 'back' ? (kind === 'slide-left' ? 'slide-right' : kind) : kind;
    const outgoing = mount.firstElementChild as HTMLElement | null;
    const tasks: Promise<void>[] = [];

    if (outgoing) tasks.push(this.exit(outgoing, exitKind));
    tasks.push(
      new Promise<void>((resolve) => {
        setTimeout(() => {
          incoming.style.visibility = 'hidden';
          mount.replaceChildren(incoming);
          resolve();
        }, 0);
      })
    );
    await Promise.all(tasks);
    incoming.style.visibility = '';
    await this.enter(incoming, kind);
  },
};
