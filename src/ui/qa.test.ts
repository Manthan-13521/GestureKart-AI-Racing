import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationSystem } from './core/NavigationSystem';
import { ModalSystem } from './core/ModalSystem';
import { ThemeManager } from './ThemeManager';
import { Screen } from './components/Screen';

vi.mock('./core/TransitionSystem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./core/TransitionSystem')>();
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
  protected build(): void {
    const label = document.createElement('div');
    label.className = 'test-label';
    label.textContent = this.screenId;
    this.el.appendChild(label);
  }
}

describe('QA: navigation spam', () => {
  let mount: HTMLElement;
  let nav: NavigationSystem;

  beforeEach(() => {
    mount = document.createElement('div');
    document.body.appendChild(mount);
    nav = new NavigationSystem(mount);
    nav.register('a', { create: () => new TestScreen('a') });
    nav.register('b', { create: () => new TestScreen('b') });
    nav.register('c', { create: () => new TestScreen('c') });
  });

  it('spam during a transition is dropped safely — no crash, no double mount', async () => {
    const results = await Promise.allSettled([nav.go('a'), nav.go('b'), nav.go('c'), nav.go('b')]);
    for (const r of results) expect(r.status).toBe('fulfilled');
    expect(nav.depth).toBe(1);
    expect(mount.querySelectorAll('[data-screen]').length).toBe(1);
  });

  it('system recovers and navigates normally after spam', async () => {
    void nav.go('a');
    void nav.go('b');
    await vi.waitFor(() => expect(nav.current).not.toBeNull());
    await nav.go('b');
    expect(nav.current).toBe('b');
    expect(nav.depth).toBe(2);
    expect(nav.canGoBack).toBe(true);
  });

  it('back() at the root is a no-op, not a crash', async () => {
    await nav.go('a');
    await nav.back();
    expect(nav.current).toBe('a');
    expect(mount.querySelector('[data-screen="a"]')).not.toBeNull();
  });

  it('go() to the same screen does not double-mount', async () => {
    await nav.go('a');
    await nav.go('a');
    const count = mount.querySelectorAll('[data-screen="a"]').length;
    expect(count).toBe(1);
  });
});

describe('QA: modal stacking', () => {
  let modal: ModalSystem;

  beforeEach(() => {
    document.body.replaceChildren();
    modal = new ModalSystem();
  });

  it('modals stack cleanly — no orphaned panels', () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    modal.open(first, { title: 'one' });
    modal.open(second, { title: 'two' });
    expect(modal.openCount).toBe(2);
    expect(document.querySelectorAll('.modal-panel').length).toBe(2);
    expect(document.querySelectorAll('.modal-backdrop').length).toBe(2);
  });

  it('closing the active modal leaves one clean backdrop', () => {
    modal.open(document.createElement('div'), { title: 'one' });
    modal.open(document.createElement('div'), { title: 'two' });
    modal.close();
    expect(modal.openCount).toBe(1);
    expect(document.querySelectorAll('.modal-panel').length).toBe(1);
    expect(document.querySelectorAll('.modal-backdrop').length).toBe(1);
  });

  it('closeAll clears every layer with no dead DOM', () => {
    modal.open(document.createElement('div'));
    modal.open(document.createElement('div'));
    modal.closeAll();
    expect(modal.openCount).toBe(0);
    expect(document.querySelector('.modal-panel')).toBeNull();
    expect(document.querySelector('.modal-backdrop')).toBeNull();
  });

  it('closing with no open modal is safe', () => {
    expect(() => modal.close()).not.toThrow();
    expect(() => modal.closeAll()).not.toThrow();
  });
});

describe('QA: theme mode spam', () => {
  let tm: ThemeManager;

  beforeEach(() => {
    tm = new ThemeManager();
  });

  it('rapid set() calls converge to the final patch', () => {
    tm.set({ highContrast: true });
    tm.set({ reducedMotion: true });
    tm.set({ highContrast: false });
    tm.set({ largeHud: true });
    const final = tm.get();
    expect(final.highContrast).toBe(false);
    expect(final.reducedMotion).toBe(true);
    expect(final.largeHud).toBe(true);
    expect(document.documentElement.dataset.highContrast).toBe('false');
    expect(document.documentElement.dataset.reducedMotion).toBe('true');
  });

  it('spamming the same preference is idempotent', () => {
    tm.set({ colorblind: true });
    tm.set({ colorblind: true });
    tm.set({ colorblind: false });
    tm.set({ colorblind: false });
    expect(tm.get().colorblind).toBe(false);
    expect(document.documentElement.dataset.colorblind).toBe('false');
  });

  it('partial patches never drop previously-set preferences', () => {
    tm.set({ highContrast: true, largeHud: true });
    tm.set({ reducedMotion: true });
    const prefs = tm.get();
    expect(prefs.highContrast).toBe(true);
    expect(prefs.largeHud).toBe(true);
    expect(prefs.reducedMotion).toBe(true);
  });
});
