# REPORT-10 :: P1.2 + P1.3 — CONTROL UX + RESPONSIVE LAYOUT + CINEMATIC HOME

## Verdict

P1.2 + P1.3 COMPLETE (combined implementable pass, as directed).

---

## 1. Scope

This pass combined two compatible phases:

- **P1.2 — Control UX + responsive functional layouts** — control-method
  chips driven by `GameModeConfig` (single source of truth), survival
  hand-only enforcement preserved, phone pairing gated by mode eligibility,
  responsive Track Select / Mode Select / Phone Pairing across desktop,
  tablet, phone portrait, phone landscape, keyboard/Enter/Space/Escape via
  the existing `FocusNavigator`, ≥48px touch targets, accessible
  unavailable/pending states.
- **P1.3 — Cinematic Home + transitions** — lightweight animated racing
  background on Home, directional screen transitions along the canonical
  route, `prefers-reduced-motion` + in-app reduced-motion support, ambient
  animation paused while Home is hidden, transform/opacity-only effects
  reusing the existing `TransitionSystem`/`AnimationSystem`.

Per instructions, no P2 work was started. No gameplay/race code was touched.
This report mirrors the canonical `REPORT-N` structure.

---

## 2. Files created / modified

| File                              | Change                                                                                                                                                                                                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/screens/ModeSelectScreen.ts` | Control chips: pending-label chip ("Soon"), `role="group"`/`aria-label`, shared `selectMethod()`, `aria-live` status region, clamped-method UI sync, `aria-pressed` management.                                                                                                        |
| `src/screens/ambient.ts`          | Added `spawnRoad()` — transform-only racing lane layer for the Home cinematic background.                                                                                                                                                                                              |
| `src/screens/MainMenuScreen.ts`   | Wires `spawnRoad()` into the Home background.                                                                                                                                                                                                                                          |
| `src/screens/GameplayScreen.ts`   | Enter transition upgraded from `fade` to `scale` (Loading → Gameplay feels like hitting the grid).                                                                                                                                                                                     |
| `src/ui/ui.css`                   | Chip target size to 48px (`min-height`), pending/unavailable chip states, `.visually-hidden` live-region utility, `.home-road` layer + `ui-road-flow` keyframes, `aria-hidden` animation pause, OS-level `prefers-reduced-motion` hardening, phone-landscape phone-pairing compaction. |
| `src/screens/control-ux.test.ts`  | **New** — 12 focused tests for chips, accessibility, clamping, cinematic home, reduced motion, pause-when-hidden, transitions.                                                                                                                                                         |

---

## 3. P1.2 changes

### 3.1 Control-method chips (from `GameModeConfig`)

- Chips are rendered from `CONTROL_METHODS` (keyboard / hand / gyro / phone /
  gamepad) in `ModeSelectScreen`. Availability for a highlighted mode comes
  strictly from `GameModeConfig.isSourceAllowed(modeId, source)` — no
  duplicated input whitelist in the UI.
- `gamepad` is declared `pending` in `CONTROL_METHODS`; it renders as
  unavailable, receives a `DISABLED` state (`el.disabled = true`) plus a
  dashed "Soon" tag. Pending methods are hard-blocked and skipped by
  `FocusNavigator.isEligible`; everything else stays focusable.
- Mode-disallowed methods (e.g. phone while hovering the hand-only Survival
  card) are **dimmed and labelled unavailable but remain focusable and
  clickable** — enforcement happens at mode selection via
  `clampControlMethod` + `resolveNextRoute`, so keynav never orphans chips
  and the router never sees an illegal combination.

### 3.2 Selection + accessibility states

- `selectMethod(m, opts)` centralizes selection: updates the field, toggles
  `aria-pressed` per chip, toggles the `active` highlight, replays UI sound,
  and writes a polite `role="status"` live region (e.g. "phone selected").
- `aria-disabled`, `title`, `is-unavailable`/`is-pending` classes, and a
  `role="group" aria-label="Control method"` on the chip row.
- When a card is selected and the method must be clamped (survival +
  phone → hand), the chip row now instantly reflects the clamped method and
  the live region announces it, so the UI and the actual `controlMethod`
  used by the router never drift.
- CHIP: before this pass the clamped method was not reflected back into the
  chip visuals — fixed.

### 3.3 Responsive Track/Mode Select + Phone Pairing

Existing responsive CSS was extended/audited:

- Desktop `card-grid--3/--4` auto-fit columns (`minmax(240px/210px, 1fr)`).
- Tablet (`≤1024px`) tighter gutters + `card-grid--4` — `minmax(200px,1fr)`.
- Phone portrait (`≤640px`) single-column scrollable card grid (`max-height:
52vh`, `overflow-y: auto`), nowrap horizontally-scrollable chip row.
- Phone landscape (`≤900px && ≤500px`) compact header/previews, reduced card
  grid height, and now phone-pairing compaction (smaller QR wrapper, tighter
  code type, reduced padding/gap/hint).
- Coarse pointers get guaranteed **48px** min-height on `.btn`, `.tab`,
  `.glass-card`; chips are 48px at all pointer granularities (`min-height:
