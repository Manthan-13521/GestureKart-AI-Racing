# REPORT-ROADMAP-NEXT-PHASES.md

**Task type:** Roadmap discovery / audit ONLY. **No implementation was performed.**
**Date:** 2026-08-17

---

## 1. Current project phase status (verified on disk)

| Phase     | Title                                | Status                                    | Evidence                                                                                             |
| --------- | ------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| P0        | Foundation refactor (audit + config) | COMPLETE                                  | REPORT-6/7/8; AppState, InputManager, GameModeConfig                                                 |
| P1.1      | Unified Play→Track→Mode flow         | COMPLETE                                  | REPORT-9; NavigationSystem, flow.test.ts                                                             |
| P1.2+P1.3 | Control UX + cinematic home          | COMPLETE                                  | REPORT-10; git log `1471b59` (P1.2 + P1.3)                                                           |
| P2.1+P2.2 | Race intro + countdown pipeline      | COMPLETE                                  | REPORT-11; `src/core/RaceIntro.ts`, `Countdown.ts`, `RaceStartPipeline.ts`; `AppState` `intro` phase |
| P2.3+P2.4 | Race intro UX / gameplay entry       | **NOT IMPLEMENTED (was never persisted)** | No `#intro-overlay`, no `#game-hud`, `UIManager.ts` still the 25-line original; no REPORT-12 on disk |
| P2.5      | _(attempted label)_                  | **UNDEFINED**                             | Zero occurrences in any doc/script/HTML                                                              |
| P3.1      | _(attempted label)_                  | **UNDEFINED**                             | Zero occurrences in any doc/script/HTML                                                              |

**Gate (verified by `npx vitest run` this audit): 18 test files · 180 tests passing.**
typecheck/lint/build were not re-verified this pass (read-only audit); the last recorded
state (REPORT-11) was GREEN at 180 tests.

> ⚠️ **Integrity flag:** A prior assistant pass claimed P2.3+P2.4 were implemented
> (REPORT-12, 194 tests, `UIManager.test.ts`, `RaceStartPipeline.ui.test.ts`). **None of
> these artifacts exist on disk.** `git status` shows only the P2.1/P2.2 changeset
> (Countdown/RaceIntro/RaceStartPipeline new + AppState/Game/main modified) and
> REPORT-11. The real gate is 180 tests (matching P2.1/P2.2), not 194. All roadmap
> conclusions below are grounded in the on-disk state, not in that earlier claim.

---

## 2. Authoritative source documents discovered

| #   | Source                                                      | Significance                                                                                                                                                                   |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `GDD/MASTER-GDD.md` §17 "DEVELOPMENT PHASES (REVISED v2.0)" | **The single authoritative phase table (P0–P11)** with scope + exit criteria.                                                                                                  |
| 2   | `GDD/MASTER-GDD.md` §18 "FEATURE PRIORITY MATRIX (MoSCoW)"  | Feature → phase mapping; confirms P3 = "You vs You (ghost)".                                                                                                                   |
| 3   | `GDD/MASTER-GDD.md` §6.4, §8 "GHOST SYSTEM ARCHITECTURE"    | Functional requirements for the You vs You mode.                                                                                                                               |
| 4   | `REPORT-2-MODIFICATION-PLAN.md` §5 "Implementation Plan"    | **Legacy/superseded** P0–P4 table (predates GDD v2.0 plan).                                                                                                                    |
| 5   | `REPORT-4-PHASE-2.5-UI-CERTIFICATION.md` §6                 | Legacy numbering: "Next: Phase 3 Ghost Mode, then AI Race (4), Multiplayer (5), Graphics (6), Audio/Replay/Photo (7), QA (8)" — original-project numbering, not the session's. |
| 6   | `REPORT-11-P2.1-P2.2-*` §20                                 | Session convention: **"next batch should be P2.3 + P2.4 … per the new 2-phase-per-pass rule."**                                                                                |
| 7   | `README.md` "Roadmap"                                       | Informal checklist (multi-track/laps, leaderboards, gesture calibration, two-hand steering, PWA) — **not** the phase authority.                                                |
| 8   | `GAME UI:UX SKILL/`                                         | UI/UX design skill docs (menu-and-flow, hud-design, accessibility). Design guidance; contains **no** phase roadmap.                                                            |

