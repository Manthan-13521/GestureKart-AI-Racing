# REPORT-13-P3.1-GHOST-REPLAY-AUDIT

**Pass:** P3.1 — Ghost / Replay subsystem audit + integration test coverage.
Implemented strictly from on-disk code + `REPORT-ROADMAP-NEXT-PHASES.md`.
The audit read the full `src/replay/*` surface, the `main.ts` replay wiring,
and the `#ghost-hud` markup/CSS; every source file was byte-verified against
HEAD before any change.

---

## 1. Verdict

**COMPLETE.** The replay subsystem now behaves correctly across the full race
lifecycle: recording starts at GO exactly once per attempt, ghost playback and
the duel HUD advance only while the race is running (not during intro /
countdown / game-over), retries reset sector and delta state with no stale
values leaking between attempts, and cancelled runs can never become stored
records — even under a stray `finish()` callback. The audit also uncovered and
fixed three pre-existing unit-mismatch bugs that had made the ghost **never
load in the first place** (negative live distance, double-quantized frames,
off-by-one encoded size). All gates green (211 tests / 21 files, typecheck,
lint, build).

## 2. Audit method

- Read-only pass over `src/replay/{runtime,recorder,store,codec,player,logic,ghost,hud,types}.ts`,
  the `main.ts` wiring (`arm` → `begin` → `tick` → `finish` → `abort`/`dispose`),
  `index.html` `#ghost-hud` markup, and the `#ghost-hud`/`.hidden` CSS rules.
- `runtime.ts` was hash-verified identical to HEAD; audit facts were
  re-confirmed against the committed tree before acting.
- No external/GDD re-reads — everything was validated against code that is on
  disk and the requirement list in the roadmap file.

## 3. Requirements → status

| P3.1 requirement                                                          | Status   | Where / how                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recording begins at GO exactly once per attempt; no pre-GO recording      | ✅       | `ReplayRuntime.begin()` → `recorder.begin()` is the only activation; called once per attempt from `startGame()` behind the `game.started` guard (`main.ts:531`). `Recorder.pump()` gates on `active` + monotonic `raceTime`; frames emitted on a 30 Hz grid, never tied to FPS. |
| Ghost playback / fade-in must begin at GO                                 | ✅ FIXED | `tick()` now early-returns on `!recorder.isActive`, so ghost + HUD advance only after `begin()` (GO). `arm()` no longer sets `ghost.visible = true`; the first post-GO `update()` makes the ghost appear.                                                                       |
| Ghost/HUD must not show stale values from a previous attempt              | ✅ FIXED | `GhostHud.reset()` now force-writes its default state (bypassing the value gate), so a retry clears the previous delta/now/sectors in the DOM instead of leaving `+0.03s`-style leftovers.                                                                                      |
| First run with no stored best races normally, no ghost/UI, run recorded   | ✅       | `arm()` leaves `player = null`, keeps the HUD hidden, and notifies "No ghost on this track yet — your run will be recorded". No delta HUD appears (tick only shows it with a ghost present).                                                                                    |
| Best/last run stored locally; schema changes don't break playback         | ✅       | `ReplayStore.save()` writes Best + Latest; every read is fail-safe (`safeDecode`, `isValidRun`, version check on load). `arm()` skips a stored replay whose `version` doesn't match `REPLAY_VERSION`.                                                                           |
| Sector timing aligned to race start; retry resets sectors                 | ✅       | `sectorTimes` captured on the race clock against the ghost's recorded `sectorDists`; reset in `arm()`, `begin()`, and `abort()`. Verified across a retry in tests.                                                                                                              |
| No stale callbacks may mutate the next race (finish after cancel, unload) | ✅ FIXED | `abort()` now also clears `player` + `outcome`. `finish()` after abort/quit can't persist: `Recorder.finish()` returns `null` when inactive and `runtime.finish()` skips `save()`. `GhostRenderer.fadeOut()` now stops on `dispose()` (built guard).                            |
| A cancelled/incomplete race must not become a stored record               | ✅       | Only the `gameover` transition calls `finish()`; menu/title navigation and `beforeunload` call `abort()`/`dispose()` which never persist. Covered by tests.                                                                                                                     |
| Delta HUD = You-vs-You only; no ghost HUD in other modes                  | ✅       | HUD updates are gated on a ghost player existing; the ghost is only loaded for modes with `features.ghost` (versus). Non-versus modes keep the HUD hidden.                                                                                                                      |
| Player must always record (every mode)                                    | ✅       | `Recorder` runs in every mode; the store is keyed per track+mode.                                                                                                                                                                                                               |

