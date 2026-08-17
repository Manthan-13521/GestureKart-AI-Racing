import { describe, it, expect, beforeEach } from 'vitest';
import { FocusNavigator } from './FocusNavigator';

function key(root: HTMLElement, k: string): void {
  root.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}

function card(
  label: string,
  withKeydown = false,
  expose: ((el: HTMLElement) => void) | null = null
): HTMLElement {
  const el = document.createElement('article');
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.textContent = label;
  if (withKeydown) {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
    });
  }
  expose?.(el);
  return el;
}

function createFixture(): {
  root: HTMLElement;
  grid: HTMLElement;
  chips: HTMLElement;
  back: HTMLButtonElement;
} {
  const root = document.createElement('div');

  const grid = document.createElement('div');
  grid.setAttribute('data-focus-group', 'grid');
  grid.append(card('A'), card('B'), card('C'));
  root.appendChild(grid);

  const chips = document.createElement('div');
  chips.setAttribute('data-focus-group', 'chips');
  const chipBtn = document.createElement('button');
  chipBtn.type = 'button';
  chipBtn.textContent = 'Chip 1';
  const chipBtn2 = document.createElement('button');
  chipBtn2.type = 'button';
  chipBtn2.textContent = 'Chip 2';
  chips.append(chipBtn, chipBtn2);
  root.appendChild(chips);

  const back = document.createElement('button');
  back.type = 'button';
  back.textContent = 'Back';
  root.appendChild(back);

  return { root, grid, chips, back };
}

describe('FocusNavigator — movement', () => {
  let fx: ReturnType<typeof createFixture>;
  let nav: FocusNavigator;

  beforeEach(() => {
    fx = createFixture();
    document.body.innerHTML = '';
    document.body.appendChild(fx.root);
    nav = new FocusNavigator(fx.root, {});
    nav.bind();
  });

  it('focusFirst activation targets a single element', () => {
    nav.focusFirst();
    expect(document.activeElement).toBe(fx.grid.querySelector('article'));
    const focused = document.querySelectorAll('article:focus');
    expect(focused.length).toBe(1);
  });

  it('moves forward and wraps within a group', () => {
    nav.focusFirst();
    key(fx.root, 'ArrowRight');
    key(fx.root, 'ArrowRight');
    expect(nav.active?.textContent).toBe('C');
    key(fx.root, 'ArrowRight');
    expect(nav.active?.textContent).toBe('A');
  });

  it('moves between groups in document order and wraps globally', () => {
    nav.focusFirst();
    // A → B → C → Chip 1 → Chip 2 → Back → (wrap) A
    key(fx.root, 'ArrowDown');
    key(fx.root, 'ArrowDown');
    expect(nav.active?.textContent).toBe('C');
    key(fx.root, 'ArrowDown');
    expect(nav.active?.textContent).toBe('Chip 1');
    key(fx.root, 'ArrowDown');
    expect(nav.active?.textContent).toBe('Chip 2');
    key(fx.root, 'ArrowDown');
    expect(nav.active?.textContent).toBe('Back');
    key(fx.root, 'ArrowDown'); // global wrap to first cluster
    expect(nav.active?.textContent).toBe('A');
  });

  it('moves backwards and exits groups via the previous cluster', () => {
    key(fx.root, 'ArrowUp'); // global wrap → footer Back
    expect(nav.active?.textContent).toBe('Back');
    key(fx.root, 'ArrowUp'); // prev cluster exit → Chip 2
    expect(nav.active?.textContent).toBe('Chip 2');
    key(fx.root, 'ArrowUp'); // within chips group
    expect(nav.active?.textContent).toBe('Chip 1');
    key(fx.root, 'ArrowUp'); // prev cluster exit → last card
    expect(nav.active?.textContent).toBe('C');
  });

  it('skips hidden and disabled controls', () => {
    const disabled = fx.grid.querySelectorAll('article')[1] as HTMLElement;
    disabled.setAttribute('disabled', '');
    (fx.grid.querySelectorAll('article')[2] as HTMLElement).hidden = true;
    const hiddenChip = fx.chips.querySelectorAll('button')[1] as HTMLElement;
    hiddenChip.style.display = 'none';
    nav.focusFirst();
    key(fx.root, 'ArrowDown'); // A (B disabled skipped, C hidden skipped) → Chip 1
    expect(nav.active?.textContent).toBe('Chip 1');
    key(fx.root, 'ArrowDown'); // Chip 2 hidden → Back
    expect(nav.active?.textContent).toBe('Back');
  });

  it('skips elements inside aria-hidden / inert containers', () => {
    fx.root.appendChild(card('Ghost'));
    const ghost = fx.root.querySelectorAll('article')[3] as HTMLElement;
    ghost.setAttribute('aria-hidden', 'true');
    nav.focusLast();
    expect(nav.active?.textContent).toBe('Back');
  });

  it('does not hijack typing into inputs or range sliders', () => {
    const slider = document.createElement('input');
    slider.type = 'range';
    const wrap = document.createElement('div');
    wrap.setAttribute('data-focus-group', 'slider');
    wrap.appendChild(slider);
    fx.root.appendChild(wrap);

    slider.focus();
    const before = slider.value;
    // Real browsers dispatch keydown on the focused control itself.
    slider.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    );
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(slider.value).toBe(before);
    expect(document.activeElement).toBe(slider);
  });

  it('no descendant can steal the single active focus', () => {
    // focusFirst must leave exactly one focused element even with nested groups
    nav.focusFirst();
    const count = Array.from(fx.root.querySelectorAll('*')).filter(
      (el) => el === document.activeElement
    ).length;
    expect(count).toBe(1);
  });
});