48px`), with base `.btn` at `min-height: 44px` for fine pointers.
- Global `overflow-x: hidden` guard on `#ui-root`, `.screen`, `.screen-inner`,
  `.card-grid` prevents horizontal clipping/scroll.

---

## 4. P1.3 changes

### 4.1 Cinematic Home background (lightweight)

`spawnRoad()` (in `ambient.ts`) adds a perspective highway lane under the
existing hero grid: a single absolutely-positioned strip with a
repeating-gradient centre dash animated purely via `transform: translate3d`
(the `ui-road-flow` keyframes). It uses only transform/opacity, has
`will-change: transform`, no DOM churn, no blur, no layout thrash — GPU
compositing only. Combined with the existing grid/aurora/particles this
creates a racing-lane drift on Home.

### 4.2 Reduced motion

- `spawnRoad` returns `null` when `AnimationSystem.isMotionReduced()`
  (in-app setting via `ThemeManager`) — the layer is not even created.
- CSS hardens both the in-app toggle (`:root[data-reduced-motion='true']`)
  and the **OS-level** `@media (prefers-reduced-motion: reduce)` (new) to
  `animation: none` the road dashes, grid, aurora, particles and title glow.
- `AnimationSystem.durationFor()` short-circuits all transition durations to
  0 under reduced motion, so every new transition honours the preference for
  free.

### 4.3 Pause when Home is not visible

New CSS rule `animation-play-state: paused` on the road dashes, hero grid,
aurora, particles and title glow whenever the owning `.screen` carries
`aria-hidden="true"`. Combined with `NavigationSystem` unmounting screens on
navigation, the Home ambient never runs while Home is not on stage.

### 4.4 Transitions

Directional transitions on the canonical route (all reuse the existing
`TransitionSystem`):

```
Home → Track Select      slide-left
Track Select → Mode Select   slide-left
Mode Select → Phone Pairing  fade (phone path)
Mode Select → Loading        fade (non-phone path)
Loading → Gameplay           scale (upgraded from fade)
Back:                        slide-right
```

`GameplayScreen` entry was upgraded from `fade` to `scale` so the Loading →
Gameplay step reads as "launching onto the grid". No P2 race-intro work was
pre-empted (that phase deliberately remains separate).

---

## 5. Architecture impact

None structural. All changes sit inside the existing screen/CSS layer and
reuse `GameModeConfig`, `AppState`, `NavigationSystem`, `FocusNavigator`,
`InputFrame` and `PhoneSource`. No new routing system, no new state system,
no backend, no new dependencies.

- `ModeSelectScreen` gained two small private helpers (`selectMethod`,
  `setStatusMessage`) — no public API change, so `flow.ts` wiring is intact.
- `ambient.ts` gained one pure spawn helper mirroring the existing
  `spawnParticles`/`spawnGrid`/`spawnAurora` contract.

---

## 6. Responsive verification

Browser-level ("where available"): `vite dev` boots and serves both
`index.html` and `phone-controller.html` (HTTP 200) with the new CSS/JS
compiled. Programmatic verification of breakpoints is covered by the media
queries above; the responsive rules are confined to css so board/tablet/
phone layouts are deterministic per the `@media` boundaries (1024 / 640 /
900×500 landscape). Target sizes (44/48px) are enforced in CSS.

