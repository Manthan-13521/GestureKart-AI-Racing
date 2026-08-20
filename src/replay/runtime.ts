import * as THREE from 'three';
import { ReplayRecorder, recordingToReplayData } from './recorder';
import { ReplayPlayer } from './player';
import { ReplayStore } from './store';
import { GhostRenderer } from './ghost';
import { GhostHud } from './hud';
import { computeOutcome, playerLeadTime } from './logic';
import type { ReplayOutcome } from './types';
import { REPLAY_VERSION, NO_OUTCOME } from './types';
import { GAME_MODES, type ModeId } from '../game/GameModeConfig';

const GHOST_LEAD = 16;

export interface ReplayRuntimeOptions {
  scene: Pick<THREE.Scene, 'add' | 'remove'>;
  hud?: GhostHud | null;
  store?: ReplayStore;
  onNotice?: (message: string) => void;
  now?: () => number;
}

/**
 * Single orchestration point for the replay subsystem. Records every race;
 * in Ghost Mode additionally loads the best replay, spawns the ghost and
 * drives the duel HUD. All replay concerns live here — the app shell only
 * calls arm/begin/tick/finish/abort.
 */
export class ReplayRuntime {
  private readonly recorder = new ReplayRecorder();
  private readonly store: ReplayStore;
  private readonly ghost: GhostRenderer;
  private readonly hud: GhostHud | null;
  private readonly onNotice: ((message: string) => void) | null;
  private readonly now: () => number;

  private player: ReplayPlayer | null = null;
  private track = '';
  private mode = '';
  private lastTick = 0;
  private sectorTimes: (number | null)[] = [null, null, null];
  private outcome: ReplayOutcome = { ...NO_OUTCOME };

  constructor(options: ReplayRuntimeOptions) {
    this.store = options.store ?? new ReplayStore();
    this.ghost = new GhostRenderer(options.scene as THREE.Scene);
    this.hud = options.hud ?? null;
    this.onNotice = options.onNotice ?? null;
    this.now = options.now ?? (() => performance.now());
    this.lastTick = this.now();
  }

  get ghostActive(): boolean {
    return this.player !== null;
  }

  get activeMode(): string {
    return this.mode;
  }

  get distance(): number {
    return this.recorder.distance;
  }

  getSectorDeltas(): (number | null)[] {
    return this.sectorTimes.map((t, i) =>
      t === null ? null : t - (this.player ? this.ghostBoundary(i) : 0)
    );
  }

  /** Called when a race is set up (mode selected). Loads the ghost for vs-mode. */
  arm(track: string, mode: string): void {
    this.track = track;
    this.mode = mode;
    this.player = null;
    this.sectorTimes = [null, null, null];
    this.outcome = { ...NO_OUTCOME };
    this.hud?.setVisible(false);

    if (GAME_MODES[mode as ModeId]?.features?.ghost) {
      const best = this.store.getBest(track, mode);
      if (best && best.version === REPLAY_VERSION) {
        this.player = new ReplayPlayer(best);
        this.ghost.build();
        this.hud?.reset(best.duration);
        this.hud?.setVisible(true);
        this.onNotice?.(`Ghost loaded — best ${formatDuration(best.duration)}`);
      } else {
        this.onNotice?.('No ghost on this track yet — your run will be recorded');
      }
    }
  }

  /** Called at GO. Starts recording; replays the ghost from the same clock. */
  begin(duration: number): void {
    this.recorder.begin(this.track, this.mode, duration);
    this.sectorTimes = [null, null, null];
  }

  /** Per render frame: record always; advance ghost + HUD in vs-mode. */
  tick(raceTime: number, x: number, speed: number): void {
    const now = this.now();
    const dt = Math.min(0.1, Math.max(0.001, (now - this.lastTick) / 1000));
    this.lastTick = now;

    this.recorder.pump(raceTime, x, speed);

    // Ghost playback and the duel HUD only advance once the race is running
    // (recorder begins at GO). Pre-GO frames must not move or show the ghost.
    if (!this.recorder.isActive) return;
    if (!this.player) return;
    const ghost = this.player.sample(raceTime);
    const playerDist = this.recorder.distance;
    const z = -(GHOST_LEAD + (ghost.dist - playerDist));
    this.ghost.update(dt, ghost.x, z, ghost.speed, raceTime);

    for (let i = 0; i < 2; i++) {
      const boundaryDist = this.player.data.sectorDists[i];
      if (this.sectorTimes[i] === null && boundaryDist > 0 && playerDist >= boundaryDist) {
        this.sectorTimes[i] = raceTime;
      }
    }

    if (this.hud) {
      this.hud.update({
        now: raceTime,
        best: this.player.duration,
        delta: playerLeadTime(raceTime, playerDist, this.player),
        ahead: playerLeadTime(raceTime, playerDist, this.player) > 0,
        sectors: this.getSectorDeltas(),
      });
    }
  }

  /** Called on game over. Persists the run and reports the duel outcome. */
  finish(score: number, raceTime: number): ReplayOutcome {
    const recording = this.recorder.finish(score, raceTime);
    const prevBest = this.store.bestScore(this.track, this.mode);

    if (recording) {
      const data = recordingToReplayData(recording);
      this.store.save(this.track, this.mode, data);
    }

    if (this.player) {
      this.outcome = computeOutcome({
        score,
        raceTime,
        playerDist: this.recorder.distance,
        ghost: this.player,
        prevBestScore: prevBest,
      });
      this.ghost.fadeOut();
      this.hud?.setVisible(false);
    } else {
      this.outcome = { ...NO_OUTCOME, newBest: prevBest === null || score > prevBest };
    }
    return this.outcome;
  }

  /** Called when a race is quit mid-run: nothing is persisted. */
  abort(): void {
    this.recorder.abort();
    this.player = null;
    this.ghost.visible = false;
    this.hud?.setVisible(false);
    this.sectorTimes = [null, null, null];
    this.outcome = { ...NO_OUTCOME };
  }

  dispose(): void {
    this.recorder.abort();
    this.ghost.dispose();
    this.hud?.dispose();
    this.player = null;
  }

  private ghostBoundary(i: number): number {
    if (!this.player) return 0;
    const d = this.player.duration;
    return i === 0 ? d / 3 : (2 * d) / 3;
  }
}

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
