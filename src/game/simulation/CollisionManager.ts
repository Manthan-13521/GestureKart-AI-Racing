import type { EntityState } from '../../ai/RaceEntity';

export class CollisionManager {
  private onCollisionCallback: ((entityId1: string, entityId2: string) => void) | null = null;

  public onCollision(callback: (entityId1: string, entityId2: string) => void): void {
    this.onCollisionCallback = callback;
  }

  /**
   * Check logical collision between all entities.
   * Tolerances: dx < 1.6m (lateral), dz < 4m (longitudinal distance).
   */
  public checkCollisions(entities: EntityState[]): void {
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const e1 = entities[i];
        const e2 = entities[j];

        const dx = Math.abs(e1.x - e2.x);
        const dz = Math.abs(e1.distance - e2.distance);

        if (dx < 1.6 && dz < 4) {
          if (this.onCollisionCallback) {
            this.onCollisionCallback(e1.id, e2.id);
          }
        }
      }
    }
  }

  public reset(): void {
    this.onCollisionCallback = null;
  }
}
