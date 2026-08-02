export class TimingManager {
  private sectorTimes: Map<string, Array<number | null>> = new Map();
  private bestSectorTimes: Array<number | null> = [null, null, null];
  private currentLapTimes: Map<string, number> = new Map();

  public registerEntity(id: string): void {
    this.sectorTimes.set(id, [null, null, null]);
    this.currentLapTimes.set(id, 0);
  }

  public update(dt: number): void {
    for (const [id, time] of this.currentLapTimes.entries()) {
      this.currentLapTimes.set(id, time + dt);
    }
  }

  public updateEntityProgress(_id: string, _distance: number, _lap: number, _raceTime: number): void {
    // Just a stub for now so it compiles, we can implement sector logic here later
  }

  public recordSector(id: string, sectorIdx: number, time: number): void {
    const times = this.sectorTimes.get(id);
    if (times && times[sectorIdx] === null) {
      times[sectorIdx] = time;

      // Track best sector times overall
      const best = this.bestSectorTimes[sectorIdx];
      if (best === null || time < best) {
        this.bestSectorTimes[sectorIdx] = time;
      }
    }
  }

  public getSectorTimes(id: string): Array<number | null> {
    return this.sectorTimes.get(id) ?? [null, null, null];
  }

  public getBestSectorTimes(): Array<number | null> {
    return [...this.bestSectorTimes];
  }

  public getLapTime(id: string): number {
    return this.currentLapTimes.get(id) ?? 0;
  }

  public resetLapTime(id: string): void {
    this.currentLapTimes.set(id, 0);
  }

  public reset(): void {
    this.sectorTimes.clear();
    this.bestSectorTimes = [null, null, null];
    this.currentLapTimes.clear();
  }
}
