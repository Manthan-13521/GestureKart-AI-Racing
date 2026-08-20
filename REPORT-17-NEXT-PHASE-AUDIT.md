# REPORT-17 — NEXT-PHASE AUDIT (post-P4: what is next, and its exact scope)

**Task type:** Read-only audit. **No implementation was performed.**
**Date:** 2026-08-18

---

## 1. Executive summary

- **The authoritative next phase is GDD **P5 — AI Race** (GDD §17 row P5, §18 MoSCoW, and the §17 development-order step 6).** P4 (Endless Survival upgrade) is COMPLETE (REPORT-14/15/16 + `src/game/p4/`).
- **P5 is not greenfield.** The original project already ships a substantial AI Race subsystem (`src/ai/`, `src/game/RaceDirector.ts`, `src/game/TournamentManager.ts`, `VictoryCeremony`, full `main.ts` + `Game.ts` wiring). Like GDD-P3, P5 = **consolidation + gap-closure + verification**, not a new build.
- **Verification this pass:** `npm run typecheck` GREEN · `npm run lint` GREEN · `npm run build` GREEN · `npx vitest run` → **27 files / 287 tests: 281 pass, 6 fail** (all `SaveManager` high-score isolation failures — documented as pre-existing test-isolation noise in REPORT-16, not implementation bugs).
- **⚠️ Integrity flag:** the **entire P4 pass is uncommitted** — HEAD is still `1471b59` (P1.2+P1.3); 41 dirty paths (see §8). `src/ai/` + `RaceDirector` + `TournamentManager` _are_ committed (`5a358ca`, `944d5c2`), but `src/game/p4/`, `GestureCalibration`, the P2.3/P2.4 `src/core/` pipeline, `replay-lifecycle.test`, `UIManager.test`, and REPORTS 11–16 are all untracked.
- **Dead scaffolding to remove as part of the next pass:** `src/game/simulation/` (7 files, **zero imports** anywhere in `src/`).

---

## 2. Phase status on disk (verified)

| Phase  | Title                      | Status                               | Evidence                                                                                                                 |
| ------ | -------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| P0     | Foundation refactor        | COMPLETE                             | REPORT-6/7/8                                                                                                             |
| P1     | Unified flow + Home        | COMPLETE                             | REPORT-9/10                                                                                                              |
| P2     | Cinematic intro + Pre-Race | COMPLETE                             | REPORT-11 + REPORT-12                                                                                                    |
| P3     | You vs You (ghost)         | COMPLETE (consolidated)              | REPORT-13; `src/replay/*`                                                                                                |
| P4     | Endless Survival upgrade   | **COMPLETE**                         | REPORT-14/15/16; `src/game/p4/` (combo, nearMiss, boost, difficulty), `GestureCalibration.ts`, `SaveManager` high-scores |
| **P5** | **AI Race**                | **NEXT — partially pre-implemented** | GDD §17 row; `src/ai/*`, `RaceDirector`, `TournamentManager`, `main.ts` wiring                                           |
| P6+    | Local MP → Polish          | Not started                          | —                                                                                                                        |

---

## 3. Authoritative scope of the next phase — GDD **P5 AI Race**

Source: `GDD/MASTER-GDD.md`

