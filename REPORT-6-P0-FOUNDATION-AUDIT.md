# REPORT-6 — P0 FOUNDATION COMPLIANCE AUDIT

Audit date: 2026-08-17
Scope: GDD §17 **P0 — Foundation refactor** — audit only, **no code changed.**
Method: static review of GDD contracts (§6.2, §6.3, §17) vs. current `src/`. Each item rated
**Compliant / Partial / Non-compliant** with evidence and the refactor scope that the P0
execution pass would perform.

---

## VERDICT SUMMARY

| #   | Foundation (GDD P0)             | Rating            | One-line gap                                               |
| --- | ------------------------------- | ----------------- | ---------------------------------------------------------- |
| 1   | InputManager abstraction (§6.2) | **Non-compliant** | No unified `InputFrame`; composition lives in `main.ts`    |
| 2   | GameMode config (§6.3)          | **Partial**       | `MODES` is UI-only; no runtime mode-config table           |
| 3   | AppState machine                | **Partial**       | Two parallel systems (`StateMachine` + `NavigationSystem`) |
| 4   | Focus nav                       | **Partial**       | `FocusRing` exists; 1D wrap only, no Enter/grid model      |
| 5   | Design tokens                   | **Partial**       | Two divergent token namespaces (`--*` vs `--ui-*`)         |

Exit criteria (GDD: "existing game runs under new shell; build green"): **satisfied — see gate.**

---

## 1 — INPUT MANAGER ABSTRACTION (GDD §6.2) — NON-COMPLIANT

**Required:** gameplay code never touches MediaPipe/keyboard/gamepad directly; all modes consume
a unified `InputFrame { steer(-1..1), throttle(0..1), brake(0..1), boostButton }` produced by the
Input Manager via interchangeable, mode-scoped Sources.

**Current state:**

- `src/managers/InputManager.ts` is a mutable field bag — `keys`, `touch`, `gyroTilt`,
  `autoAccelerate`, `phoneSteering`, `phoneConnected` — plus gyro permission and a hardwired `U`
  auto-accel key (InputManager.ts:31). No `InputFrame`, no `Source` interface.
- **The per-frame composition lives in `main.ts`**: 7+ call sites call `game.setHandData(...)`
  directly, mixing `HandTracker` data (main.ts:666), phone (main.ts:699), auto-accel (main.ts:711),
  gyro (main.ts:728), replay/ghost replay (main.ts:896–907). Gameplay (`Game.ts`) exposes only
  `setHandData(centerX, handsDetected)` (Game.ts:228); there is no throttle/brake/boost contract.
- Phone steering was bolted on as the highest-priority branch in the game loop (main.ts:696-700),
  confirming the composition-in-main.ts pattern rather than a source abstraction.

**Impact:** every new control method (gamepad, wheel, AR hands) still requires editing the game
loop; this is exactly what §6.2 was written to prevent. Mode input-locking (gesture only in
Survival, ignored elsewhere — §6.3) is enforced implicitly in `ModeSelectScreen`, not by the core.

**P0 execution scope (deferred, not done):** introduce `InputFrame`; `InputSource` interface
(Gesture/Keyboard/Gamepad/Touch/Phone); an `InputManager.consumeFrame()` that resolves sources by
mode config; refactor `main.ts` gameLoop to call one `inputManager.frame()`; keep `Game.setHandData`
as the adapter behind it. Regression gate = Endless Survival.

---

## 2 — GAMEMODE CONFIG (GDD §6.3) — PARTIAL

**Required:** one mode-config table carrying per-mode rules (input, spawning, scoring, finish) that
drives both UI and gameplay.

**Current state:**

- `MODES` in `src/screens/ModeSelectScreen.ts:25` is UI-presentation only (name, subtitle, gradient,
  duration, input chips). It is not consumed by `Game.ts`, the results flow, or the race director.
- Mode rules are scattered: `main.ts` branches on `modeId`/`currentModeId` for scoring, results,
  tournament, and ghost logic; `Game.ts` holds mode switches internally.
- Track↔mode compatibility and "gesture locked to Survival" live in the screen + flow, not in config.

**Impact:** mode expansion (e.g. a second gesture mode) requires edits in screens + main + Game.

**P0 execution scope (deferred):** a typed `GAME_MODES: Record<ModeId, GameModeConfig>` with
`{ id, input: InputKind[], spawner, scoring, finish, tracks }`; UI renders from it; game core reads
`mode.rules`. `ModeSelectScreen` + `Game.ts` consume the same table.

