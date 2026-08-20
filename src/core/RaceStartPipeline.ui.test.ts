import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateMachine } from './StateMachine';
import { Countdown } from './Countdown';
import { RaceIntro, type RaceIntroTarget } from './RaceIntro';
import { RaceStartPipeline } from './RaceStartPipeline';
import { UIManager } from '../managers/UIManager';

/**
 * Mirrors the app-shell wiring: StateMachine + RaceStartPipeline + Countdown,
 * with the Countdown hooks driving the real UIManager presentation surface and
 * `onRacing` behaving exactly like main.ts `startGame()` (guarded, once).
 */
function mountUi(): void {
  for (const id of ['game-overlay', 'game-over-overlay', 'countdown-overlay', 'final-score']) {
    const el = document.createElement('div');
    el.id = id;
    if (id === 'countdown-overlay') {
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.setAttribute('aria-hidden', 'true');
      el.classList.add('hidden');
    }
    document.body.appendChild(el);
  }
  const num = document.createElement('div');
  num.id = 'countdown-num';
  document.getElementById('countdown-overlay')!.appendChild(num);
  const hud = document.createElement('div');
  hud.id = 'game-hud';
  hud.classList.add('hidden');
  document.body.appendChild(hud);
  const intro = document.createElement('div');
  intro.id = 'intro-overlay';
  intro.setAttribute('aria-hidden', 'true');
  const introSub = document.createElement('div');
  introSub.id = 'intro-sub';
  intro.appendChild(introSub);
  document.body.appendChild(intro);
}

interface FakeGame {
  started: boolean;
  startCount: number;
}

interface Rig {
  stateMachine: StateMachine;
  pipeline: RaceStartPipeline;
  ui: UIManager;
  game: FakeGame;
  onRacing: ReturnType<typeof vi.fn>;
  startGame: () => void;
  finishStaging: () => void;
}

function makeRig(): Rig {
  const stateMachine = new StateMachine();
  const ui = new UIManager();
  stateMachine.onChange((_f, to) => ui.sync(to));

  const game: FakeGame = { started: false, startCount: 0 };
  // Exact mirror of main.ts startGame(): guarded so Game.start() is once.
  const startGame = () => {
    if (game.started) return;
    game.started = true;
    game.startCount++;
  };
  const onRacing = vi.fn(startGame);

  let clock = 0;
  const target = { prepare: vi.fn(), frame: vi.fn(), settle: vi.fn() } as RaceIntroTarget & {
    prepare: ReturnType<typeof vi.fn>;
    frame: ReturnType<typeof vi.fn>;
    settle: ReturnType<typeof vi.fn>;
  };
  const intro = new RaceIntro(target, { duration: 1000, now: () => clock });
  const countdown = new Countdown(
    {
      tick: (step) => {
        ui.showCountdown();
        ui.countdownNum.textContent = `${step}`;
        ui.countdownNum.className = 'countdown-num';
      },
      go: () => {
        ui.countdownNum.textContent = 'GO';
        ui.countdownNum.className = 'countdown-num go';
      },
      clear: () => ui.hideCountdown(),
    },
    { intervalMs: 250 }
  );
  const pipeline = new RaceStartPipeline({ stateMachine, countdown, intro, onRacing });

  const finishStaging = () => {
    clock += 1000; // monotonic, like performance.now()
    pipeline.tick(clock);
  };
  return { stateMachine, pipeline, ui, game, onRacing, startGame, finishStaging };
}

