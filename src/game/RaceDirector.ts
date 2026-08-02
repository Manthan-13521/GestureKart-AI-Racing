export interface RaceState {
  raceTime: number;
  lap: number;
  totalLaps: number;
  position: number;
  totalCars: number;
  started: boolean;
  gameOver: boolean;
  raceDuration: number;
  standings: string[]; // List of entity IDs in order
}

export interface RaceEntitySnapshot {
  id: string;
  z: number;
  lap: number;
  isPlayer: boolean;
}

export class RaceDirector {
  private _raceTime = 0;
  private _lap = 1;
  private _totalLaps = 2; // Default for now
  private _position = 2;
  private _totalCars = 6;
  private _started = false;
  private _gameOver = false;
  private _raceDuration = 90; // Fallback duration limit
  private _standings: string[] = [];

  constructor() {}

  public get started(): boolean {
    return this._started;
  }

  public get gameOver(): boolean {
    return this._gameOver;
  }

  public get raceTime(): number {
    return this._raceTime;
  }

  public start(totalLaps: number = 2, totalCars: number = 6): void {
    this._started = true;
    this._gameOver = false;
    this._raceTime = 0;
    this._lap = 1;
    this._totalLaps = totalLaps;
    this._totalCars = totalCars;
    this._position = 2; // Default starting position, overridden later
    this._standings = [];
  }

  public setGameOver(): void {
    this._gameOver = true;
    this._started = false;
  }

  /**
   * Called every frame by the main loop.
   * @param delta The delta time in seconds
   * @param entities Current snapshot of all race entities to compute standings
   */
  public update(delta: number, entities: RaceEntitySnapshot[] = []): void {
    if (!this._started || this._gameOver) return;

    this._raceTime += delta;

    // Optional: timeout logic for Endless Survival
    if (this._raceTime >= this._raceDuration) {
      this._gameOver = true;
    }

    // Rank entities if provided
    if (entities.length > 0) {
      // Sort by lap descending, then z descending (higher z = more distance = further ahead)
      const sorted = [...entities].sort((a, b) => {
        if (a.lap !== b.lap) return b.lap - a.lap;
        return b.z - a.z;
      });

      this._standings = sorted.map((e) => e.id);

      const playerIndex = sorted.findIndex((e) => e.isPlayer);
      if (playerIndex !== -1) {
        this._position = playerIndex + 1;
        this._lap = sorted[playerIndex].lap;
      }
    }
  }

  public getState(): RaceState {
    return {
      raceTime: this._raceTime,
      lap: Math.min(this._lap, this._totalLaps),
      totalLaps: this._totalLaps,
      position: this._gameOver ? this._totalCars : this._position,
      totalCars: this._totalCars,
      started: this._started,
      gameOver: this._gameOver,
      raceDuration: this._raceDuration,
      standings: this._standings,
    };
  }

  // Temporary setter for Game.ts legacy compatibility
  public setLegacyPosition(pos: number): void {
    this._position = pos;
  }
}
