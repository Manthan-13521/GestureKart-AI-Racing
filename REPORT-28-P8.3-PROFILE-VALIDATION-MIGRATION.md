# REPORT-28-P8.3-PROFILE-VALIDATION-MIGRATION.md

## Objective

Harden P8.2's profile persistence so that stored progression state is trustworthy across old saves, malformed saves, missing/invalid fields, schema evolution, browser reloads and invalid persisted values. P8.3 is a persistence-validity phase: reward formulas (P8.1), the RaceResultGate idempotency contract (P8.2) and gameplay mechanics are untouched. Abandoned races intentionally still award nothing — verified, not changed.

## Architecture / Context

The persistence pipeline is now layered:

```
localStorage ('vs_profile_state')          ← untrusted input
        │
        ▼
parseProfileJson(raw)                      ← JSON layer (never throws)
        │
        ▼
migrateProfile(unknown)                    ← version + shape layer (P8.3, new)
        │  version 2 → sanitize field-by-field
        │  version 1 / unversioned → legacy migration (shape-based sanitize)
        │  other integer version → fail closed with a fresh default
        ▼
ProfileManager (runtime authority)         ← mutations persist only at boundaries
        ▲
RaceResultGate (ONLY reward boundary, unchanged) → ProfileManager
```

`src/progression/profilePersistence.ts` is a new pure, side-effect-free module (no storage, no DOM): the persisted-to-runtime translation lives there, fully testable. `ProfileManager` remains the persistence authority; `RaceResultGate` remains the only reward boundary. No new global store was added.

## Files Created / Modified