---

## 3 — APPSTATE MACHINE — PARTIAL

**Required:** a single AppState machine governing both menu and race states.

**Current state:**

- `src/core/StateMachine.ts` covers race-ish states only: `landing | menu | howtoplay | settings |
ready | racing | gameover` (StateMachine.ts:1). It is wired for gameplay gating (e.g. `ready`,
  `racing`, `isMenuBlocked()`).
- The actual menu flow is a **separate** screen router: `NavigationSystem` + `buildFlow`
  (src/screens/flow.ts) with screens `splash, loading, menu, track-select, mode-select,
phone-pairing, gameplay, lobby, settings, garage, how-to-play`.
- The two systems disagree: `StateMachine` lacks `track-select`, `mode-select`, `garage`, `lobby`,
  `phone-pairing`; `NavigationSystem` has no `racing`/`gameover`. State transitions during a race
  (pause absent entirely) are enforced ad hoc.

**Impact:** menu state and race state can drift; pause/quit logic has no single owner.

**P0 execution scope (deferred):** unify to one state set spanning menu + race, or formally define
`NavigationSystem` routes as the menu states and keep `StateMachine` as the race automaton with an
explicit one-to-one map — decided during execution, not this audit.

---

## 4 — FOCUS NAV — PARTIAL

**Required:** keyboard/gamepad focus navigation grid (GDD §19 wireframes imply arrow-key menu play).

**Current state:**

- `src/ui/core/FocusRing.ts` provides Tab focus ring, keyboard-mode detection, and ArrowUp/Down/
  Left/Right navigation **within a single `[data-focus-group]` container** — a 1D wrap list
  (FocusRing.ts:46-55).
- Groups exist: mode cards `data-focus-group="modes"`, control chips `data-focus-group=
"control-method"` (ModeSelectScreen.ts:114,158). But focus does **not** move between groups, does
  **not** support Enter-activating non-button focusables, and arrow-keys only work after Tab starts
  keyboard mode.

**Impact:** full menu traversal by keyboard/gamepad is incomplete; back buttons and cross-group
movement rely on Tab.

**P0 execution scope (deferred):** a grid/roving focus model (`FocusGrid` with column wrapping and
cross-group edges), Enter/Back activation mapping, and gamepad D-pad binding.

---

## 5 — DESIGN TOKENS — PARTIAL

**Required:** a single design-token source of truth.

**Current state:**

- `src/style.css:10-46` defines a token set (`--bg`, `--surface`, `--accent`, `--glass`,
  `--font-display`, `--radius`, `--ease`, …).
- `src/ui/ui.css:8-32` defines a **parallel, divergent** set (`--ui-bg`, `--ui-accent`, `--ui-gold`,
  `--ui-blue`, `--ui-red`, `--ui-radius`, `--ui-font-*`, …). Values duplicate (e.g. `--ui-bg`
  `#06080c` vs `--bg` `#06080c`) and sometimes disagree (`--ui-accent` `#2dff9a` vs `--accent`
  `#00ff41`).
- Raw literals remain: 65 hex + 133 `rgba()` in the two sheets (e.g. `ModeSelectScreen` gradient
  strings embed rgba inline).

**Impact:** theme changes must be applied in two namespaces; brand colors are inconsistent
(`#00ff41` vs `#2dff9a`); mode gradient accents cannot be themed.

**P0 execution scope (deferred):** collapse to one `:root` token set; migrate `--ui-*` consumers;
route mode gradients through tokens; add spacing/type-scale/radii/glow tokens.

---

## CROSS-CUTTING FINDING

The Phase A phone-steering work (prior phase) slightly deepened gap #1 — `phoneSteering` was added
to `InputManager` as a bare field and composed in `main.ts` rather than as a `PhoneSource`
implementing an `InputSource` contract. It remains fully functional; the P0 execution pass should
lift it into the source model rather than reverting it.

---

## VALIDATION GATE

Audit pass changed zero files. Baseline remains green:

- `npm run typecheck` — OK
- `npm test` — 9 files, 68 passed
- `npm run lint` — OK
- `npm run build` — OK (dist: main 637 kB JS, phone-controller 3.9 kB JS)

**Gate verdict: PASS** (no code delta; gate re-run on the next instruction).

---

## STOP POINT

P0 audit complete. **No refactor performed.** Awaiting instruction to execute the P0 refactor
(InputFrame/source model → GameMode config → AppState unification → focus grid → token collapse),
which I will implement as a single item with its own validation gate, then report and stop again.