describe('RaceStartPipeline + UIManager (P2.3 + P2.4 integration)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mountUi();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('presents intro → 3·2·1·GO from authoritative beats → racing with HUD', () => {
    const rig = makeRig();
    rig.pipeline.start();

    // Staging: intro presentation visible, HUD + countdown retired.
    expect(rig.ui.intro.classList.contains('visible')).toBe(true);
    expect(rig.ui.hud.classList.contains('hidden')).toBe(true);
    expect(rig.ui.countdown.classList.contains('hidden')).toBe(true);
    expect(rig.ui.intro.getAttribute('aria-hidden')).toBe('false');

    // No independent UI timer: time alone must not move the countdown.
    vi.advanceTimersByTime(5000);
    expect(rig.ui.countdown.classList.contains('hidden')).toBe(true);

    rig.finishStaging();
    // Countdown stage still runs under the `intro` phase: the presentation
    // stays on screen behind the authoritative countdown beats.
    expect(rig.ui.intro.classList.contains('visible')).toBe(true);
    expect(rig.ui.countdown.classList.contains('hidden')).toBe(false);
    expect(rig.ui.countdownNum.textContent).toBe('3');

    vi.advanceTimersByTime(250);
    expect(rig.ui.countdownNum.textContent).toBe('2');
    vi.advanceTimersByTime(250);
    expect(rig.ui.countdownNum.textContent).toBe('1');
    vi.advanceTimersByTime(250);
    expect(rig.ui.countdownNum.textContent).toBe('GO');
    expect(rig.onRacing).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250); // final authoritative beat → racing
    expect(rig.onRacing).toHaveBeenCalledTimes(1);
    expect(rig.stateMachine.get()).toBe('racing');
    expect(rig.ui.hud.classList.contains('hidden')).toBe(false);
    expect(rig.ui.intro.classList.contains('visible')).toBe(false);
    expect(rig.ui.countdown.classList.contains('hidden')).toBe(true);
    expect(rig.ui.countdown.getAttribute('aria-hidden')).toBe('true');
  });

  it('Game.start() fires exactly once per attempt (guard + single GO beat)', () => {
    const rig = makeRig();
    rig.pipeline.start();
    rig.finishStaging();

    // Duplicate completions / stray GO hooks cannot double-start.
    vi.advanceTimersByTime(250); // 2
    vi.advanceTimersByTime(250); // 1
    vi.advanceTimersByTime(250); // GO
    vi.advanceTimersByTime(250); // racing
    expect(rig.game.startCount).toBe(1);
    expect(rig.stateMachine.get()).toBe('racing');
  });

  it('duplicate pipeline.start() cannot double-start', () => {
    const rig = makeRig();
    rig.pipeline.start();
    rig.pipeline.start();
    rig.finishStaging();
    vi.advanceTimersByTime(1000);
    expect(rig.onRacing).toHaveBeenCalledTimes(1);
    expect(rig.game.startCount).toBe(1);
  });

  it('input cannot reach racing before the countdown completes', () => {
    const rig = makeRig();
    // Never started: time alone and stray inputs cannot move the machine.
    vi.advanceTimersByTime(10000);
    expect(rig.onRacing).not.toHaveBeenCalled();
    expect(rig.stateMachine.get()).toBe('idle');

    rig.pipeline.start();
    vi.advanceTimersByTime(10000); // staging is pipeline-ticked only
    expect(rig.onRacing).not.toHaveBeenCalled();
    expect(rig.stateMachine.get()).toBe('intro');
  });

  it('cancellation during countdown prevents any stale racing/GO', () => {
    const rig = makeRig();
    rig.pipeline.start();
    rig.finishStaging();
    vi.advanceTimersByTime(250);
    rig.pipeline.cancel();
    vi.advanceTimersByTime(5000);
    expect(rig.onRacing).not.toHaveBeenCalled();
    expect(rig.game.startCount).toBe(0);
    expect(rig.ui.countdown.classList.contains('hidden')).toBe(true);
    expect(rig.ui.countdown.getAttribute('aria-hidden')).toBe('true');
    // Nav handler resets the machine.
    rig.stateMachine.set('idle');
    expect(rig.ui.intro.classList.contains('visible')).toBe(false);
    expect(rig.ui.hud.classList.contains('hidden')).toBe(true);
  });

  it('retry runs a fresh pipeline (cancel → start → full countdown → racing)', () => {
    const rig = makeRig();
    rig.pipeline.start();
    rig.finishStaging();
    vi.advanceTimersByTime(1000);
    expect(rig.game.startCount).toBe(1);

    rig.pipeline.cancel(); // retry/nav path
    rig.stateMachine.set('idle');
    rig.game.started = false; // RACE AGAIN calls game.prepareRace() first
    rig.pipeline.start(); // RACE AGAIN
    expect(rig.ui.intro.classList.contains('visible')).toBe(true);
    expect(document.querySelectorAll('#countdown-overlay').length).toBe(1);

    rig.finishStaging();
    expect(rig.ui.countdownNum.textContent).toBe('3');
    vi.advanceTimersByTime(1000);
    expect(rig.game.startCount).toBe(2);
    expect(rig.onRacing).toHaveBeenCalledTimes(2);
    expect(rig.stateMachine.get()).toBe('racing');
  });

  it('navigation cancels the pipeline and no stale GO survives', () => {
    const rig = makeRig();
    rig.pipeline.start();
    rig.pipeline.cancel(); // resultsMenu / navTitle / beforeunload
    expect(rig.pipeline.stage).toBe('cancelled');
    vi.advanceTimersByTime(5000);
    expect(rig.onRacing).not.toHaveBeenCalled();
    expect(rig.stateMachine.get()).toBe('intro'); // nav sets idle next
  });

  it('reduced motion skips the sweep but preserves every logical stage', () => {
    const rig = makeRig();
    rig.pipeline.start({ reducedMotion: true });

    // Countdown is authoritative and complete even though staging is skipped.
    expect(rig.ui.countdown.classList.contains('hidden')).toBe(false);
    expect(rig.ui.countdownNum.textContent).toBe('3');
    expect(rig.ui.hud.classList.contains('hidden')).toBe(true);
    // The presentation stays visible under the countdown (phase is still intro).
    expect(rig.ui.intro.classList.contains('visible')).toBe(true);

    vi.advanceTimersByTime(250);
    expect(rig.ui.countdownNum.textContent).toBe('2');
    vi.advanceTimersByTime(250);
    expect(rig.ui.countdownNum.textContent).toBe('1');
    vi.advanceTimersByTime(250);
    expect(rig.ui.countdownNum.textContent).toBe('GO');
    vi.advanceTimersByTime(250);
    expect(rig.onRacing).toHaveBeenCalledTimes(1);
    expect(rig.stateMachine.get()).toBe('racing');
    expect(rig.ui.hud.classList.contains('hidden')).toBe(false);
    expect(rig.ui.countdown.classList.contains('hidden')).toBe(true);
  });

  it('multiplayer/replay handoff: recording/network begin only at the GO boundary', () => {
    const rig = makeRig();
    // Replay/network init lives inside startGame (mirrored by onRacing); it
    // must never fire before GO and exactly once at GO.
    rig.pipeline.start();
    rig.finishStaging();
    expect(rig.onRacing).not.toHaveBeenCalled();
    expect(rig.game.startCount).toBe(0);
    vi.advanceTimersByTime(1000); // through 3·2·1·GO
    expect(rig.onRacing).toHaveBeenCalledTimes(1);
    expect(rig.game.startCount).toBe(1);
    // The guard means re-entry cannot double-initialize network/replay.
    rig.startGame();
    expect(rig.game.startCount).toBe(1);
  });

  it('game-over overlay derives from the phase machine and HUD retires', () => {
    const rig = makeRig();
    rig.stateMachine.set('ready');
    rig.stateMachine.set('intro');
    rig.stateMachine.set('racing');
    rig.stateMachine.set('gameover');
    expect(rig.ui.gameover.classList.contains('visible')).toBe(true);
    expect(rig.ui.hud.classList.contains('hidden')).toBe(true);
    expect(rig.ui.intro.classList.contains('visible')).toBe(false);
  });
});
