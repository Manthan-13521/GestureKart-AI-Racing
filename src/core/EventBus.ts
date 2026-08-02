type Listener<T> = (payload: T) => void;

export const AppEvents = {
  autoToggle: 'auto:toggle',
  gyroToggle: 'gyro:toggle',
} as const;

export class EventBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<T>(event: string, fn: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn as Listener<unknown>);
    return () => this.off(event, fn);
  }

  off<T>(event: string, fn: Listener<T>): void {
    this.listeners.get(event)?.delete(fn as Listener<unknown>);
  }

  emit<T>(event: string, payload: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of [...set]) {
      fn(payload);
    }
  }
}
