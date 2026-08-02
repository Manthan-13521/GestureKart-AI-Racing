export type GameKeys = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export type KeyCallback = (keys: GameKeys) => void;

export class KeyboardHandler {
  private keys: GameKeys = { up: false, down: false, left: false, right: false };
  private callback: KeyCallback;
  private listeners: (() => void)[] = [];

  constructor(callback: KeyCallback) {
    this.callback = callback;

    const onDown = (e: KeyboardEvent) => {
      const changed = this.handleKey(e.key.toLowerCase(), true);
      if (changed) {
        e.preventDefault();
        this.callback({ ...this.keys });
      }
    };

    const onUp = (e: KeyboardEvent) => {
      const changed = this.handleKey(e.key.toLowerCase(), false);
      if (changed) {
        e.preventDefault();
        this.callback({ ...this.keys });
      }
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    this.listeners.push(() => window.removeEventListener('keydown', onDown));
    this.listeners.push(() => window.removeEventListener('keyup', onUp));
  }

  private handleKey(key: string, pressed: boolean): boolean {
    const k =
      key === 'w' || key === 'arrowup'
        ? 'up'
        : key === 's' || key === 'arrowdown'
          ? 'down'
          : key === 'a' || key === 'arrowleft'
            ? 'left'
            : key === 'd' || key === 'arrowright'
              ? 'right'
              : null;

    if (k && this.keys[k] !== pressed) {
      this.keys[k] = pressed;
      return true;
    }
    return false;
  }

  isPressed(action: keyof GameKeys): boolean {
    return this.keys[action];
  }

  getKeys(): GameKeys {
    return { ...this.keys };
  }

  destroy(): void {
    this.listeners.forEach((fn) => fn());
    this.listeners = [];
  }
}
