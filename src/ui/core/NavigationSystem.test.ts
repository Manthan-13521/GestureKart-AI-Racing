import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationSystem } from './NavigationSystem';
import { Screen } from '../components/Screen';

vi.mock('./TransitionSystem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./TransitionSystem')>();
  return {
    ...actual,
    TransitionSystem: {
      enter: vi.fn().mockResolvedValue(undefined),
      exit: vi.fn().mockResolvedValue(undefined),
      swap: vi.fn(async (_m: HTMLElement, incoming: HTMLElement) => {
        _m.replaceChildren(incoming);
      }),
    },
  };
});

class TestScreen extends Screen {
  constructor(id: string) {
    super(id);
  }
  protected build(params: Record<string, unknown>): void {
    const label = document.createElement('div');
    label.className = 'test-label';
    label.textContent = String(params.label ?? this.screenId);
    this.el.appendChild(label);
  }
}

describe('NavigationSystem', () => {
  let mount: HTMLElement;
  let nav: NavigationSystem;

  beforeEach(() => {
    mount = document.createElement('div');
    document.body.appendChild(mount);
    nav = new NavigationSystem(mount);
    nav.register('a', { create: () => new TestScreen('a') });
    nav.register('b', { create: () => new TestScreen('b') });
  });

  it('throws on unknown screens', async () => {
    await expect(nav.go('nope')).rejects.toThrow('unknown screen');
  });

  it('mounts screens and tracks the stack', async () => {
    await nav.go('a');
    expect(mount.querySelector('[data-screen="a"]')).not.toBeNull();
    expect(nav.current).toBe('a');
    expect(nav.depth).toBe(1);
    expect(nav.canGoBack).toBe(false);

    await nav.go('b');
    expect(mount.querySelector('[data-screen="b"]')).not.toBeNull();
    expect(nav.depth).toBe(2);
    expect(nav.canGoBack).toBe(true);
  });

  it('back returns to the previous screen', async () => {
    await nav.go('a');
    await nav.go('b');
    await nav.back();
    expect(nav.current).toBe('a');
    expect(nav.depth).toBe(1);
    expect(mount.querySelector('[data-screen="b"]')).toBeNull();
  });

  it('passes params through to the screen', async () => {
    await nav.go('a', { label: 'hello' });
    expect(mount.querySelector('.test-label')?.textContent).toBe('hello');
  });

  it('dispose clears the stack and mount', async () => {
    await nav.go('a');
    await nav.go('b');
    nav.dispose();
    expect(mount.children.length).toBe(0);
  });
});
