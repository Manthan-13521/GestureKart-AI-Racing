/**
 * RaceEntity — Base class for every participant in a race.
 *
 * Player, AI, Ghost, and future multiplayer peers all extend this.
 * Three.js and DOM concerns are deliberately excluded — only pure
 * logical state lives here.
 */
export interface EntityState {
  id: string;
  /** Lateral world-space offset from track centre (metres). */
  x: number;
  /** Normalised speed (same units as Game._speed). */
  speed: number;
  /** Cumulative distance along the track (metres). Increases monotonically. */
  distance: number;
  /** Current lap number (1-indexed). */
  lap: number;
  isPlayer: boolean;
  isAI: boolean;
  isGhost: boolean;
  isFinished: boolean;
}

export abstract class RaceEntity {
  protected _state: EntityState;

  constructor(id: string, flags: Pick<EntityState, 'isPlayer' | 'isAI' | 'isGhost'>) {
    this._state = {
      id,
      x: 0,
      speed: 0,
      distance: 0,
      lap: 1,
      isFinished: false,
      ...flags,
    };
  }

  get id(): string {
    return this._state.id;
  }

  get x(): number {
    return this._state.x;
  }

  get speed(): number {
    return this._state.speed;
  }

  get distance(): number {
    return this._state.distance;
  }

  get lap(): number {
    return this._state.lap;
  }

  get isFinished(): boolean {
    return this._state.isFinished;
  }

  getSnapshot(): EntityState {
    return { ...this._state };
  }

  /**
   * Abstract: each entity type drives its own update logic.
   * @param dt Delta time in SECONDS.
   * @param others All other entity snapshots this frame.
   */
  abstract update(dt: number, others?: EntityState[]): void;
}
