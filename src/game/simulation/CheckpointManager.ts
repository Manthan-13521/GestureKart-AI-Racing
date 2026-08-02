export interface Checkpoint {
  id: string;
  distance: number;
  isSectorEnd?: boolean;
  isLapEnd?: boolean;
}

export class CheckpointManager {
  private checkpoints: Checkpoint[] = [];

  constructor(totalTrackLength: number = 10000) {
    // Default 3 sectors
    this.checkpoints = [
      { id: 'sector1', distance: totalTrackLength * 0.33, isSectorEnd: true },
      { id: 'sector2', distance: totalTrackLength * 0.66, isSectorEnd: true },
      { id: 'finish', distance: totalTrackLength, isSectorEnd: true, isLapEnd: true },
    ];
  }

  public getCheckpoints(): Checkpoint[] {
    return this.checkpoints;
  }

  public getNextCheckpoint(currentDistance: number): Checkpoint {
    const lapDistance = currentDistance % this.getTotalTrackLength();
    for (const cp of this.checkpoints) {
      if (lapDistance < cp.distance) {
        return cp;
      }
    }
    return this.checkpoints[0]; // fallback
  }

  public getTotalTrackLength(): number {
    return this.checkpoints[this.checkpoints.length - 1].distance;
  }
}
