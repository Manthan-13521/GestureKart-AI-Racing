import { encodeReplay, decodeReplay } from './codec';
import type { ReplayData } from './types';

interface StoredRun {
  data: string;
  score: number;
  duration: number;
  date: number;
}

interface StoredEntry {
  best: StoredRun | null;
  latest: StoredRun | null;
}

interface StoreDoc {
  version: number;
  entries: Record<string, StoredEntry>;
}

const STORE_VERSION = 1;

/**
 * Persists replays locally: Best Run + Latest Run, keyed per track + mode.
 * Every read path is fail-safe: corrupted entries, version mismatches and
 * storage failures degrade to "no replay" instead of throwing.
 */
export class ReplayStore {
  private doc: StoreDoc;
  private readonly storage: Pick<Storage, 'getItem' | 'setItem'>;

  constructor(
    private key = 'virtual-steering:replays:v1',
    storage?: Pick<Storage, 'getItem' | 'setItem'>
  ) {
    this.storage = storage ?? globalThis.localStorage;
    this.doc = this.loadDoc();
  }

  keyFor(track: string, mode: string): string {
    return `${track}:${mode}`;
  }

  hasBest(track: string, mode: string): boolean {
    const best = this.doc.entries[this.keyFor(track, mode)]?.best;
    return best !== null && best !== undefined;
  }

  /** Score of the stored best run for track+mode, or null when none. */
  bestScore(track: string, mode: string): number | null {
    const best = this.doc.entries[this.keyFor(track, mode)]?.best;
    return best ? best.score : null;
  }

  getBest(track: string, mode: string): ReplayData | null {
    const best = this.doc.entries[this.keyFor(track, mode)]?.best;
    if (!best) return null;
    return this.safeDecode(best.data, { track, mode });
  }

  getLatest(track: string, mode: string): ReplayData | null {
    const latest = this.doc.entries[this.keyFor(track, mode)]?.latest;
    if (!latest) return null;
    return this.safeDecode(latest.data, { track, mode });
  }

  /** Saves a finished run. Latest always overwrites; best only when better. */
  save(track: string, mode: string, data: ReplayData): void {
    const encoded = encodeReplay({
      track,
      mode,
      score: data.score,
      durationTicks: Math.round(data.duration * 60),
      sectorDists: data.sectorDists,
      times: data.times,
      xs: data.xs,
      speeds: data.speeds,
    });
    const run: StoredRun = {
      data: encoded,
      score: data.score,
      duration: data.duration,
      date: Date.now(),
    };
    const entry = this.doc.entries[this.keyFor(track, mode)] ?? { best: null, latest: null };
    entry.latest = run;
    const best = entry.best;
    if (!best || run.score > best.score) entry.best = run;
    this.doc.entries[this.keyFor(track, mode)] = entry;
    this.persist();
  }

  clear(): void {
    this.doc = { version: STORE_VERSION, entries: {} };
    this.persist();
  }

  private safeDecode(encoded: string, expect: { track: string; mode: string }): ReplayData | null {
    const data = decodeReplay(encoded, expect);
    if (data) return data;
    const key = this.keyFor(expect.track, expect.mode);
    const entry = this.doc.entries[key];
    if (entry) {
      if (entry.best?.data === encoded) entry.best = null;
      if (entry.latest?.data === encoded) entry.latest = null;
      if (!entry.best && !entry.latest) delete this.doc.entries[key];
      this.persist();
    }
    return null;
  }

  private loadDoc(): StoreDoc {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return { version: STORE_VERSION, entries: {} };
      const parsed = JSON.parse(raw) as Partial<StoreDoc>;
      if (parsed.version !== STORE_VERSION) return { version: STORE_VERSION, entries: {} };
      const entries = parsed.entries ?? {};
      const cleaned: Record<string, StoredEntry> = {};
      for (const key of Object.keys(entries)) {
        const entry = entries[key];
        if (!entry || typeof entry !== 'object') continue;
        const best = isValidRun(entry.best) ? entry.best : null;
        const latest = isValidRun(entry.latest) ? entry.latest : null;
        if (best || latest) cleaned[key] = { best, latest };
      }
      return { version: STORE_VERSION, entries: cleaned };
    } catch {
      return { version: STORE_VERSION, entries: {} };
    }
  }

  private persist(): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(this.doc));
    } catch {
      // storage unavailable (private mode / quota) — keep in-memory state
    }
  }
}

function isValidRun(run: StoredRun | null | undefined): run is StoredRun {
  if (!run || typeof run !== 'object') return false;
  return (
    typeof run.data === 'string' &&
    run.data.length > 0 &&
    typeof run.score === 'number' &&
    Number.isFinite(run.score) &&
    run.score >= 0 &&
    typeof run.duration === 'number' &&
    Number.isFinite(run.duration) &&
    typeof run.date === 'number'
  );
}