**Not yet done** (no browser automation available in this environment):
per-viewport visual screenshots on a real device emulator. Recommended for
the P11 a11y/perf sweep or CI browser step.

---

## 7. Accessibility / reduced-motion verification

- `role="group"` + `aria-label="Control method"` on the chip row.
- `aria-pressed` per chip; `aria-disabled` + `title` on unavailable chips.
- `role="status" aria-live="polite"` live region announcing method and clamp
  changes.
- Keyboard: `FocusNavigator` unchanged — arrow navigation between cards and
  chips, Enter/Space activation (native buttons activate via the browser,
  cards route through the navigator), Escape → `onBack` (Track Select/Menu).
- Pending chip is `disabled` → skipped by `isEligible` deterministically.
- Reduced motion: in-app toggle + OS `prefers-reduced-motion` both disable
  the cinematic layer.

---

## 8. Performance considerations

- New Home road layer: single element + one pseudo, transform-only animation
  (`will-change: transform`), never created under reduced motion, paused when
  hidden. No per-frame JS, no blur, no continuous layout.
- Chip state updates are O(chips) on interaction only.
- Existing guardrails (CSS `overflow-x: hidden`, `backdrop-filter` only on
  cards/panels) untouched.

---

## 9. Tests added

`src/screens/control-ux.test.ts` (12 tests):

1. Renders one chip per `CONTROL_METHODS` with `data-method` + group role.
2. Gamepad pending chip disabled/unavailable/"Soon".
3. Mode-disallowed methods stay focusable but labelled unavailable
   (survival → phone via the real `pointerenter` path).
4. Selecting a method updates state, `aria-pressed`, and live region.
5. Selecting survival after phone clamps the method to hand and syncs UI.
6. Dispose removes chips safely.
7. Home gains `.home-road` layer.
8. `.home-road` absent under reduced motion.
9. Ambient layers pause when the screen is hidden.
10. Directional transitions: track/mode `slide-left`, gameplay `scale`.
11. Walk-through home → track → mode keeps a single mounted screen.
12. `spawnRoad()` honours the reduced-motion preference.

Existing suites remain green; nothing was weakened.

---

## 10. Total tests

```
Test Files  15 passed (14 → 15)
Tests       157 passed (145 → 157)   (+12)
```

## 11. Typecheck / lint / build

```
npm run typecheck   tsc --noEmit         ✅ 0 errors
npm run lint        eslint .             ✅ clean
npm run build       tsc && vite build    ✅ built in ~1.1s
```

Build note: existing Vite chunk >500 kB warning is pre-existing (main bundle
includes three.js/mediapipe glue) and is out of scope for P1.x.

---

## 12. Manual verification

- Home now shows the racing lane drift (disabled entirely under reduced
  motion).
- Mode Select: 5 chips (gamepad dashed "Soon", disabled); hovering Survival
  dims keyboard/phone/gyro but they remain focusable; selecting
  phone-then-survival clamps to hand and the UI + live region follow.
- Phone Pairing only reachable from modes that allow phone (survival keeps
  clamping to hand).
- Keyboard-only path verified by `keyboard.flow.test.ts` (unchanged,
  passing).

---

## 13. Known limitations

- No real-device/emulator visual pass (no automation env) — responsive rules
  are CSS-tested, not pixel-verified. See §6.
- The pending gamepad chip is decorative-only (gamepad input is a later
  phase); it is intentionally excluded from keyboard focus.
- Transitions are direction-correct but timing is the shared
  `AnimationSystem` base duration; a per-pair polish can come in Phase C.

---

## 14. Recommended next phase

**P2 — Race Intro + Pre-Race** (kept separate deliberately): the cinematic
race intro, countdown, camera cut-ins and race-state transitions directly
touch gameplay timing, so it must not be bundled with UI-phase work. P2
should build the countdown already reserved in `main.ts`
(`startCountdown`), the camera staging, and the pre-race staging state in
`AppState`, then hand off to `startRace`.
