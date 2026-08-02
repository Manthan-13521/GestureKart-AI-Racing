import { RaceEntityManager } from './RaceEntityManager';
import { CheckpointManager } from './CheckpointManager';
import { TimingManager } from './TimingManager';
import { CollisionManager } from './CollisionManager';
import { EventTimeline } from './EventTimeline';
import { RaceDirector, RaceEntitySnapshot } from '../RaceDirector';

export class RaceSimulation {
  public entityManager: RaceEntityManager;
  public checkpointManager: CheckpointManager;
  public timingManager: TimingManager;
  public collisionManager: CollisionManager;
  public eventTimeline: EventTimeline;
  public raceDirector: RaceDirector;

  constructor(trackLength: number = 10000) {
    this.entityManager = new RaceEntityManager();
    this.checkpointManager = new CheckpointManager(trackLength);
    this.eventTimeline = new EventTimeline();
    this.timingManager = new TimingManager();
    this.collisionManager = new CollisionManager();
    this.raceDirector = new RaceDirector();
  }

  public init(totalLaps: number = 2, totalCars: number = 6): void {
    this.raceDirector.start(totalLaps, totalCars);
    this.entityManager.reset();
    // Additional setup can go here
  }

  public update(dt: number): void {
    if (!this.raceDirector.started || this.raceDirector.gameOver) {
      return;
    }

    const snapshots = this.entityManager.getSnapshots();

    // 1. Update entities (AI and Ghosts)
    this.entityManager.update(dt, snapshots);

    // 2. Check collisions
    this.collisionManager.checkCollisions(snapshots);

    // 3. Update timing and sectors for all entities
    for (const snapshot of snapshots) {
      this.timingManager.updateEntityProgress(
        snapshot.id,
        snapshot.distance,
        snapshot.lap,
        this.raceDirector.raceTime
      );
    }

    // 4. Update RaceDirector to recalculate standings based on new positions
    const dirSnapshots: RaceEntitySnapshot[] = snapshots.map((s) => ({
      id: s.id,
      z: s.distance,
      lap: s.lap,
      isPlayer: s.isPlayer,
    }));
    this.raceDirector.update(dt, dirSnapshots);
  }

  public cleanup(): void {
    this.entityManager.reset();
    this.eventTimeline.clear();
  }
}