## 4. Concrete gaps found and fixed

1. **`Recorder.distance` unit mismatch (bug).** Live distance integrated with
   `dt = (t − prevT) / 60` where `t` is in seconds and `prevT` is stored in
   1/60 s ticks — mixing units produced large negative distances (and negative
   `sectorDists`), which also poisoned the persistence path. Fixed to
   `t − prevT / 60`, matching the decoded-distance formula the class documents.
2. **`recordingToReplayData` double-quantized frames (bug).** `emit()` already
   stores ticks / cm-offset / 0.05 m/s units; the converter re-applied
   `t*60`, `(x+2)*100`, `speed*20`, inflating timestamps 60× and offsets so
   the codec rejected every decode → ghosts never loaded. Now passes frames
   through as already-encoded.
3. **`codec.ts` `HEADER_FIXED` off-by-one (bug).** Constant summed to 25 but
   the header is 24 bytes; every encoded replay was one byte longer than the
   decoder's strict length check, so `decodeReplay` always returned `null`
   (ghost never loaded). Constant corrected to the real field sum.
4. **Ghost playback before GO (defect).** `main.ts` calls `tick()` every
   frame, so pre-GO frames ran the ghost + HUD while `raceTime` was still 0.
   `tick()` now gates ghost/HUD work on `recorder.isActive` (GO boundary).
5. **Ghost mesh visible during staging/intro (defect).** `arm()` set
   `ghost.visible = true` before GO; removed — the ghost appears at the first
   post-GO tick.
6. **Stale delta HUD across retry (defect).** `GhostHud.reset()` rewrote
   internal state but the value-gated `update()` saw no _change_, leaving the
   previous attempt's delta on screen. `update()` gained a `force` flag used
   by `reset()`.
7. **`abort()` left stale player/outcome (hygiene).** Now clears both so a
   stray `finish()`/tick can't consult a stale ghost in the next attempt.
8. **`GhostRenderer.fadeOut()` kept running after `dispose()` (hygiene).**
   The rAF step now bails when `built` is false.
9. **`GAME_MODES[mode].features.ghost` deref (robustness).** Optional-chained
   to `?.features?.ghost`.

## 5. Files changed

| File                                  | Change                                                                                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/replay/runtime.ts`               | `arm()` no longer reveals the ghost early + optional-chained mode lookup; `tick()` gates ghost/HUD on `recorder.isActive`; `abort()` clears `player` + `outcome`. |
| `src/replay/recorder.ts`              | Live distance integration unit fix (`t − prevT/60`); `recordingToReplayData` stops double-quantizing already-encoded frames.                                      |
| `src/replay/codec.ts`                 | `HEADER_FIXED` corrected to the real 24-byte header (removed spurious `+1`).                                                                                      |
| `src/replay/hud.ts`                   | `update(state, force)` with `reset()` force-writing defaults so retries show `+0.00s` / `S1 —`.                                                                   |
| `src/replay/ghost.ts`                 | `fadeOut()` step stops on `dispose()` (`built` guard).                                                                                                            |
| `src/replay/replay-lifecycle.test.ts` | New integration suite (6 tests).                                                                                                                                  |

## 6. Tests added (`src/replay/replay-lifecycle.test.ts`)

Drives `ReplayRuntime` with a real `THREE.Scene`, a `GhostHud` over a
`#ghost-hud` DOM fixture, a mocked storage `ReplayStore`, and `now` stub —
mirroring the `main.ts` wiring exactly (`arm → begin → tick → abort/finish`).

- does not record before GO; recording starts at GO exactly once per attempt
- ghost stays invisible and frozen before GO; playback begins at GO
- first run (no ghost) races normally with no delta HUD and records a new best
- retry resets sectors and delta — no stale values leak into the next attempt
- a cancelled run is never stored, even under a stray `finish()` callback
- cleanup via `dispose()` leaves stale callbacks inert

## 7. Gates

- `npx vitest run` — **211 tests / 21 files passed**
- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run build` — passed (666 kB main chunk, unchanged warning)
- `npx prettier --check` — clean on all changed files
