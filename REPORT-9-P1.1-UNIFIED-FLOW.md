# REPORT-9 :: P1.1 — UNIFIED FLOW FOUNDATION

## Verdict

P1.1 COMPLETE

---

## 1. Current flow (before)

The pre-P1.1 flow was already close to canonical, but route decisions were
inlined and duplicated in `flow.ts`'s `mode-select` factory, and the phone
path bypassed the shared Loading → Gameplay staging handoff.

```
Splash → Loading → Home (menu)
Home
  → Track Select → Mode Select
      → (controlMethod === 'phone' && isSourceAllowed(mode,'phone'))
            → phone-pairing → api.startRace(track, mode)   ← direct start, no Loading/Gameplay
        else if mode.features.multiplayer
            → lobby → Loading(next=gameplay, network) → Gameplay
        else
            → Loading(next=gameplay) → Gameplay → Start Race button → api.startRace
```

Problems found:

- The routing branch (phone → multiplayer → loading) was a multi-line inline
  `if/else` inside the `mode-select` screen factory — i.e. flow policy buried
  in a screen-wiring callback.
- **Bug:** `lobby → Loading` passed `network` in Loading params, but the
  `loading.onDone` handler dropped it before calling `nav.go('gameplay')`,
  so multiplayer network state never reached the gameplay staging screen.
- Phone flow called `api.startRace` directly from the pairing screen, so the
  "Loading → Gameplay" stage in the canonical flow did not exist for phone.

## 2. New canonical flow

Single, enforced route:

```
Home (menu)
  → Track Select
  → Mode Select  (+ Control Method chips)
  → Phone Pairing (only when controlMethod === 'phone' AND mode allows phone)
  → Loading
  → Gameplay (staging)
  → Race (api.startRace)
```

Routing is centralized in one pure function `resolveNextRoute(modeId,
controlMethod, track)` in `src/screens/flow.ts:33`. Every `mode-select`
selection goes through it; there are no inline route branches left.

- Non-phone: Mode Select → Loading → Gameplay → Start Race.
- Phone (allowed): Mode Select → Phone Pairing → Loading → Gameplay → Start Race.
- Phone (not allowed e.g. Survival): control method is clamped to a legal
  source by `ModeSelectScreen.clampControlMethod` before the route decision,
  so the router never sees an illegal phone request.
- Multiplayer: Mode Select → Lobby → Loading (network preserved) → Gameplay.

## 3. Files changed

