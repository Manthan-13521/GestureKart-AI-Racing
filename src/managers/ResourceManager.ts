export interface DeviceInfo {
  isMobile: boolean;
}

export class ResourceManager {
  readonly device: DeviceInfo;
  private disposables = new Set<{ dispose(): void }>();

  constructor() {
    this.device = {
      isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768,
    };
  }

  externalHandsReady(): boolean {
    return typeof (window as unknown as Record<string, unknown>).Hands === 'function';
  }

  externalCameraUtilsReady(): boolean {
    return typeof (window as unknown as Record<string, unknown>).Camera === 'function';
  }

  trackDisposable(obj: { dispose(): void }): void {
    this.disposables.add(obj);
  }

  disposeAll(): void {
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch {
        // ignore disposal errors
      }
    }
    this.disposables.clear();
  }
}
