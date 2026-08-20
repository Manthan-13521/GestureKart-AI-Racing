import { NotificationSystem, type ToastKind } from '../core/NotificationSystem';

export type { ToastKind };

export interface ToastOptions {
  kind?: ToastKind;
  timeout?: number;
}

/**
 * Thin convenience wrapper around NotificationSystem for programmatic toast use.
 */
export const Toast = {
  show(title: string, message?: string, opts?: ToastOptions): void {
    NotificationSystem.getInstance().notify(title, message, opts);
  },
  success(title: string, message?: string): void {
    NotificationSystem.getInstance().success(title, message);
  },
  warn(title: string, message?: string): void {
    NotificationSystem.getInstance().warn(title, message);
  },
  error(title: string, message?: string): void {
    NotificationSystem.getInstance().error(title, message);
  },
};
