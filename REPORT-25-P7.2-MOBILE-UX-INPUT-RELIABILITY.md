# REPORT-25-P7.2-MOBILE-UX-INPUT-RELIABILITY.md

## P7.2 — Mobile UX, Responsive Gameplay & Input Reliability: **COMPLETE**

### Executive Summary

P7.2 Mobile UX & Input Reliability is **complete**. A real stuck-input bug was found and fixed: the touch controls and keyboard published a base input frame **only while held** — on full release they published nothing, leaving a stale throttle/steer frame in the shared base layer (reachable when a player toggles AUTO off mid-race). Touch buttons now bind to **Pointer Events** (`pointerdown/pointerup/pointercancel/pointerleave` + pointer capture) with a guaranteed release on every gesture, and the touch/keyboard layers now **always publish the complete state, including neutral on release**.

Touch controls were also **gated to racing only** — previously the GAS/steer/AUTO buttons rendered over every screen at ≤600px and `(pointer: coarse)`, stealing taps from menu cards. Legacy HUD overlaps on mobile AI races were fixed (SCORE corner inside the AI HUD rail, speed cluster over the steering buttons). The AI HUD now renders the chased opponent's **identity and intent** (telemetry that existed but was never displayed).

**Validation: 404/404 unit tests (14 new), E2E 24 passed / 10 intentional skips / 0 failed** (17 tests × 2 projects), flow.test.ts 16/16 ×5, qa + NavigationSystem drop-contract 16/16, typecheck/lint/prettier/build all green.

---

## 1. Root Cause: Stuck Input After Release (Real Bug Found & Fixed)

### Symptom

With touch controls active, releasing GAS (or all keys) could leave the car permanently accelerating/steering — the control "stuck". Reachable whenever AUTO was toggled off mid-race.

### Mechanism

The base layer is a **single shared slot** (`_baseFrame`) filled by `setBase()` from hand/keyboard/touch. Two paths never published a neutral frame on full release:

| Path                          | Old behavior                                                                                                                                    | Fix                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `main.ts` `applyTouchState()` | Published a frame only when `up`/`left`/`right` was held; on full release published **nothing** → stale throttle/steer remained in `_baseFrame` | Always publishes the complete touch state: `steer: left?-1:right?1:0`, `throttle: up?1: left |     | right? (auto?1:0.5) : 0` |
| `main.ts` `onKeysChanged()`   | Published while `up`/`left`/`right` held; on full key release published nothing → same stale-frame class of bug                                 | Full release now publishes `{ steer: 0, throttle: 0 }` (neutral)                             |

In a normal race this was masked by the auto-accelerate priority layer (forces throttle 1) — which is exactly why toggling AUTO off exposed it. With the fix, the base layer returns to neutral the instant nothing is held, and `frame()` (phone → auto-accel → gyro → base) returns the neutral frame.

### Pointer Event Migration (touch buttons)

`InputManager.bindTouchControls()` used `touchstart/touchend/touchcancel` **plus** `mousedown/mouseup/mouseleave` — a duplicated pipeline that can double-fire and has no cancellation-safe capture. Replaced with a single Pointer Events pipeline:

- `pointerdown` (primary button / touch only) → press + `setPointerCapture(pointerId)` (best-effort, guarded — synthetic/edge pointers throw `InvalidPointerId`)
- `pointerup` → release
- `pointercancel` → release (browser takes the gesture: scroll/call/OS gestures)
- `pointerleave` → release **only when no capture is active** (capture keeps the press while the finger slides off)
- `click` handlers for AUTO/TOUCH toggles unchanged (`click` still fires after `pointerup`)

`touch-action: none` was already present on `.touch-btn` (style.css), so no gesture-prevention CSS change was needed.

## 2. Touch Controls Gated to Racing Only

### Symptom

At `≤600px` and `(pointer: coarse)` the `.touch-controls` (GAS, steer, AUTO) rendered over **every** screen — the main menu, track/mode select, gameplay staging — and (pointer-events auto) intercepted taps meant for cards/buttons.

### Fix

A `race-active` body class is added in `startRace()` and removed in `showMenu()` (`ai-race` also toggled for AI modes, used by the HUD fixes below). The touch-controls media queries now require it:

```css
@media (max-width: 600px), (pointer: coarse) {
  body.race-active .touch-controls {
    display: block;
  }
}
```

Verified E2E: on mobile, `#touch-controls` is hidden on menu/track-select/mode-select/gameplay staging and visible immediately when a race starts (test asserts `body.race-active` present).

## 3. Mobile HUD Overlap Fixes (AI Race)

Probe measurements at 393×727 (Pixel 5) found two legacy-HUD/AI-HUD collisions during racing:

| Element                                 | Before                                                          | Fix                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `.hud-tr` (SCORE, 43×37 @ x340,y52)     | Inside the `#ai-hud` rail (fixed right, x273–393) → overlapping | Hidden for AI races on mobile: `@media (max-width:600px) { body.ai-race .hud-tr { display:none } }`                  |
| `.hud-br` (speed cluster 140×78 @ y641) | Over the right steering button (56×56 @ y599)                   | Raised above the buttons: `@media (max-width:600px), (pointer:coarse) { body.race-active .hud-br { bottom:148px } }` |
| `.touch-auto-btn`                       | 44×44 (< 48px coarse-target)                                    | Bumped to 48×48                                                                                                      |