describe('FocusNavigator — activation and cancel', () => {
  let root: HTMLElement;
  let nav: FocusNavigator;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.innerHTML = '';
    document.body.appendChild(root);
  });

  it('Enter activates a custom role=button control exactly once', () => {
    let clicks = 0;
    const c = card('Run', true);
    c.addEventListener('click', () => clicks++);
    root.appendChild(c);
    nav = new FocusNavigator(root, {});
    nav.bind();
    nav.focusFirst();
    key(root, 'Enter');
    expect(clicks).toBe(1);
  });

  it('Space activates a custom control like Enter', () => {
    let clicks = 0;
    const c = card('Run', true);
    c.addEventListener('click', () => clicks++);
    root.appendChild(c);
    nav = new FocusNavigator(root, {});
    nav.bind();
    nav.focusFirst();
    key(root, ' ');
    expect(clicks).toBe(1);
  });

  it('leaves native button activation to the browser (no synthetic double)', () => {
    let clicks = 0;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Go';
    btn.addEventListener('click', () => clicks++);
    root.appendChild(btn);
    nav = new FocusNavigator(root, {});
    nav.bind();
    nav.focusFirst();
    key(root, 'Enter');
    // happy-dom does not synthesize native Enter activation, and the
    // navigator must not add its own click on top.
    expect(clicks).toBe(0);
  });

  it('Escape invokes the screen back behavior', () => {
    let back = 0;
    const c = card('X');
    root.appendChild(c);
    nav = new FocusNavigator(root, { onCancel: () => back++ });
    nav.bind();
    nav.focusFirst();
    key(root, 'Escape');
    expect(back).toBe(1);
  });

  it('Escape without a back handler returns focus to the start', () => {
    const c1 = card('One');
    const c2 = card('Two');
    root.append(c1, c2);
    nav = new FocusNavigator(root, {});
    nav.bind();
    nav.focusFirst();
    nav.move('down');
    expect(nav.active?.textContent).toBe('Two');
    key(root, 'Escape');
    expect(nav.active?.textContent).toBe('One');
  });
});

describe('FocusNavigator — command API (future gamepad)', () => {
  it('move / activate / cancel work without keyboard events', () => {
    const root = document.createElement('div');
    const c1 = card('One');
    const c2 = card('Two');
    let clicks = 0;
    c2.addEventListener('click', () => clicks++);
    root.append(c1, c2);
    document.body.appendChild(root);

    const nav = new FocusNavigator(root, {});
    nav.bind();
    nav.focusFirst();
    nav.move('down'); // standalone cards are vertical clusters → cross
    expect(nav.active?.textContent).toBe('Two');
    nav.activate();
    expect(clicks).toBe(1);
    nav.cancel(); // no onCancel → focusFirst (wraps back to start)
    expect(nav.active?.textContent).toBe('One');
    nav.dispose();
  });
});
