/**
 * Unified application-state model (P0.3).
 *
 * NavigationSystem owns the screen route stack; StateMachine owns the live
 * gameplay phase. This module is the single typed contract between them:
 * one `AppState` for authoring, plus explicit transition graphs so the two
 * systems cannot drift apart.
 *
 *   AppState            Route (NavigationSystem)      GamePhase (StateMachine)
 *   --------------------------------------------------------------------------
 *   splash               splash                        idle
 *   loading              loading                       idle
 *   menu                 menu                          idle
 *   track-select         track-select                  idle
 *   mode-select          mode-select                   idle
 *   phone-pairing        phone-pairing                 idle
 *   lobby                lobby                         idle
 *   settings             settings                      idle
 *   garage               garage                        idle
 *   how-to-play          how-to-play                   idle
 *   gameplay             gameplay                      ready | racing
 *   gameover             — (results overlay)           gameover
 */

/** Screens registered in the NavigationSystem route stack. */
export type RouteId =
  | 'splash'
  | 'loading'
  | 'menu'
  | 'track-select'
  | 'mode-select'
  | 'phone-pairing'
  | 'gameplay'
  | 'lobby'
  | 'settings'
  | 'garage'
  | 'how-to-play';

/** Live gameplay phase owned by StateMachine. */
export type GamePhase = 'idle' | 'ready' | 'racing' | 'gameover';

/** Combined authoring state. */
export type AppState = RouteId | 'gameover';

/** Forward navigation edges reachable via `nav.go(route)`. */
export const ROUTE_GRAPH: Record<RouteId, RouteId[]> = {
  splash: ['loading'],
  loading: ['menu', 'gameplay'],
  menu: ['track-select', 'settings', 'garage', 'how-to-play'],
  'track-select': ['mode-select', 'menu'],
  'mode-select': ['track-select', 'phone-pairing', 'lobby', 'loading'],
  'phone-pairing': ['mode-select'],
  gameplay: [],
  lobby: ['mode-select', 'loading'],
  settings: ['menu'],
  garage: ['menu'],
  'how-to-play': ['menu'],
};

/** Valid gameplay-phase transitions. Invalid `set()` calls are ignored. */
export const GAME_PHASE_GRAPH: Record<GamePhase, GamePhase[]> = {
  idle: ['ready', 'racing'],
  ready: ['racing', 'idle', 'gameover'],
  racing: ['gameover', 'idle', 'ready'],
  gameover: ['idle', 'ready', 'racing'],
};

export function isRouteId(value: string): value is RouteId {
  return value in ROUTE_GRAPH;
}

export function isGamePhase(value: string): value is GamePhase {
  return value in GAME_PHASE_GRAPH;
}

export function isMenuRoute(route: RouteId): boolean {
  return !(route === 'gameplay');
}

/** Routes that never let keyboard/hand input kick a race off. */
export const PASSIVE_ROUTES: ReadonlySet<RouteId> = new Set<RouteId>([
  'splash',
  'loading',
  'menu',
  'track-select',
  'mode-select',
  'phone-pairing',
  'lobby',
  'settings',
  'garage',
  'how-to-play',
]);

/** Combine a route and a phase into the authoring AppState. */
export function appStateFor(route: RouteId | null, phase: GamePhase): AppState {
  if (phase === 'gameover') return 'gameover';
  return route ?? 'menu';
}

/** The route the racing phase maps onto (results overlay has no route). */
export function phaseRoute(phase: GamePhase): RouteId | 'gameover' | null {
  if (phase === 'gameover') return 'gameover';
  if (phase === 'ready' || phase === 'racing') return 'gameplay';
  return null;
}
