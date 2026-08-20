# REPORT-31 — P10 COMPLETE: REPLAY + PHOTO MODE

## Objective

Complete the P10 phase ("Replay + Photo mode" per GDD) in a single run on the
frozen P9 baseline: implement every still-missing GDD requirement for the replay
camera tool rail, slow-motion playback, free camera, and photo mode (depth of
field + screenshot capture with Web Share). Preserve all P1–P9 contracts (race
physics, seeded deterministic AI, RaceDirector authority, replay determinism,
NavigationSystem, Input architecture, progression formulas, RaceResultGate
idempotency, ProfileManager, ContentCatalog ownership/pricing,
mobile/keyboard/gyro/hand controls, tournament rules, multiplayer), and STOP
after P10 — no P11 started.

## Architecture Before P10

- **Replay runtime (P9)**: `ReplayRuntime` + `input-replay` records normalized
  `InputFrame`s in live races and plays them back deterministically at the input
  boundary; playback awards zero progression. Session-only by design.
- **Photo replay (P8)**: `ReplayOverlay` presents a just-finished live race with
  a camera/orbit presentation layer; `#results-replay` opens it; Chase / Orbit /
  Cinematic camera modes exist (`game.cameraMode` + `game.updateCamera`).
- **Post-processor (`PostProcessor.ts`)**: renderer pipeline with bloom,
  vignette, and a composite pass; filters (`grain`, `contrast`) existed for
  photo, but captures were taken with a raw `renderer.render` call that bypassed
  the filter pipeline.
- **Replay controls**: `#replay-cam-chase/orbit/cine` buttons plus dead
  `#replay-play-pause` / `#replay-scrubber` scaffolding (no playback scrubber was
  ever implemented).

## Audit Findings (locked during this run)

The race recorder and "replay after every race" (`#results-replay`, shown when
`playerDistance > 100`) already existed. Missing were:

1. **FREE camera** — a free-fly camera usable during replay with WASD + mouse look.
2. **SLOW-MO** — slow-motion replay playback (button + hold-Shift).
3. **Depth of field (FOCUS slider)** — DoF pass wired into the post-processor.
4. **Web Share screenshot** — capture to file + share prompt via Web Share API.
5. **Replay keyboard shortcuts** — Shift (slow-mo), C (free camera), F12 (photo).
6. **Filters baked into captures** — screenshots must go through the post-processor.

Plus removal of the dead `#replay-play-pause` / `#replay-scrubber` scaffolding.

## Architecture After P10

The replay camera tool rail is extended to a full GDD viewer:

```
                 REPLAY CAMERA TOOL RAIL (replay overlay)
  ┌──────────────────────────────────────────────────────────────┐
  │  CAMERA: [CHASE] [ORBIT] [CINEMATIC] [FREE]                  │
  │  SPEED:  [SLOW-MO]                                           │
  │  FILTERS: GRAIN [—] CONTRAST [—] FOCUS [—]                  │
  │  [PHOTO] [EXIT]                                              │
  └──────────────────────────────────────────────────────────────┘
```

- **Free camera** (`src/replay/viewer.ts`): a pure, THREE-free controller.
  `stepFreeCamera(state, keys, dt)` applies yaw-rotated ground-plane translation
  (WASD/arrow keys), clamps to world `BOUNDS` (x±30, y 0.5–20, z −120..6);
  `lookFreeCamera` wraps yaw and clamps pitch (±1.35 rad). The game loop drives
  `game.freeCameraPos` / `game.freeCameraRot` from the viewer state; the existing
  `Game.updateCamera('free')` branch consumes them.
- **Slow motion** (`slowMoDelta(dt, active)`): returns `dt * SLOW_MO_SCALE`
  (0.35) when active; the game loop applies it during replay playback so replay
  time runs at 35% speed. Two activation paths: the `#replay-slow-mo` button
  (toggle) and holding `Shift` (momentary).
- **Depth of field**: `PostProcessor` gains a `focus` uniform (0–1) and a
  two-pass DoF blur (`dofHRT` / `dofVRT` full-res targets). When `focus > 0.001`
  the scene render is blurred and blended back by the focus amount; otherwise the
  blur passes are skipped (zero cost in normal play).
- **Photo mode**: `capturePhoto()` hides the replay overlay, calls
  `postProcessor.render(...)` (so bloom/grain/contrast/focus are all baked in),
  reads `canvas.toBlob()`, and attempts `navigator.canShare/share({files})`;
  falls back to a `downloadBlob` anchor click (download filename
  `virtual-steering-photo-*.png`).