- **GDD §17 table (line 680):** `P5 | AI Race | Named identities, tiers, drafting, tournament ladder, podium | AI races feel fair & varied`
- **GDD §17 order (line 762):** `P5 AI Race — identity engine → tiers → drafting/overtaking → tournament → podium.`
- **GDD §18 MoSCoW (line 698):** `AI Race (identities + ladder) | Must | H | High | P5`
- **GDD §09 AI SYSTEM ARCHITECTURE (revised v2.0 — named identities)** is the detailed spec:

  - **§9.1 Named identities** — 6 archetypes: **Blaze** (aggressive), **Shield** (defensive), **Vector** (precision), **Risky** (risky), **Chameleon** (adaptive), **Comet** (rookie). "Players recognize opponents, not just car #3."
  - **§9.2 Personality parameter model** — `aggression, consistency, braking, cornering, boostSense, mistakeFreq, draftSkill` (0–1 each); seeded for deterministic tournament replay; fixed fingerprints + small per-race noise.
  - **§9.3 Difficulty tiers** — Easy / Medium / Hard / Expert / **Adaptive** (Chameleon recalibrates from last 3 race deltas).
  - **§9.4 Race behaviors** — rubber-band catch-up · dynamic overtaking/defending (aggression-gated) · drafting (pack racing) · mistakes (tier-gated; Expert never randomly mistakes) · boost usage (boostSense) · finish celebration & podium.
  - **§9.5 Tournament progression** — Rookie → Pro → Elite → Champion; 3 races per division (one per track); promotion = top-3 average finish; defeat still pays partial rewards.

---

## 4. Existing implementation overlap (verified on disk)

### Already implemented (from original project — committed)

| GDD §09 requirement                        | Status          | Evidence                                                                                                                                                                                                      |
| ------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI grid / orchestrator                     | **Implemented** | `src/ai/AIRuntime.ts` (spawn grid, per-frame Perception→Decision loop, mesh sync, collision, snapshots)                                                                                                       |
| AI car entity + personality                | **Implemented** | `src/ai/AICar.ts` (197 lines), `src/ai/AIPersonality.ts` (6 archetypes + `buildGrid`)                                                                                                                         |
| Perception incl. drafting zones            | **Implemented** | `src/ai/AIPerception.ts` (`DraftZone` none/entry/optimal/dirty/cooldown)                                                                                                                                      |
| Decision incl. overtake/defend/block/draft | **Implemented** | `src/ai/AIDecision.ts` (intents + overtake state machine)                                                                                                                                                     |
| Race standings / position                  | **Implemented** | `src/game/RaceDirector.ts` (lap+z sort → standings, player position)                                                                                                                                          |
| Tournament ladder                          | **Implemented** | `src/game/TournamentManager.ts` (divisions rookie→champion, 3 races, points 10/8/6/4/2/1, top-3 promotion, coins/XP partial rewards)                                                                          |
| Podium / celebration                       | **Implemented** | `src/ui/VictoryCeremony.ts` (crown + rank), wired at `main.ts:509`                                                                                                                                            |
| Mode + flow integration                    | **Implemented** | `GameModeConfig` `'ai-race'` (`features.ai`); `Game.setRaceMode('ai-race')` → no random traffic, start position 6; `main.ts:621-635` (start), `907-946` (tick), `502-519` (finish → `recordFinish` + rewards) |
| Test coverage (core AI)                    | **Present**     | `src/ai/ai.test.ts` — 21 cases: perception, decision, buildGrid, RaceDirector                                                                                                                                 |

### Gaps vs GDD §09 (the actual P5 work)

| Gap                                                | Detail                                                                                                                                                                                       | Evidence                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Named identities per GDD §9.1**                  | Archetypes exist but are named `smooth/aggressive/defensive/erratic/tactical/rookie`, not GDD `Blaze/Shield/Vector/Risky/Chameleon/Comet`; param model differs from §9.2                     | `src/ai/AIPersonality.ts:8,37-116`                                        |
| **Adaptive tier + Chameleon recalibration (§9.3)** | `buildGrid` uses a single scalar `difficulty` with 3 bands; no Adaptive/Expert tier, no last-3-race recalibration                                                                            | `src/ai/AIPersonality.ts:123-131`; `main.ts:626` passes `difficulty: 0.5` |
| **Rubber-band catch-up (§9.4)**                    | GDD lists it; **not present** anywhere in `src/ai/`                                                                                                                                          | grep `rubber` → only `GameModeConfig.ts:68` subtitle                      |
| **AIHud shows only position/lap**                  | `main.ts:932-944` hardcodes `gapAhead: null, gapBehind: null, draftZone: 'none', draftBonus: 0, intent: '', isOvertaking: false` — HUD's gap/draft/overtake features are never fed real data | `src/ai/AIHud.ts` vs `main.ts:932-944`                                    |
| **Tournament unit tests**                          | No `TournamentManager.test.ts`, no `AIRuntime`/`AICar`/`AIHud`/end-to-end AI race tests                                                                                                      | grep of `src/**/*.test.ts`                                                |
| **Dead scaffolding**                               | `src/game/simulation/` (7 files) imported by **nothing**                                                                                                                                     | grep `simulation/` in `src/` → 0 hits                                     |