`.hud-tl` / `.hud-tc` were verified collision-free (no change).

## 4. AI HUD — Opponent Identity & Intent Readout

`AIRuntime.getHUDTelemetry()` already returned `opponentIdentity {id,name}` and `intent`, but `AIHudState` omitted them and the HUD never rendered them. Added:

- `opponentIdentity` to `AIHudState` (telemetry pass-through, no AI changes)
- A compact readout under the lap line: `#ai-hud-opp` (`#ai-hud-opp-name` + `#ai-hud-opp-intent`) — name uppercase, intent uppercase, `OVT` suffix when overtaking
- CSS: fixed-height container (min-height 34px, hidden via `visibility` — **no layout jumps**), Orbitron 10px/8px, ellipsis-truncated at 96px

All pre-existing HUD ids (`#ai-hud`, `#ai-hud-pos`, `.ai-hud-rank-num`, `#ai-hud-gap-ahead/behind`, `#ai-hud-draft`, `#ai-hud-draft-fill`, `#ai-hud-lap`) are unchanged.

## 5. Resize & Orientation

Verified (no code change needed): `handleResize` (`main.ts`) resizes the game canvas on window resize; `ResponsiveEngine.watchViewport` covers screens incl. orientationchange. The mobile E2E probe previously confirmed **no horizontal overflow on any screen**; this is now locked in by the new racing/ceremony overflow test.

## 6. Tests Added

### Unit — `src/managers/InputManager.touch.test.ts` (14 tests)

- Pointer lifecycle: down→press + `.pressed`, up→release; **pointercancel releases**; **pointerleave releases without capture, holds with capture**; non-primary buttons ignored; capture-failure doesn't break press
- Multi-pointer: left+right independent release; 10× rapid press/release; 10× press/cancel interleaved — never stuck
- **No-stuck invariant**: with auto-accelerate off, `frame()` returns neutral after `pointerup` **and** after `pointercancel`; neutral `setBase` clears a held frame
- Toggles: AUTO click toggles auto-accelerate; TOUCH label double-tap (400ms window) toggles gyro

### E2E — `e2e/game-flow.spec.ts` (+7 tests; existing 10 untouched)

| Group                                     | Test                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Mobile Touch Controls (mobile project)    | Touch controls hidden on all menus, visible only during a race (`race-active`/`ai-race` asserted)                                 |
|                                           | GAS press/release + pointercancel lifecycle; steer button lifecycle                                                               |
|                                           | AUTO toggle via **real** touchscreen taps                                                                                         |
| AI HUD Opponent Readout (desktop project) | `#ai-hud-opp` visible, name non-empty, intent attached                                                                            |
| Mobile Race (mobile project)              | Full race completes with VICTORY CEREMONY, 3 stats, **no overflow** racing + ceremony, `#game-over-overlay` fully inside viewport |
|                                           | Retry after ceremony restarts the race (`#ai-hud` again, `race-active` intact)                                                    |
|                                           | Replay after ceremony opens/closes the replay overlay (skipped when no ghost was recorded)                                        |

## 7. Full Validation

```
E2E (chromium + mobile-chromium):     24 passed, 10 skipped (intentional project gates), 0 failed
  chromium:        11 passed / 6 skipped   (6 = 3 touch + 3 mobile-race gates)
  mobile-chromium: 13 passed / 4 skipped   (2 desktop-race + 1 desktop-only readout + 1 no-ghost replay)
Unit (vitest):     404 passed / 404  (390 baseline + 14 new InputManager.touch.test.ts)
flow.test.ts:      16/16 × 5 consecutive runs
qa + NavigationSystem (drop contract): 16/16
typecheck / lint / prettier --check / build: PASS
```

## 8. Constraints Respected

- **No AI changes**: `AICar`, `AIDecision`, `AIPersonality`, `AIRuntime` untouched; seeded determinism, replay determinism, physics, HUD telemetry, tournament progression unchanged
- **NavigationSystem drop contract untouched** (qa.test.ts spam tests still pass)
- **P7.1 E2E suite untouched** — all 10 original tests pass unchanged; no sleeps added as primary sync (reuse of `clickUntilVisible`)
- No new frameworks; no working systems rewritten; desktop feel unchanged (all new CSS is scoped to `(max-width:600px)`, `(pointer:coarse)`, `body.race-active`/`body.ai-race`)

## 9. Remaining Limitations

- Replay E2E skips when a race records no ghost (the `#results-replay` button is only shown with a ghost); the underlying replay path is covered by P7.1-era unit tests
- The mobile race tests ride the game's fast auto-ceremony (~10–15s per race); total mobile E2E runtime ~7 min
- Pointer-capture coverage is best-effort in synthetic environments (jsdom/happy-dom lack real pointer capture); the release guarantees are enforced by `pointerup/pointercancel/pointerleave` regardless

## 10. Verdict

**COMPLETE** — all P7.2 objectives (mobile UX, responsive gameplay, input reliability) met, all exit criteria green. Proceeding to P7.3 requires explicit user approval.