- **Keyboard shortcuts** (gated on `isReplaying`): `Shift` hold = slow-mo,
  `C` = toggle free camera, `F12` = photo capture.
- **Mouse look**: pointer-drag on `#game-viewport` while in free-camera mode
  drives yaw/pitch.

## Free Camera Controller Design

`src/replay/viewer.ts` — pure functions, no THREE dependency (unit-testable):

```
FreeCameraState { x, y, z, yaw, pitch }
VIEWER_DEFAULTS   // spawn pose
MOVE_SPEED = 8    // units/sec
YAW_SPEED = 0.004 / PITCH_SPEED = 0.004 (per px of drag)
PITCH_LIMIT = 1.35
BOUNDS { minX, maxX, minY, maxY, minZ, maxZ }

stepFreeCamera(state, keys, dt): state  // yaw-rotated W/A/S/D translation + clamp
lookFreeCamera(state, yawDelta, pitchDelta): state  // yaw wrap + pitch clamp
slowMoDelta(dt, active): number                    // dt * 0.35 when active
```

- Keyboard movement is relative to yaw (W = forward along view, A/D = strafe),
  computed with `sin`/`cos` of the yaw — matches player expectation in a 3D view.
- Position is clamped to world bounds so the camera cannot fly into the void.
- `slowMoDelta` is a trivial pure function making the slow-mo math directly
  testable.

## Files Created / Modified

**Created:**

- `src/replay/viewer.ts` — pure free-camera + slow-mo controller.
- `src/replay/viewer.test.ts` — 10 unit tests for the controller.
- `REPORT-31-P10-COMPLETE-REPLAY-PHOTO-MODE.md` — this report.

**Modified:**

- `index.html` — added `#replay-cam-free` and `#replay-slow-mo` buttons to the
  CAMERA rail; added `#replay-filter-focus` slider (0–1) to FILTERS; removed dead
  `#replay-play-pause` / `#replay-scrubber` scaffolding (`replay-controls` /
  `replay-timeline`).
- `src/ui/ui.css` — removed dead `.replay-controls`, `.replay-icon-btn`,
  `.replay-timeline` rules.
- `src/graphics/PostProcessor.ts` — added `focus`, `dofHRT`/`dofVRT` targets,
  DoF blur passes, `tDof`/`grain`/`focus`/`resolution`/`time` uniforms, composite
  shader DoF blend + deterministic grain; per-pass blur resolution; resize /
  dispose cleanup.
- `src/main.ts` — P10 wiring: viewer state (`viewerCam`, `viewerSlowMo`,
  drag/pointer state), game-loop replay block (slow-mo delta + free-camera step),
  `setReplayCam(mode)` helper, `#replay-slow-mo` toggle, focus-slider handler,
  `capturePhoto()` / `downloadBlob()`, Shift/C/F12 keyboard shortcuts, viewport
  pointer drag look.

## Tests Added

- **`src/replay/viewer.test.ts` (10 tests)**: forward/back strafe translation;
  yaw-relative A/D movement; W+A diagonal normalized; bounds clamping on all
  axes; look yaw wrap (≥2π and <0); pitch clamp at both limits; `slowMoDelta`
  returns `dt * 0.35` when active and `dt` when inactive; default pose seeded
  from `VIEWER_DEFAULTS`; step is frame-rate independent (double dt → double
  displacement).
- Full unit suite now **581/581 passing across 42 files** (P9 baseline: 571/41).

## Browser Verification

A temporary probe spec (`e2e/p10-replay-viewer.probe.spec.ts`) plus a temporary
`window.__p10Probe` introspection hook in `src/main.ts` were used to verify the
P10 viewer in the real browser. **Both were deleted after verification** (per
phase rules — no probe residue). Key verified behaviors (desktop + mobile):