**Conclusion:** The authoritative roadmap after the session's P2.x = **GDD §17 (P2 → P3 → P4 → …)**. The session's granular labels (P0.1–P0.6, P1.1, P1.2/1.3, P2.1–P2.4) decompose GDD §17's P0/P1/P2; P2.3/P2.4 are the last sub-phases _named by the repo_ (REPORT-11 §20) for GDD P2.

---

## 3. Exact roadmap after P2.4 (from GDD §17)

| Phase | Name                            | Scope (GDD §17)                                                                        | Exit criteria                            |
| ----- | ------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------- |
| P3    | **You vs You**                  | Ghost recorder/replay/storage, delta HUD, sectors, NEW RECORD                          | Beat-your-best loop fun & stable         |
| P4    | Endless Survival upgrade        | Combo, near-miss, boost, dynamic difficulty, gesture calibration, high-score table     | Current game + new juice, no regressions |
| P5    | AI Race                         | Named identities, tiers, drafting, tournament ladder, podium                           | AI races feel fair & varied              |
| P6    | Local Multiplayer (same-screen) | Split-screen, per-player input (keyboard/gamepad), finish order                        | Two-player fun on one device             |
| P7    | Online Multiplayer              | Lobby (ping/voice/ready cards), room code, snapshot sync, reconnect                    | 2–4 player race over internet            |
| P8    | Tracks 2–3 + dynamic weather    | Mountain, Space + weather state machines + per-track audio/celebration                 | 3 tracks with parity + weather           |
| P9    | Garage + Progression            | Wheel skins, gloves, trails, car themes, banners, titles, coins/XP/levels/achievements | Reward loop + cosmetics integrated       |
| P10   | Replay + Photo mode             | Race recorder, free/orbit/slow-mo cameras, screenshots                                 | Replay after every race                  |
| P11   | Polish & QA                     | Perf tiers, accessibility, browser matrix, release                                     | Release-ready                            |

Dependencies (GDD §17 + session artifacts): P3 depends on P2 pipeline (pre-race → racing entry), storage layer, and HUD framework. P4/P5/P6/P7 depend on P3 (delta/ghost/position tech) and on the P0 InputManager abstraction.

---

## 4. P2.5 definition — **UNDEFINED — DO NOT IMPLEMENT**

`grep -rn "P2.5"` across `*.md/*.ts/*.json/*.html`: **zero matches**. No report, GDD, skill doc, or plan defines P2.5. It was only suggested in a prior assistant message — there is no authoritative scope, title, exit criteria, or source. **Do not implement P2.5 as specified from that message.**

_Remaining real GDD-P2 scope_ (defined by GDD §17 exit "Every mode opens cinematically" + §18 risk R11 "Skips on input; Reduced-Motion = countdown only"), which a "P2 close-out" sub-phase _would_ cover if one is ever written:

- **Skip-on-input** for the cinematic intro — NOT implemented (`RaceIntro` has only reduced-motion/`cancel()`; no user-triggered skip). Verified `src/core/RaceIntro.ts`.
- **Per-mode cinematic verification** that all four modes (versus / multiplayer / ai-race / survival) open through the intro pipeline.

---

## 5. P3.1 definition — **UNDEFINED — DO NOT IMPLEMENT**

`grep -rn "P3.1"` (and P3.2/P3.3/P2.6): **zero matches**. The authoritative GDD §17 defines only whole-phase **P3 "You vs You"**. A "P3.1 ghost recorder" subclass has no written definition. **Do not implement P3.1 from assumed scope.**

---

## 6. Compatibility of P2.5 + P3.1

**Not answerable — both are undefined.** Compatibility cannot be assessed for phases with no scope. Per report-integrity rules, they must not be treated as a planned batch.

---

## 7. Correct two-phase batch (per authoritative evidence)

The only batch that is **authoritatively named as next** in the repo is:

> **P2.3 + P2.4** — the exact next phases referenced by REPORT-11 §20 and by the
> user's roadmap prompt ("P2.3 + P2.4 are the next explicitly requested phases from
> the previous plan").

These two sub-phases complete session-GDD-P2 and are **compatible together**:

- Both live in the pre-race presentation + gameplay-entry surface (`UIManager`, `RaceStartPipeline`, `Countdown`, `index.html` overlays).
- No dependency on AI/network/replay/backend work.
- P2.3 (presentation UX) can land before P2.4 (handoff integration); P2.4 exercises P2.3's surface.

**If the user prefers GDD-level phases instead**, the batch would be "GDD-P2 close-out (skip-on-input + per-mode verification) + GDD-P3 (You vs You)" — pending explicit confirmation, since GDD P3 is substantially pre-implemented (see §8).

---

## 8. Existing implementation overlap (verified on disk)

### P2.3 + P2.4 (session GDD-P2 completion)

| Piece                                             | Status                                            | Evidence                                                                        |
| ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| Pre-race presentation overlay (`#intro-overlay`)  | **Completely missing**                            | not in `index.html`                                                             |
| HUD hidden outside racing (`#game-hud` id + sync) | **Missing** (HUD present in markup, always shown) | `index.html:273` `.hud` has no id; `UIManager.sync` only toggles ready/gameover |
| Countdown a11y (live region, `aria-hidden`)       | **Missing**                                       | `index.html:375` plain `<div class="countdown-overlay hidden">`                 |
| Authoritative countdown timing                    | **Already implemented**                           | `src/core/Countdown.ts` (P2.1/P2.2)                                             |
| Cinematic intro stage + reduced-motion            | **Already implemented**                           | `src/core/RaceIntro.ts` (P2.1/P2.2)                                             |
| Pipeline stages + `onRacing` handoff              | **Already implemented**                           | `src/core/RaceStartPipeline.ts` (P2.1/P2.2)                                     |
| `intro` phase in AppState                         | **Already implemented**                           | `src/core/AppState.ts` (P2.1/P2.2)                                              |

### GDD P3 (You vs You) — **substantially already implemented**

| GDD P3 requirement                                       | Status                  | Evidence                                                          |
| -------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------- |
| Ghost recorder (`{t,x,z,speed}` @20Hz, delta-compressed) | **Already implemented** | `src/replay/recorder.ts`, `codec.ts`                              |
| Storage best+last run (localStorage, IndexedDB doc)      | **Already implemented** | `src/replay/store.ts`                                             |
| Ghost playback (holographic car + trail, fade-in at GO)  | **Already implemented** | `src/replay/ghost.ts`, `player.ts`, `runtime.ts`                  |
| Delta HUD (`+0.342/−0.180`)                              | **Already implemented** | `src/replay/hud.ts` (GhostHud, wired in `main.ts:982`)            |
| Sectors (3 splits)                                       | **Already implemented** | `src/replay/runtime.ts` `sectorTimes`                             |
| NEW RECORD / ghost-beaten results line                   | **Already implemented** | `main.ts:573-589`                                                 |
| You vs You mode entry                                    | **Already implemented** | `GameModeConfig` `versus`; `ReplayRuntime.arm/begin` in `main.ts` |

> **Implication:** GDD P3 is _not_ a greenfield build in this codebase — the original
> project's Phase 3 (REPORT-5) already produced the full `src/replay/` subsystem. A
> future "P3" pass = **consolidation & verification** against the new handoff
> architecture (does the ghost still fade in at GO through `RaceStartPipeline`?), not a
> new feature build.

### Legitimacy check on the other GDD phases

`src/ai/` (AI Race), `src/network/` + `LobbyScreen` (online MP), `GarageScreen`,
`WeatherSystem`, 3 tracks in `GameModeConfig` → GDD P5/P7/P9/P8/P10 features already
exist as original-project features; P4 (Endless Survival = current gesture game),
P6 (local split-screen), P11 (polish) are the genuinely-open items.

---

## 9. Dependencies

