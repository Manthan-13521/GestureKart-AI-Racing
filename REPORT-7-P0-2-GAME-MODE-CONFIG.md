# P0.2 — Game Mode Config (Single Mode Table)

## Goal

Eliminate the duplicated, mode-specific rules scattered across the codebase by
introducing one authoritative `GAME_MODES` table, and hook the real input gating
it enables (gesture-only survival).

## Audit: where mode behavior lived before

| Site                          | Mode logic                                                                                                    | Action                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `screens/ModeSelectScreen.ts` | Duplicate `MODES` UI table + `ModeDef`/`InputKind` view types                                                 | Replaced by `GAME_MODES` (ui.*)                               |
| `main.ts`                     | `currentModeId === 'ai-race'` / `'versus'` / `'multiplayer'` checks, `_raceMode` mapping, `replayRuntime.arm` | Now reads `GAME_MODES[…].features` + `raceModeFor()`          |
| `flow.ts`                     | Mode routing (phone / multiplayer / loading)                                                                  | Keyed to `features.multiplayer` + defensive `isSourceAllowed` |
| `replay/runtime.ts`           | `const GHOST_MODE = 'versus'`                                                                                 | Now reads `features.ghost`                                    |
| `Game.ts`                     | `_raceMode` branches (protected)                                                                              | Left untouched; semantics derived via `raceModeFor()`         |

## Implementation

- **`src/game/GameModeConfig.ts`** (new): `ModeId`, `TrackId`, `GameModeConfig`,
  `GAME_MODES`, `MODE_ORDER`, and helpers `sourceAllowed`, `trackAllowed`,
  `isSourceAllowed`, `isTrackAllowed`, `raceModeFor`.
- **`TrackSelectScreen.ts`**: `TrackId` moved to the game layer, re-exported here.
- **`ModeSelectScreen.ts`**: cards + badges + input chips + duration render from
  `GAME_MODES[].ui`; `ModeId` re-exported; **control-method clamp** — selecting a
  mode whose input whitelist excludes the current control method switches to the
  first allowed method (e.g. Survival + Keyboard → Hand).
- **`InputManager.ts`**: new `setModeConfig(config | null)` + `isSourceAllowed()`;
  `setBase(source, frame)` and `frame()` (`phone` / `auto` / `gyro` layers) now
  gate on the active mode's input whitelist.
- **`main.ts`**: race wiring consumes `GAME_MODES[...].features` and
  `raceModeFor()`; `setModeConfig` set on `startRace` and cleared on
  menu returns; all `setBase` calls now pass their source id.
- **`replay/runtime.ts`**: ghost activation reads `features.ghost`.
- **`flow.ts`**: phone-pairing route only when phone is actually allowed.

### Behaviour now enforced (genuine config consumption)

- **Survival is gesture-only.** Keyboard/gyro/phone steering is ignored once the
  race starts (`setBase` + every `frame()` layer); hands are the sole base
  source. Keyboard can still _start_ the race, but can no longer steer it —
  linking the previously dangling auto-accelerate countdown trigger and the
  "survival + keyboard" ambiguity.
- **Versus keeps the phone/auto/gyro chain** (regression-tested).

## Deliberate non-changes (documented deltas)

- `Game.ts` is untouched: its `_raceMode` branch at `start()` spawns initial
  traffic for all non-ai-race modes. `GAME_MODES[].rules.spawning` declares the
  intended rule (versus = none); adapting spawn logic to the table is P4/P5.
- `rules.scoring` / `rules.finish` are declarative; `Game` still scores
  uniformly. Wired later.
- Blocks/units, race director, AI: P4+.

## Tests

- New `src/game/GameModeConfig.test.ts` (9 tests): table integrity, feature
  uniqueness, survival whitelist, helpers.
- `InputManager.test.ts` extended (6 tests): survival rejects base frames from
  disallowed sources, ignores keyboard/gyro/phone in `frame()`, vs-mode keeps
  phone priority, `setModeConfig(null)` lifts all restrictions.
- Existing suite (incl. `flow.test.ts` mode-order + gesture-icon + routing) green.

## Gates

- `tsc --noEmit`: clean
- `eslint .`: clean
- `vitest`: **106 tests pass** (11 files)
- `vite build`: clean

## Files changed

```
A  src/game/GameModeConfig.ts
A  src/game/GameModeConfig.test.ts
M  src/screens/ModeSelectScreen.ts
M  src/screens/TrackSelectScreen.ts
M  src/managers/InputManager.ts
M  src/managers/InputManager.test.ts
M  src/main.ts
M  src/replay/runtime.ts
M  src/screens/flow.ts
```
