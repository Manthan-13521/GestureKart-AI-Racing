import { AnimationSystem, type AnimKind } from './AnimationSystem';

export type TransitionKind =
  'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'scale' | 'blur' | 'shared-element';

const ENTER_KIND: Record<Exclude<TransitionKind, 'shared-element'>, AnimKind> = {
  fade: 'fade-in',
  'slide-left': 'slide-in-left',
  'slide-right': 'slide-in-right',
  'slide-up': 'slide-in-up',
  'slide-down': 'slide-in-down',
  scale: 'scale-in',
  blur: 'blur-in',
};

const EXIT_KIND: Record<Exclude<TransitionKind, 'shared-element'>, AnimKind> = {
  fade: 'fade-out',
  'slide-left': 'slide-out-right',
  'slide-right': 'slide-out-left',
  'slide-up': 'slide-out-down',
  'slide-down': 'slide-out-up',
  scale: 'scale-out',
  blur: 'blur-out',
};

export type ExitDirection = 'forward' | 'back';

export const TransitionSystem = {
  async enter(el: HTMLElement, kind: TransitionKind = 'fade'): Promise<void> {
    if (kind === 'shared-element') {
      await AnimationSystem.play(el, 'fade-in', { duration: 280 });
      return;
    }
    await AnimationSystem.play(el, ENTER_KIND[kind]);
  },

  async exit(el: HTMLElement, kind: TransitionKind = 'fade'): Promise<void> {
    if (kind === 'shared-element') {
      await AnimationSystem.play(el, 'fade-out', { duration: 200 });
      return;
    }
    await AnimationSystem.play(el, EXIT_KIND[kind]);
  },

  async swap(
    mount: HTMLElement,
    incoming: HTMLElement,
    opts: { kind?: TransitionKind; direction?: ExitDirection; sharedElement?: HTMLElement } = {}
  ): Promise<void> {
    const kind = opts.kind ?? 'fade';
    const direction = opts.direction ?? 'forward';

    if (kind === 'shared-element' && opts.sharedElement) {
      await this.swapSharedElement(mount, incoming, opts.sharedElement, direction);
      return;
    }

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

  async swapSharedElement(
    mount: HTMLElement,
    incoming: HTMLElement,
    sharedElement: HTMLElement,
    direction: ExitDirection
  ): Promise<void> {
    const outgoing = mount.firstElementChild as HTMLElement | null;
    if (!outgoing) {
      mount.replaceChildren(incoming);
      await this.enter(incoming, 'fade');
      return;
    }

    // Find the shared element in outgoing and incoming
    const outgoingShared = outgoing.querySelector(
      `[data-shared-id="${sharedElement.dataset.sharedId}"]`
    ) as HTMLElement | null;
    const incomingShared = incoming.querySelector(
      `[data-shared-id="${sharedElement.dataset.sharedId}"]`
    ) as HTMLElement | null;

    if (outgoingShared && incomingShared) {
      // Animate shared element from outgoing position to incoming position
      const outgoingRect = outgoingShared.getBoundingClientRect();
      const incomingRect = incomingShared.getBoundingClientRect();

      const dx = incomingRect.left - outgoingRect.left;
      const dy = incomingRect.top - outgoingRect.top;
      const scaleX = outgoingRect.width / incomingRect.width;
      const scaleY = outgoingRect.height / incomingRect.height;

      // Start the shared element at the outgoing element's position/size and
      // glide it to its natural spot while the screens cross-fade.
      incomingShared.style.transformOrigin = 'top left';
      incomingShared.style.transition = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease';
      incomingShared.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;

      await Promise.all([
        AnimationSystem.play(outgoing, 'fade-out', { duration: 200 }),
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            incomingShared.style.transform = 'none';
            requestAnimationFrame(() => resolve());
          });
        }),
        AnimationSystem.play(incoming, 'fade-in', { duration: 300 }),
      ]);

      await new Promise((resolve) => setTimeout(resolve, 320));
      incomingShared.style.transition = '';
    } else {
      // Fallback to regular swap
      await this.swap(mount, incoming, { kind: 'fade', direction });
    }
  },
};
