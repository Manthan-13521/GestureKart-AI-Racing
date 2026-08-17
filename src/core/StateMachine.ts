import { GAME_PHASE_GRAPH, isGamePhase, type GamePhase } from './AppState';

/**
 * Gameplay-phase machine (navigation is owned by NavigationSystem).
 *
 * Tracks only the live race lifecycle: idle → ready → racing → gameover.
 * Transitions are validated against GAME_PHASE_GRAPH; invalid sets are
 * ignored so the machine can never be driven into a drift state by the
 * 60fps loop.
 */
export class StateMachine {
  private current: GamePhase = 'idle';
  private listeners = new Set<(from: GamePhase, to: GamePhase) => void>();

  get(): GamePhase {
    return this.current;
  }

  set(next: GamePhase): void {
    if (next === this.current) return;
    if (!GAME_PHASE_GRAPH[this.current]?.includes(next) || !isGamePhase(next)) {
      return;
    }
    const from = this.current;
    this.current = next;
    for (const fn of [...this.listeners]) {
      fn(from, next);
    }
  }

  onChange(fn: (from: GamePhase, to: GamePhase) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** No race is active (pre-race menus / staging). */
  isIdle(): boolean {
    return this.current === 'idle';
  }

  /** The race is mechanically in progress. */
  isRacing(): boolean {
    return this.current === 'racing' || this.current === 'ready';
  }
}