- **P2.3** ← P2.1/P2.2 (`Countdown`, `RaceIntro`, `RaceStartPipeline`, `AppState.intro`, `UIManager`). No new infra.
- **P2.4** ← P2.3 presentation surface; depends on `RaceStartPipeline.goRacing` → `startGame` once; touches `Game.start` guard, retry/nav/unload cancellation, and `inputManager` lock semantics.
- **GDD P3** (whenever) ← P2 handoff (ghost fade-in at GO), existing `src/replay/*`, `GameModeConfig.versus`.
- **P4–P11** ← sequentially as in GDD §17; P4/P5/P6/P7 rest on P3 + InputManager.

---

## 10. Recommended implementation order

1. **P2.3 — Race Intro presentation / Countdown UX** (adds `#intro-overlay` + `#game-hud`; HUD hidden unless `racing`; a11y `role="status"` + `aria-hidden`; countdown beats 3·2·1·GO via `Countdown` hooks only; reduced-motion + responsive).
2. **P2.4 — Race Start / Gameplay Entry handoff** (authoritative GO → `racing` → `startGame` exactly once; prepare-before-countdown; no input bypass; retry/nav/unload; mode/input preservation).
3. (Optional, user-confirmed) GDD-P2 close-out: skip-on-input + per-mode cinematic verification.
4. (User-confirmed) **GDD P3 consolidation/verification** of existing `src/replay/` against the new pipeline — not a greenfield build.

---

## 11. Validation requirements (per phase, per project gate)

- `npm run typecheck` (tsc --noEmit) — GREEN
- `npm run lint` (eslint) — GREEN
- `npx vitest run` — must include new `UIManager.test.ts` + `RaceStartPipeline.ui.test.ts` (presentation + handoff integration) as well as existing **180** tests passing
- `npm run build` (tsc + vite) — GREEN
- Extra for P2.3: a11y (live region announces 3·2·1·GO), reduced-motion preserves all beats, responsive at 600px + 900×500, no duplicate overlay DOM across retry/cancel/nav
- Extra for P2.4: GO is the only path to `racing`; `game.start()` fires once; pre-GO input inert; hardware/manual playtest on device (gesture/gyro/phone pairs through intro→GO)

---

## 12. Explicitly undefined phases

- **P2.5 — UNDEFINED.** No authoritative source; do not implement.
- **P3.1 — UNDEFINED.** No authoritative source; do not implement.
- Any P2.6+ / P3.2+ / P4.x+ granular labels: **not defined anywhere**; the repo's only granular naming is P0.1–P0.6, P1.1, P1.2+P1.3, P2.1+P2.2, P2.3+P2.4 (REFERENCE-11 §20).

---

## 13. Confirmation — NO CODE WAS CHANGED

`git status --short` was captured at the start of the audit. The audit performed only
read-only operations (read/grep/vitest run). **No source, markup, stylesheet, or test
file was created or modified, and no test was changed.** `git status` contains exactly
the pre-existing P2.1/P2.2 changeset (modified: `AppState.test.ts`, `AppState.ts`,
`Game.ts`, `main.ts`, `flow.test.ts`; untracked: `REPORT-11`, `Countdown.*`,
`RaceIntro.*`, `RaceStartPipeline.*`).

---

## Final summary

1. **Authoritative roadmap found:** `GDD/MASTER-GDD.md` §17 (P0–P11, revised v2.0) + §18 MoSCoW; REPORT-11 §20 defines the session's **next** batch as **P2.3 + P2.4**.
2. **Next defined phases:** session **P2.3 (Race Intro presentation / Countdown UX)** + **P2.4 (Race Start / Gameplay Entry)**. After that, GDD **P3 You vs You** — but P3 is already largely implemented in `src/replay/` and needs consolidation, not greenfield.
3. **P2.5 / P3.1:** both **undefined**; do not implement.
4. **Two-phase batch:** P2.3 + P2.4 are compatible and are the correct next batch. P2.5+P3.1 compatibility is not assessable (undefined).
5. **Undefined/missing:** P2.5, P3.1, and gate integrity note: the advertised P2.3/P2.4 pass and 194-test gate do **not** exist on disk; true gate = 180 tests at P2.1/P2.2.
6. **No implementation was performed** during this audit.