| File                                         | Change                                                                                                                                                                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/progression/profilePersistence.ts`      | NEW — pure parse/migrate/sanitize pipeline: `parseProfileJson`, `migrateProfile`, `sanitizeProfile`, `sanitizeCompletedRaces`, `createDefaultProfile`, `PROFILE_VERSION=2`, `MAX_COMPLETED_RACES=64`                          |
| `src/progression/profilePersistence.test.ts` | NEW — 30 tests (JSON layer, version matrix, value validation, token policy, cosmetic validation, default integrity)                                                                                                           |
| `src/managers/ProfileManager.ts`             | Load rewritten onto the migrate pipeline; storage access fully guarded (getItem/setItem throw-safe); persistence failures reported once instead of swallowed; `level` is now always derived (getter), never persisted/trusted |
| `src/managers/ProfileManager.test.ts`        | +6 tests (storage failures, unknown-version fail-closed, XP/coin sanitize with cosmetic survival, level-vs-XP consistency, fresh-instance persistence)                                                                        |
| `src/progression/RaceResultGate.test.ts`     | +5 integration tests (reload idempotency with real ProfileManager, abandoned races, migration-preserves-tokens)                                                                                                               |

## Profile Schema / Version Changes

- Persisted schema version is now explicit and enforced: `version: 2` (`PROFILE_VERSION`).
- The persisted type (`PlayerProfile`) no longer carries `level` at all — the type itself now matches reality: `level` is a runtime derivation (`levelForXp(xp)`), never stored, never trusted. This is a payload narrowing only: previously-written `level` fields are ignored on load (valid values keep their meaning because the derived value equals them).
- `ProfileState` (runtime shape exposed via `currentState`, consumed by `Game.ts`/`GarageScreen`) keeps `level` — now always the derived value.

## Migration Strategy

`migrateProfile(raw)` decides by version:

- **null / non-object** (array, string, number, boolean) → fresh default v2 profile.
- **version 2** → sanitize: valid values preserved, invalid values repaired to safe defaults.
- **version 1 or unversioned (legacy, pre-P8)** → shape-based migration: recognized legacy fields (`xp`, `coins`, `unlockedSkins`, `selectedSkin`, `unlockedNeons`, `selectedNeon`, `completedRaces`, `lifetimeStats`) survive through the sanitizer; new fields default. An unversioned object with NO recognizable profile fields is treated as non-profile junk → fresh default.
- **any other integer version** (0, negative, >2) → fail closed with a fresh default v2 profile. Unknown future schemas are never guessed at (documented, tested). Non-integer `version` values are treated as legacy (shape-based recovery) so a single malformed field never wipes a valid profile.

## Validation Strategy

Every field is validated as untrusted input:

- **XP**: finite non-negative integer; otherwise 0.
- **coins**: finite non-negative integer; otherwise 0.
- **level**: never trusted — always `1 + floor(xp / 1000)` from authoritative XP (flat 1000 XP/level from P8.1, unchanged). XP/level can no longer contradict each other; boundary cases 0/999/1000/1999/2000/250000 XP are tested.
- **racesFinished**: finite non-negative integer; otherwise 0.
- **completedRaces**: array-only; entries must be non-empty strings ≤ 128 chars; duplicates removed (order-preserving); capped at 64 with the NEWEST entries kept (FIFO contract from P8.2, unchanged); malformed arrays → empty list.
- **unlockedSkins / unlockedNeons**: array-only; unknown ids dropped against the authoritative `ContentCatalog` (`isKnownSkin`/`isKnownNeon`); duplicates removed; empty result → starter defaults (`['default']` / `['red','blue']`).
- **selectedSkin / selectedNeon**: must reference an OWNED (post-filter) item; invalid selections fall back to the preferred starter (`'default'` / `'blue'`) when owned, else the first owned item. An equipped item can never reference an unowned or unknown id.
- NaN/Infinity cannot reach runtime state: JSON cannot carry them (they serialize to `null`), and the pure sanitizer also rejects them when fed raw objects (tested).
- Malformed JSON, non-object JSON, missing version, unknown version and partial profiles never crash the application (all tested).

## Persistence Behavior

- Persistence writes happen ONLY at explicit mutation boundaries (`applyRewards`, `markRaceCompleted`, `purchaseSkin/Neon`, `selectSkin/Neon`) — never per frame, never in `Game.update()`/HUD/AI loops (audited, no change needed).
- `applyRewards` remains: validate → update runtime state → persist. The in-memory profile and the persisted profile can only diverge by a failed write (see below), never by partial application.
- `currentState` returns a defensive copy; internal arrays are never shared with callers.

## Corruption / Recovery Behavior

- **localStorage.getItem throws** (storage blocked/disabled): constructor returns a default profile — the game boots normally.
- **localStorage.setItem throws** (quota/private mode): the in-memory state is preserved and the mutation still applies for the session; a single `console.warn('[ProfileManager] could not persist profile state')` reports the failure instead of silently pretending persistence succeeded. No noisy logging — one line, only on real failure.
- **Recovery policy**: valid portions preserved + invalid portions repaired + safe defaults for unrecoverable fields. A profile with a corrupt XP but valid tokens/coins loads with XP=0 and everything else intact (tested at both unit and gate-integration level).
- **Unknown future schema version**: fail closed with a fresh default v2 profile (documented; no speculative migration). A freshly defaulted profile is immediately valid and persists on the next mutation.

## Abandoned-Race Behavior

Verified (no code change): `beginRace()` registers an id but writes nothing; closing/reloading before the authoritative `gameover` transition produces no token, no XP, no coins. A subsequent race starts normally and pays normally. Completion tokens appear ONLY after a successful `RaceResultGate.complete()`. No browser-lifecycle reward behavior was introduced. Unit tests + browser probe cover all four claims.

## RaceResultGate Compatibility

The gate is unchanged. Integration tests (real `ProfileManager` + `localStorage`, then a fresh manager and a fresh gate — i.e. a reload simulation) prove: completed tokens remain recognized; a duplicate completion resolves to `alreadyProcessed` with zero additional reward; the recomputed summary's reward values equal the original payout; profile migration repairs corrupt fields without erasing valid tokens.

## Tests Added / Changed

P8.3 adds 42 tests across three files (479 → **521**):

- `profilePersistence.test.ts` (30): JSON layer, empty/legacy/v2 round-trip, missing/extra fields, unknown-version fail-closed, corrupt version values, invalid XP/coins/level/racesFinished, XP/level consistency table, token dedupe/validation/cap-64, cosmetic ownership + equipped fallback, deep-fresh defaults.
- `ProfileManager.test.ts` (+6): setItem/getItem throwing, unknown-version fail-closed through the manager, corrupt XP/coins with valid cosmetics surviving, persisted-level-vs-XP consistency, reward persistence across fresh instances.
- `RaceResultGate.test.ts` (+5): reload idempotency (fresh manager + fresh gate), abandoned race → no token/reward, new race after abandoned pays, tokens survive reload, migration repairs corruption without erasing tokens.

All 24 required scenarios from the prompt are covered. No existing P8.1/P8.2 test was weakened or deleted (baseline suite intact, 479 + 42 = 521).

## Validation — exact commands and results

```bash
npx vitest run                                # 521 passed (39 files) — baseline 479/38 + 42 new
npm run typecheck                             # PASS (tsc --noEmit, 0 errors)
npm run lint                                  # PASS (eslint ., 0 errors/warnings)
npx prettier --check .                        # PASS
npm run build                                 # ✓ built in 1.12s
npx playwright test --project=chromium        # 14 passed / 6 intentional skips / 0 failed (baseline preserved)
```

## Targeted Browser Verification (temporary probe, deleted after the run)

All six required scenarios verified with domain-state polling (no arbitrary sleeps):

1. Fresh profile → AI race finish → `{xp:400, coins:200, races:1, tokens:1}` persisted.
2. Browser reload → identical `{xp:400, coins:200, races:1, tokens:1}` — intact.
3. Reload → token count still 1 (duplicate completion cannot double-pay; also unit-proven at gate level).
4. Start race → reload mid-race → `vs_profile_state` absent entirely (no reward, no token).
5. New race after the abandoned run → finishes and pays normally (`{xp:400, coins:200, races:1, tokens:1}`).
6. Ceremony displayed exactly the stored rewards (`XP 400 / COINS 200`).

## Regressions / Known Limitations

- **No regressions**: full suite 521/521; chromium E2E 14/6/0 (identical to P8.2 baseline). Reward formulas, TournamentManager, SaveManager, AI, physics, replay untouched.
- **Fail-closed on unknown future versions wipes unrecognized data** — this is the documented policy ("never guess at unknown schemas"); a future P9 migration would extend `migrateProfile` with the new version branch.
- **Abandoned races award nothing** (GDD-compliant, P8.2 contract) — a possible future "abandoned-race recovery" feature would need its own design pass, not this phase.
- **Persisted `level` is now ignored** (derived at runtime) — previously-written values remain harmless; the saved payload simply no longer contains the field.
- **Persistence failure warning** is a single console.warn on actual failure — no UI surface for it (out of scope; noted for P8.8 if desired).

## Answers to the Required Report Questions

- Persisted schema version: **2** (explicit, enforced; unknown integer versions fail closed).
- Legacy migration: shape-based sanitize — recognized fields survive, new fields default.
- Invalid persisted values: repaired per-field to safe defaults; valid portions preserved; nothing crashes.
- XP/level consistency: level is ALWAYS derived from XP (1000/level, P8.1 math unchanged); stored level never trusted.
- localStorage failure: getItem → default profile; setItem → in-memory state preserved + one warn; game never crashes.
- Completion tokens: validated (non-empty ≤128 chars), deduped, capped at 64 FIFO (newest kept); reload-safe.
- Gate idempotency across reload: persisted token checked before registration; fresh manager + fresh gate → `alreadyProcessed`, zero additional reward (integration-tested).
- Abandoned races: no token, no reward, next race unaffected (unit + browser verified).
- Unknown future schema: fail closed with a fresh default; no speculative migration (documented, tested).
- Browser verification: probe above; probe deleted.
- Reward formulas changed: **NO**. Gameplay mechanics changed: **NO**. Existing APIs broken: **NO** (ProfileManager API, ProfileState contract, gate/store interfaces unchanged).
- Exact results: 521/521 unit, typecheck/lint/prettier/build PASS, chromium E2E 14/6/0.

## Final Verdict

**PASS** — P8.3 COMPLETE. Profile persistence is now validated, migrated, versioned and failure-safe; the RaceResultGate remains the single idempotent reward boundary; the full P8.2 baseline is preserved with 42 new tests.
