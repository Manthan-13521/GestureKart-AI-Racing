import { describe, it, expect } from 'vitest';
import { StateMachine } from './StateMachine';
import {
  ROUTE_GRAPH,
  GAME_PHASE_GRAPH,
  isRouteId,
  isGamePhase,
  isMenuRoute,
  appStateFor,
  phaseRoute,
  PASSIVE_ROUTES,
} from './AppState';

describe('GamePhase state machine', () => {
  it('starts idle and tracks phase transitions', () => {
    const sm = new StateMachine();
    expect(sm.get()).toBe('idle');
    expect(sm.isIdle()).toBe(true);
  });

  it('accepts the normal race lifecycle: idle → ready → racing → gameover', () => {
    const sm = new StateMachine();
    const seen: string[] = [];
    sm.onChange((from, to) => seen.push(`${from}→${to}`));
    sm.set('ready');
    sm.set('racing');
    sm.set('gameover');
    sm.set('idle'); // back to menu
    expect(seen).toEqual(['idle→ready', 'ready→racing', 'racing→gameover', 'gameover→idle']);
  });

  it('rejects invalid transitions and stays put', () => {
    const sm = new StateMachine();
    sm.set('gameover');
    expect(sm.get()).toBe('idle'); // idle→gameover is invalid
    sm.set('ready');
    sm.set('gameover');
    expect(sm.get()).toBe('gameover');
    sm.set('racing'); // gameover→racing allowed (results retry)
    expect(sm.get()).toBe('racing');
    expect(sm.isRacing()).toBe(true);
  });

  it('does not fire listeners for no-op or invalid sets', () => {
    const sm = new StateMachine();
    let fired = 0;
    sm.onChange(() => fired++);
    sm.set('idle'); // same state
    sm.set('gameover'); // invalid from idle
    expect(fired).toBe(0);
    sm.set('ready');
    expect(fired).toBe(1);
  });

  it('every edge in GAME_PHASE_GRAPH is symmetric-safe and typed', () => {
    const phases = Object.keys(GAME_PHASE_GRAPH);
    for (const target of phases) {
      expect(isGamePhase(target)).toBe(true);
    }
  });
});

describe('Route graph', () => {
  it('models the canonical flow edges', () => {
    expect(ROUTE_GRAPH.menu).toContain('track-select');
    expect(ROUTE_GRAPH['track-select']).toContain('mode-select');
    expect(ROUTE_GRAPH['mode-select']).toContain('phone-pairing');
    expect(ROUTE_GRAPH['mode-select']).toContain('loading');
    expect(ROUTE_GRAPH['mode-select']).toContain('lobby');
    expect(ROUTE_GRAPH.loading).toContain('gameplay');
    expect(ROUTE_GRAPH.loading).toContain('menu');
    expect(ROUTE_GRAPH['phone-pairing']).toContain('mode-select');
  });

  it('every route id is typed and every graph value is a known route', () => {
    const all = Object.keys(ROUTE_GRAPH);
    for (const route of all) {
      expect(isRouteId(route)).toBe(true);
      for (const next of ROUTE_GRAPH[route as keyof typeof ROUTE_GRAPH]) {
        expect(isRouteId(next)).toBe(true);
      }
    }
  });

  it('menu screens are passive; gameplay is the only active route', () => {
    expect(isMenuRoute('menu')).toBe(true);
    expect(PASSIVE_ROUTES.has('track-select')).toBe(true);
    expect(isMenuRoute('gameplay')).toBe(false);
  });
});

describe('AppState combiner', () => {
  it('maps race phases onto the gameplay route / gameover', () => {
    expect(appStateFor('gameplay', 'ready')).toBe('gameplay');
    expect(appStateFor('gameplay', 'intro')).toBe('gameplay');
    expect(appStateFor('gameplay', 'racing')).toBe('gameplay');
    expect(appStateFor('gameplay', 'gameover')).toBe('gameover');
    expect(phaseRoute('ready')).toBe('gameplay');
    expect(phaseRoute('intro')).toBe('gameplay');
    expect(phaseRoute('racing')).toBe('gameplay');
    expect(phaseRoute('gameover')).toBe('gameover');
    expect(phaseRoute('idle')).toBeNull();
  });

  it('combines a passive route with the idle phase', () => {
    expect(appStateFor('mode-select', 'idle')).toBe('mode-select');
    expect(appStateFor('menu', 'idle')).toBe('menu');
  });
});

describe('P2.1/P2.2 pre-race phase (intro)', () => {
  it('walks ready → intro → racing through the validated machine', () => {
    const sm = new StateMachine();
    const seen: string[] = [];
    sm.onChange((from, to) => seen.push(`${from}→${to}`));
    sm.set('ready');
    sm.set('intro');
    sm.set('racing');
    expect(seen).toEqual(['idle→ready', 'ready→intro', 'intro→racing']);
    expect(sm.get()).toBe('racing');
  });

  it('intro can be aborted back to idle or the results overlay', () => {
    const sm = new StateMachine();
    sm.set('ready');
    sm.set('intro');
    sm.set('idle');
    expect(sm.get()).toBe('idle');

    sm.set('ready');
    sm.set('intro');
    sm.set('gameover');
    expect(sm.get()).toBe('gameover');
  });

  it('skips invalid jumps into/out of intro', () => {
    const sm = new StateMachine();
    sm.set('intro'); // idle → intro is not an edge
    expect(sm.get()).toBe('idle');
    sm.set('ready');
    sm.set('intro');
    sm.set('ready'); // intro → ready allowed (fallback to staging)
    expect(sm.get()).toBe('ready');
  });
});
