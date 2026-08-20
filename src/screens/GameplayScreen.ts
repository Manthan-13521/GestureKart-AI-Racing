import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import { SoundHooks } from '../ui/core/SoundHooks';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import type { TrackId } from './TrackSelectScreen';
import type { ModeId } from './ModeSelectScreen';
import type { NetworkManager } from '../network/NetworkManager';

/**
 * Pre-race staging screen: shows the chosen track + mode and hands off to
 * the actual game via `startRace` (wired by the app shell).
 */
export class GameplayScreen extends Screen {
  startRace: ((track: TrackId, mode: ModeId, network?: NetworkManager) => void) | null = null;

  constructor() {
    super('gameplay');
  }

  protected transition(): TransitionKind {
    return 'scale';
  }

  protected build(_params: Record<string, unknown>): void {
    const track = (this.params.track as TrackId) ?? 'cyber-city';
    const mode = (this.params.mode as ModeId) ?? 'survival';

    const wrap = document.createElement('div');
    wrap.className = 'screen-inner';
    wrap.style.alignItems = 'center';

    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = `${track.replace(/-/g, ' ')} · ${mode.replace(/-/g, ' ')}`;
    wrap.appendChild(title);

    const hint = document.createElement('p');
    hint.className = 'splash-hint';
    hint.textContent = 'Hold tight — the lights are about to go out';
    wrap.appendChild(hint);

    const actions = document.createElement('div');
    actions.className = 'menu-actions';
    const startBtn = new Button('Launch Race [Enter / Space]', { size: 'lg' });
    const launch = () => {
      SoundHooks.confirm();
      this.startRace?.(track, mode, this.params.network as NetworkManager);
    };
    startBtn.el.addEventListener('click', launch);

    // Allow Space or Enter to launch immediately
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'w') {
        e.preventDefault();
        window.removeEventListener('keydown', keyHandler);
        launch();
      }
    };
    window.addEventListener('keydown', keyHandler);

    actions.appendChild(startBtn.el);
    wrap.appendChild(actions);

    this.el.appendChild(wrap);

    void AnimationSystem.play(title, 'blur-in', { duration: 500 });
    void AnimationSystem.play(hint, 'fade-in', { delay: 180 });
    void AnimationSystem.play(startBtn.el, 'scale-in', { delay: 260 }).then(() => {
      startBtn.el.focus();
    });
  }
}
