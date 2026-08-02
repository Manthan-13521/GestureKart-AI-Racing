import { RaceEntity, EntityState } from '../../ai/RaceEntity';

export class LocalPlayerEntity extends RaceEntity {
  constructor(id: string = 'player') {
    super(id, { isPlayer: true, isAI: false, isGhost: false });
  }

  // The local player is driven by user input (Game.ts), so update is primarily syncing state.
  public syncState(x: number, speed: number, distance: number, lap: number): void {
    this._state.x = x;
    this._state.speed = speed;
    this._state.distance = distance;
    this._state.lap = lap;
  }

  public update(_dt: number, _others?: EntityState[]): void {
    // Local player does not compute its own physics in the authoritative simulation here,
    // because it is driven by Game.update()
  }
}