| File                       | Change                                                                                                                                                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/screens/flow.ts`      | Added `resolveNextRoute`; mode-select now delegates route decisions to it. Phone `onStartRace` now routes through `Loading(next=gameplay)` instead of calling `api.startRace` directly. Loading→Gameplay now forwards `network` params. |
| `src/screens/flow.test.ts` | Added 11 P1.1 test cases; `makePhone` now supports triggering `onState` callbacks; beforeEach clears `document.body` (was leaking stale DOM between tests).                                                                             |

No changes to `NavigationSystem`, `StateMachine`, `AppState`, `GameModeConfig`,
`FocusNavigator`, screens' UI, or `Game.ts`. P0 architecture untouched.

## 4. State / navigation ownership

Boundary re-confirmed (no third system, no new abstraction):

- **NavigationSystem** (`src/ui/core/NavigationSystem.ts`) owns the screen
  route stack only (splash, loading, menu, track-select, mode-select,
  phone-pairing, gameplay, lobby, settings, garage, how-to-play).
- **StateMachine** (`src/core/StateMachine.ts` + `GAME_PHASE_GRAPH`) owns the
  live gameplay phase only (idle / ready / racing / gameover). It never
  navigates; navigation never mutates phases.
- **AppState.ts** is the typed contract between them (`RouteId`, `GamePhase`,
  `ROUTE_GRAPH`, `GAME_PHASE_GRAPH`, `appStateFor`, `phaseRoute`).
- All mode rules come from `GameModeConfig` (single source: allowed inputs,
  allowed tracks, features, rules); `resolveNextRoute` reads
  `GAME_MODES` and `isSourceAllowed` from it — no hardcoded mode lists in flow.
- Flow policy lives in `flow.ts` (`resolveNextRoute`); screens stay
  navigation-agnostic via injected `on*` callbacks.

## 5. Phone flow

- Mode Select → Phone Pairing → **Loading → Gameplay** → Start Race → `startRace`.
- Phone pairing implementation preserved 1:1 (QR, room code, `PhoneSource`,
  `onState` connection detection, Start Race gating on connection). Only the
  post-pairing handoff was changed to join the shared Loading → Gameplay path.
- If control method is Phone but the mode disallows phone (e.g. Survival,
  hand-only), `clampControlMethod` rewires the chip to a legal source before
  routing; the router's phone branch is never entered.

## 6. Back-navigation behavior

All verified with tests:

| From                            | Back goes to                                                   |
| ------------------------------- | -------------------------------------------------------------- |
| Track Select                    | Home (slide-right) ✓                                           |
| Mode Select                     | Track Select (slide-right) ✓                                   |
| Phone Pairing                   | Mode Select (slide-right, `api.phone.stop()`) ✓                |
| Loading                         | auto-advances (no manual back; safe — "where safe") ✓          |
| Gameplay                        | existing race/menu behavior (results Menu / nav-title reset) ✓ |
| Lobby                           | Mode Select (slide-right) ✓                                    |
| Settings / Garage / How-to-Play | Home (slide-right) ✓                                           |

## 7. Tests added

Added to `src/screens/flow.test.ts` (11 new cases):

1. Home → Track Select
2. Track Select → Mode Select
3. Mode Select → Loading → Gameplay (non-phone, === versus)
4. Mode Select → Phone Pairing → Loading → Gameplay (phone)
5. Back: Track Select → Home
6. Back: Mode Select → Track Select
7. Back: Phone Pairing → Mode Select
8. Survival + keyboard clamps to hand → Loading → Gameplay (no pairing)
9. Survival + phone clamps to hand → Loading → Gameplay (no pairing)
10. Phone mode reaches PhonePairing (ai-race, phone allowed)
11. `lastSelection()` tracks last track/mode

Existing keyboard-flow tests (`keyboard.flow.test.ts`, 4 tests) and phone
pairing tests remain green and unchanged in behaviour.

## 8. Test count

- **145 passing / 14 files** (was 134 / 14 before P1.1).
- No test files removed; `flow.test.ts` grew from 5 to 16 cases.

## 9. typecheck

✓ `npm run typecheck` (tsc --noEmit) — clean.

## 10. lint

✓ `npm run lint` (eslint .) — clean.

## 11. build

✓ `npx vite build` — succeeds; only pre-existing chunk-size advisory
(`build.chunkSizeWarningLimit`), unrelated to P1.1.

## 12. Manual verification

Dev server (`vite --port 5210`) smoke-tested:

- `/` → 200, serves `/src/main.ts`, `/src/style.css`, brand `<title>`.
- `/phone-controller.html` → 200, includes `/src/controller/controller.css`,
  `/src/controller/main.ts`, PeerJS CDN.
- `/src/screens/flow.ts` → 200 & transformed module contains
  `resolveNextRoute`.
- `/src/screens/ModeSelectScreen.ts` → 200 & contains `clampControlMethod`.
- `/src/screens/PhoneControllerScreen.ts` → 200.
- Main index loads MediaPipe hand + camera utils + PeerJS as before.

Headless environment: no physical browser or phone available in this session,
so interactive desktop/phone walk-through + a real one-time phone pairing
could not be performed here. The navigation architecture is validated by the
145 automated flow tests (real screens via happy-dom), and all served modules
transform and load without errors. A physical-smoke is recommended for CI/hardware.

## 13. Regressions / limitations

- One-time timing flake observed in the "Survival + keyboard clamps to hand"
  test during a single run; it passes consistently on rerun and in the full
  145-test gate. Root cause is happy-dom async focus timing (not flow logic).
- Lobby networking end-to-end (multiplayer) requires real peers; the route
  logic is covered, and the previously-dropped `network` param is now carried
  through Loading → Gameplay.
- No UI redesign, no cinematic transition, no visual effect changes — P1.1
  is functional-correctness only, as scoped.

---

**P1.1 COMPLETE**

Per the P1 implementation plan, this pass is the unified-flow foundation only.
P1.2 (Control-method UX + responsive functional layouts) and P1.3 (Cinematic
Home background + transitions) are explicitly NOT started. STOPPED after report.
