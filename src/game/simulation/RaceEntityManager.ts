import type { RaceEntity, EntityState } from '../../ai/RaceEntity';

export class RaceEntityManager {
  private entities: Map<string, RaceEntity> = new Map();

  public register(entity: RaceEntity): void {
    this.entities.set(entity.id, entity);
  }

  public unregister(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      this.entities.delete(id);
    }
  }

  public get(id: string): RaceEntity | undefined {
    return this.entities.get(id);
  }

  public getAll(): RaceEntity[] {
    return Array.from(this.entities.values());
  }

  public getSnapshots(): EntityState[] {
    return this.getAll().map((e) => e.getSnapshot());
  }

  public update(dt: number, snapshots: EntityState[]): void {
    for (const entity of this.getAll()) {
      if (!entity.getSnapshot().isPlayer) {
        // AI / Ghost update
        entity.update(dt, snapshots);
      }
    }
  }

  public reset(): void {
    this.entities.clear();
  }
}
