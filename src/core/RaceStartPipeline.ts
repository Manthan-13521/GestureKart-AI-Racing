/**
 * Race start pipeline (P2.1 + P2.2).
 *
 * The single authoritative gate between "configured" and "racing". It reuses
 * the existing StateMachine for phase transitions and composes one `RaceIntro`
 * (staging) and one `Countdown`. The ONLY normal path into `racing` is:
 *
 *   start()         → stateMachine ready → intro  (stage: staging)
 *   intro complete  → countdown arm               (stage: countdown)
 *   countdown done  → stateMachine racing, onRacing()  (stage: racing)
 *
 * Nothing else can start a race: `goRacing` is private and only reached from
 * the countdown completion beat. `cancel()` tears down both the intro timeline
 * and the countdown timer so no callbacks survive navigation/disposal.
 */
import { StateMachine } from './StateMachine';
import { Countdown } from './Countdown';
import { RaceIntro } from './RaceIntro';

export type PipelineStage = 'idle' | 'staging' | 'countdown' | 'racing' | 'cancelled';

export interface RaceStartPipelineOptions {
  stateMachine: StateMachine;
  countdown: Countdown;
  intro: RaceIntro;
  /** Invoked once racing is enabled (countdown completion). */
  onRacing: () => void;
  /** Optional notification when the pipeline is cancelled. */
  onCancel?: () => void;
}

export interface PipelineStartOptions {
  reducedMotion?: boolean;
  duration?: number;
}

export class RaceStartPipeline {
  private _stage: PipelineStage = 'idle';

  constructor(private readonly deps: RaceStartPipelineOptions) {}

  get stage(): PipelineStage {
    return this._stage;
  }

  get isActive(): boolean {
    return this._stage === 'staging' || this._stage === 'countdown';
  }

  get isIntroActive(): boolean {
    return this.deps.intro.isActive;
  }

  get isCountdownActive(): boolean {
    return this.deps.countdown.isActive;
  }

  /** Begin a new pre-race sequence. No-op if a staging/countdown is already running. */
  start(options: PipelineStartOptions = {}): void {
    if (this.deps.intro.isActive || this.deps.countdown.isActive) return;
    this._stage = 'staging';
    const sm = this.deps.stateMachine;
    sm.set('ready');
    sm.set('intro');
    this.deps.intro.begin(() => this.beginCountdown(), options);
  }

  /** Drive the staging timeline; delegate from the existing render loop. */
  tick(now: number): void {
    if (this._stage === 'staging') this.deps.intro.update(now);
  }

  /** Abort the whole pipeline cleanly (navigation away, disposal, abort). */
  cancel(): void {
    if (this._stage === 'idle' || this._stage === 'cancelled') return;
    this.deps.intro.cancel();
    this.deps.countdown.cancel();
    this._stage = 'cancelled';
    this.deps.onCancel?.();
  }

  private beginCountdown(): void {
    if (this._stage !== 'staging') return;
    this._stage = 'countdown';
    this.deps.countdown.start(() => this.goRacing());
  }

  private goRacing(): void {
    if (this._stage !== 'countdown') return;
    this._stage = 'racing';
    this.deps.stateMachine.set('racing');
    this.deps.onRacing();
  }
}