---

## 5. Verification gates (run this audit)

| Gate                               | Result                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck` (tsc --noEmit) | **GREEN**                                                                                                                                                                                                                |
| `npm run lint` (eslint .)          | **GREEN**                                                                                                                                                                                                                |
| `npm run build` (tsc + vite)       | **GREEN** (681 kB main chunk warning only)                                                                                                                                                                               |
| `npx vitest run`                   | **27 files / 287 tests — 281 pass / 6 fail**, all 6 in `SaveManager.test.ts > High Scores` (isolation noise; REPORT-16 §9 documented root cause = shared localStorage between parallel workers, not implementation bugs) |

---

## 6. Recommended next pass — **P5 AI Race close-out** (precise scope)

Following the repo's two-phase-per-pass convention and the fact that P5 is pre-implemented:

1. **Named identities (§9.1 + §9.2):** Rename/re-map the 6 archetypes to GDD identities (Blaze/Shield/Vector/Risky/Chameleon/Comet), align the personality parameter model (`aggression, consistency, braking, cornering, boostSense, mistakeFreq, draftSkill`), keep per-race seeded noise.
2. **Tiers + Adaptive (§9.3):** Add Expert + Adaptive; Chameleon recalibrates from last 3 race deltas; wire `difficulty` per tier in `main.ts:626`.
3. **Rubber-band catch-up (§9.4):** Implement; pack closes gaps without rubber-banding the player down unfairly.
4. **Live HUD data:** Feed real `gapAhead/gapBehind/draftZone/draftBonus/intent/isOvertaking` from `AIPerception`+`AIDecision` into `aiHud.update` (`main.ts:932-944`).
5. **P5 test coverage:** `TournamentManager.test.ts` (promotion/demotion/partial-reward), `AIRuntime`/`AICar`/`AIHud` tests, and an end-to-end AI-race flow test (mode select → race → finish → `recordFinish` → podium).
6. **Remove dead scaffolding:** delete `src/game/simulation/` (7 files, unreferenced).

**Exit criteria (GDD §17):** _"AI races feel fair & varied."_

---

## 7. Dependencies

- P5 ← P4 systems (combo/boost/difficulty already landable in AI races), `Game._raceMode`, `InputManager` (keyboard/gamepad only — gesture ignored per GDD line 319), `VictoryCeremony`, `SaveManager`/`TournamentManager` storage.
- P6 (Local MP) ← P5 grid/standings tech + per-player `InputManager` sources.

---

## 8. Integrity flags (must be addressed before starting P5)

1. **P4 uncommitted.** `git status --short` = 41 paths; HEAD = `1471b59` (P1.2+P1.3). All P4/P2.3-2.4 work and REPORTS 11–16 are uncommitted/untracked. **Recommend a commit of the current working tree before P5 work begins** so P5 builds on a clean, reviewable base.
2. **6 failing tests** (SaveManager high-scores) are pre-existing isolation noise — fix by ensuring tests do not share localStorage across workers (or accept documented noise), but they must not silently regress during P5.
3. **P5's AI subsystem is committed code from the original project** (`5a358ca`, `944d5c2`) — P5 close-out must treat it as legacy to consolidate, consistent with how GDD-P3 was handled.

---

## 9. Confirmation — NO CODE WAS CHANGED

Read-only operations only (read/grep/vitest/typecheck/lint/build). No source, markup, stylesheet, or test file was created or modified.