1. Replay opens after a race (`#results-replay` → overlay visible) — PASS
2. New controls present: `#replay-cam-free`, `#replay-slow-mo`, `#replay-filter-focus` — PASS
3. Dead scaffolding absent: `#replay-play-pause`, `#replay-scrubber` count 0 — PASS
4. Overlay opens into Orbit mode (`camOrbit` active, `cameraMode === 'orbit'`) — PASS
5. FREE button activates free camera (`camFree` + `cameraMode === 'free'`) — PASS
6. `C` key toggles free ↔ orbit — PASS
7. WASD moves the free camera (z-position changes) — PASS
8. SLOW-MO button toggles slow-mo on/off — PASS
9. Hold `Shift` enables slow-mo, release disables — PASS
10. FOCUS slider drives `postProcessor.focus` (>0.5 at 0.6) — PASS
11. PHOTO MODE triggers a screenshot download (`virtual-steering-photo-*.png`) — PASS
12. EXIT closes overlay and resets camera to chase + focus 0 — PASS
13. No console errors during the whole flow — PASS

## Bugs Found and Fixed

1. **`const`-hoisting TDZ in the viewer wiring (probe incident)** — a temporary
   `__p10Probe` hook was initially inserted at module top-level inside the
   `panelToggle` block, referencing `game`/`viewerCam` before declaration. It was
   removed immediately and re-added at the correct location (the replay wiring
   block) for verification, then deleted. Net final state: no probe code.
2. **Dead scaffolding left in the DOM** — `#replay-play-pause` / `#replay-scrubber`
   (`.replay-controls`, `.replay-timeline`) rendered empty controls on the rail.
   Removed from markup + CSS. Confirmed absent in browser.
3. **Captures bypassed the post-processor** — the old photo path used a raw
   `renderer.render` so grain/contrast/focus were not in the screenshot. Now
   `capturePhoto()` routes through `postProcessor.render(...)`; verified the
   download file name and that no errors fire.

## Regression Results

- `npx vitest run` → **581 passed (42 files)** — PASS
- `npm run typecheck` → PASS
- `npm run lint` → PASS
- `npx prettier --check .` → PASS
- `npm run build` → PASS
- `npx playwright test --project=chromium` → **14 passed / 6 skipped / 0 failed**
  (matches P8/P9 baseline)
- `npx playwright test --project=mobile-chromium` → **13 passed / 7 skipped / 0 failed**
  (matches P8/P9 baseline)
- P10 browser probe (desktop + mobile, with probe spec + hook, both deleted after) → **PASS**

## Known Limitations

- Slow motion changes replay wall-clock pace (replay timer counts down at 35%);
  the underlying recorded frame stream is unchanged (determinism preserved).
- The FOCUS slider drives a fixed-plane DoF approximation (blur + blend), not a
  lens-plane focus pull; matches GDD photo-mode intent without a depth buffer.
- Web Share is used where `navigator.canShare({files})` is true; otherwise the
  download fallback is used (covers headless/desktop browsers).
- Screenshot capture briefly hides the replay overlay (so the UI is not in the
  photo); the overlay returns immediately after.

## Required Invariants

- RaceResultGate is the only progression reward boundary — preserved.
- Replay playback awards zero progression — preserved (P9 verified; unchanged).
- ProfileManager remains the progression persistence authority — preserved.
- ContentCatalog remains the cosmetic authority — preserved.
- Replay determinism / input-boundary design — preserved (P10 adds only camera
  and presentation, not simulation).
- AI behavior remains deterministic — preserved.
- Keyboard/touch/phone/hand input intact — preserved.
- Multiplayer behavior intact — preserved.
- NavigationSystem contracts intact — preserved.
- Mobile layout behavior intact (no overflow) — verified (baseline E2E green).
- No debug hooks / probe residue in final tree — verified (`grep` clean).

## Exact Validation Commands

```bash
npx vitest run                      # 581 passed (42 files)
npm run typecheck                   # PASS
npm run lint                        # PASS
npx prettier --check .              # PASS
npm run build                       # PASS
npx playwright test --project=chromium        # 14 passed / 6 skipped / 0 failed
npx playwright test --project=mobile-chromium # 13 passed / 7 skipped / 0 failed
```

## Final Verdict

**PASS.** P10 implementation complete: the replay viewer now satisfies the GDD
camera tool rail (FREE/ORBIT/CHASE/CINEMATIC), SLOW-MO (button + hold-Shift),
photo mode with depth of field and Web Share screenshot capture, and replay
keyboard shortcuts (Shift/C/F12) — with filters baked into captures. All
unit/type/lint/format/build gates green, both E2E projects match the P9 baseline,
targeted browser verification passed on desktop and mobile (probe removed after),
and all P1–P9 regression contracts remain intact. STOP after P10 — no P11
started.
