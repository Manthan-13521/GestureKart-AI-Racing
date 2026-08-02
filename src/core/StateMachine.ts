export type AppState = 'landing' | 'menu' | 'howtoplay' | 'settings' | 'ready' | 'racing' | 'gameover';

const MENU_BLOCKED_STATES = new Set<AppState>(['landing', 'menu', 'howtoplay', 'settings']);

export class StateMachine {
  private current: AppState = 'landing';
  private listeners = new Set<(from: AppState, to: AppState) => void>();

  get(): AppState {
    return this.current;
  }

  set(next: AppState): void {
    if (next === this.current) return;
    const from = this.current;
    this.current = next;
    for (const fn of [...this.listeners]) {
      fn(from, next);
    }
  }

  onChange(fn: (from: AppState, to: AppState) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  isMenuBlocked(): boolean {
    return MENU_BLOCKED_STATES.has(this.current);
  }
}
