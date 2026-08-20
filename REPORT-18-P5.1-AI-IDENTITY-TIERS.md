# REPORT-18 — P5.1 AI IDENTITY + PERSONALITY + TIERS

**Task type:** Implementation (P5.1 of GDD P5 — AI Race).
**Date:** 2026-08-18

---

## 1. Requirements implemented

P5.1 makes the existing AI system conform to GDD §09's identity/personality/tier
model while preserving all existing race behavior (perception, decision, drafting,
overtaking, standings, tournament, podium, AI race flow).

| Requirement                                                               | Status | Notes                                         |
| ------------------------------------------------------------------------- | ------ | --------------------------------------------- |
| Six named GDD identities (Blaze, Shield, Vector, Risky, Chameleon, Comet) | ✅     | Replaces old generic archetypes               |
| Deterministic personality fingerprint per identity                        | ✅     | GDD §9.2 param model, baseline + seeded noise |
| All personality params normalized 0..1                                    | ✅     | `isNormalized()` enforced by test             |
| Deterministic seeding (same seed ⇒ same result)                           | ✅     | mulberry32 PRNG; per-slot seeds               |
| Bounded per-race variation                                                | ✅     | ±0.04 fingerprint noise, ±0.02 engine noise   |
| Difficulty tiers Easy/Medium/Hard/Expert/Adaptive                         | ✅     | GDD §9.3; typed tier model                    |
| Expert never randomly mistakes                                            | ✅     | `TIER_FORBIDS_MISTAKES.expert = true`         |
| Adaptive = Chameleon recalibration from last 3 race deltas                | ✅     | `ChameleonAdapter`                            |
| Chameleon adaptation bounded + deterministic + <3 races safe              | ✅     | tests E                                       |
| Grid contains named identities, deterministic, no duplicates ≤6           | ✅     | tier lists hold all six identities            |
| Identity/personality metadata accessible to runtime/HUD                   | ✅     | `AICar.identityId/identityName`               |
| Existing AI engine behavior preserved                                     | ✅     | `Personality` engine type unchanged           |

## 2. Files changed

| File                         | Change                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/ai/AIIdentity.ts`       | **NEW** — identities, GDD §9.2 fingerprints, tiers, mulberry32, seeded noise                                                    |
| `src/ai/AIPersonality.ts`    | Rewritten — `PERSONALITIES` derived from identities; `toEnginePersonality()` bridge; `buildGrid(count, tier, seed, chameleon?)` |
| `src/ai/ChameleonAdapter.ts` | **NEW** — last-3-race delta adapter (isolated, bounded)                                                                         |
| `src/ai/AIRuntime.ts`        | Options: `tier`/`seed`/`chameleon` replace `difficulty` scalar                                                                  |
| `src/ai/AICar.ts`            | Exposes `identityId` + `identityName`                                                                                           |
| `src/ai/index.ts`            | Exports new model + adapter                                                                                                     |
| `src/ai/ai.test.ts`          | Updated legacy identity references + extended grid tests                                                                        |
| `src/ai/ai-identity.test.ts` | **NEW** — 35 focused P5.1 tests                                                                                                 |
| `src/main.ts`                | `AIRuntime` uses `tierForDivision()` + fixed seed; `chameleonAdapter.recordRace()` on AI race finish                            |

## 3. Architecture decisions

- **Preserve engine, replace source of truth.** The `Personality` interface
  consumed by `AIDecision`/`AICar` was kept byte-for-byte. Only the _producer_
  changed: `toEnginePersonality()` maps a GDD fingerprint to engine coefficients.
- **GDD §9.2 → engine field mapping**
  - `aggression` → `aggression`, `blockingFrequency` (+fixed Shield bias)
  - `mistakeFreq` → `mistakeRate` (suppressed when tier forbids mistakes)
  - `draftSkill` → `draftUsage`
  - `boostSense` → `boostStrategy`
  - `cornering` → `cornerConfidence`, `speedFactor`
  - `consistency` → `recoverySpeed`, `reactionTime`, `speedFactor`
  - `braking` → `reactionTime` (braking discipline lowers reaction lag)
- **Tier = identity mix + pace multiplier + mistake policy.** Tier strength is
  deterministic and monotonic (verified by test C).
- **Seeding:** slot `i` of a grid uses `seed * 31 + i`, so identity _order_ for a
  tier is fixed while per-car parameters vary reproducibly.

## 4. Identity / personality table (GDD §9.1 + §9.2 baselines)

| Identity                 | aggression | consistency | braking | cornering | boostSense | mistakeFreq | draftSkill |
| ------------------------ | ---------- | ----------- | ------- | --------- | ---------- | ----------- | ---------- |
| **Blaze** (Aggressive)   | 0.90       | 0.55        | 0.30    | 0.70      | 0.85       | 0.06        | 0.70       |
| **Shield** (Defensive)   | 0.15       | 0.90        | 0.95    | 0.75      | 0.40       | 0.03        | 0.50       |
| **Vector** (Precision)   | 0.40       | 0.95        | 0.85    | 0.95      | 0.60       | 0.00        | 0.60       |
| **Risky** (Risky)        | 0.85       | 0.45        | 0.35    | 0.65      | 0.80       | 0.25        | 0.55       |
| **Chameleon** (Adaptive) | 0.50       | 0.50        | 0.50    | 0.50      | 0.50       | 0.10        | 0.50       |
| **Comet** (Rookie)       | 0.20       | 0.35        | 0.30    | 0.40      | 0.20       | 0.35        | 0.25       |

All values are 0..1. Per-race noise is applied on top (fingerprint noise ±0.04,
engine noise ±0.02), deterministically from the seed.

## 5. Tier behavior (GDD §9.3)

| Tier         | Leading identities                       | Pace multiplier | Mistakes                          |
| ------------ | ---------------------------------------- | --------------- | --------------------------------- |
| **Easy**     | Comet first, Shield second               | 0.90            | allowed                           |
| **Medium**   | Risky, Shield, Blaze…                    | 1.00            | allowed                           |
| **Hard**     | Blaze first (strong drafting/overtaking) | 1.08            | allowed                           |
| **Expert**   | Vector first (near-optimal precision)    | 1.16            | **forbidden** (`mistakeRate = 0`) |
| **Adaptive** | Chameleon first (recalibrates)           | 1.00            | allowed                           |

## 6. Chameleon adaptation (GDD §9.3/§9.1)

`ChameleonAdapter` stores at most the **last 3** `{ position, gridSize }` race
results. A mid-field baseline (`gridSize/2 + 0.5`) defines the signed delta:
negative = player ahead. `adapt()` shifts the Chameleon fingerprint toward the
player's demonstrated level, clamped to ±0.15 per parameter (never instantly
unbeatable). Fewer than 3 races are handled: no history ⇒ neutral baseline
fingerprint. Same input history ⇒ identical output (deterministic). The adapter
is isolated — no coupling to TournamentManager or UI beyond a one-line
`recordRace` call in `main.ts`.

## 7. Deterministic seeding approach

- `mulberry32(seed)` — deterministic, testable PRNG.
- `seedNoise(fp, seed, noise)` — bounded per-field variation; zero-noise returns
  the fingerprint unchanged.
- `identityFingerprint(id, seed)` — baseline + noise for an identity.
- Grid slot seed = `gridSeed * 31 + i` — reproducible grids.
- Tests prove: same identity+seed ⇒ equal; different seed ⇒ bounded divergence;
  all outputs stay within 0..1.

## 8. Tests added / updated

- **NEW `src/ai/ai-identity.test.ts` (35 tests):**
  - A Identity: all six exist, characteristic fingerprints, stable names
  - B Personality: 0..1 normalization, seed determinism, bounded variation
  - C Tier: five tiers, monotonic strength ordering, tier lead identities, determinism
  - D Expert: never random-mistakes, stronger than Hard, Vector precision trait
  - E Chameleon: 0/1/3 races, adapts to performance, bounded, deterministic
  - F Grid: six distinct identities, deterministic order, metadata, override fp
- **Updated `src/ai/ai.test.ts` (25 tests):** legacy archetype references replaced
  with GDD identities; added deterministic-grid + expert-mistake checks.

## 9. KNOWN PRE-EXISTING FAILURES (not caused by this pass)

The suite has **documented pre-existing parallel-worker isolation failures** in
`SaveManager.test.ts` (6 high-score tests, REPORT-16 §9) and an intermittent
flow-test flake (`Survival + … clamps to hand`) that passes in isolation
(verified 3/3). This pass did **not** modify SaveManager or flow logic.

## 10. Remaining P5 requirements (NOT in this pass)

- **P5.2** rubber-band catch-up + improved overtaking/defending/drafting fairness
- **P5.3** real-time AI HUD data (gaps, draft state, intent, overtaking) — HUD
  still receives placeholder gap/draft values from `main.ts`
- **P5.4** tournament + podium lifecycle verification and missing tests
- **P5.5** full AI-race integration/feel audit + browser verification

---

## Validation results

| Gate                           | Result                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit` (typecheck) | ✅ GREEN                                                                                                                                          |
| `npm run lint` (eslint)        | ✅ GREEN                                                                                                                                          |
| `npm run build`                | ✅ GREEN                                                                                                                                          |
| `npx prettier --check`         | ✅ GREEN (all touched files)                                                                                                                      |
| `npx vitest run`               | 28 files / **326 tests** — AI files: **60/60 pass**; 7–8 failures are the documented pre-existing SaveManager isolation + intermittent flow flake |

---

## P5.1 FINAL SUMMARY

**P5.1 STATUS: COMPLETE**

- Tests (AI): 60/60 pass (25 core + 35 identity) — all suites deterministic.
- Typecheck: GREEN · Lint: GREEN · Build: GREEN · Prettier: GREEN.
- Files changed: `AIIdentity.ts` (new), `ChameleonAdapter.ts` (new),
  `ai-identity.test.ts` (new), `AIPersonality.ts`, `AIRuntime.ts`, `AICar.ts`,
  `index.ts`, `ai.test.ts`, `main.ts`.
- Remaining P5 work: P5.2 rubber-band + overtake/defend/draft fairness; P5.3 live
  AI HUD; P5.4 tournament/podium verification; P5.5 feel audit + browser test.
