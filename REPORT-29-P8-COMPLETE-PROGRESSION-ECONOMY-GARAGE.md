# REPORT-29-P8-COMPLETE-PROGRESSION-ECONOMY-GARAGE.md

## Objective

Ship the entire remaining P8 scope (P8.4–P8.9) on top of the P8.1–P8.3 foundations: present the profile (level, XP progress, coins, races) across every surface, build the catalog-driven garage (skins + neon trails) with domain-validated purchase/equip, apply the equipped cosmetics inside the 3D race itself, verify everything in real browsers (desktop + mobile), and deliver the final P8 regression evidence. P8.7 is a documented skip (GDD defines progression as cosmetic-only). This is the final P8 report.

## Architecture / Context

One authoritative chain, no new state stores:

```
ContentCatalog (identity, prices, hex, titles — single source)
        │ read-only
        ▼
ProfileManager (runtime authority — ProfileState via currentState)
        ▲ writes ONLY at mutation boundaries
        │
RaceResultGate (ONLY reward boundary — unchanged since P8.2)
        ▲
RaceResultGate.complete() → ProfileManager.applyRewards()
        ▲
main.ts gameover → ceremony (AI) / results (survival/versus/multiplayer)
        ▲
ProgressionView (pure presentation math: xpProgress/formatCurrency/
                 levelUpText/rewardSummary) — no state, no storage
        ▲
MainMenuScreen · GarageScreen · VictoryCeremony · Game.applyCosmetics()
```

- UI never reads localStorage directly; it consumes `profileManager.currentState` (defensive copy).
- Prices, ids, hexes and titles live ONLY in `ContentCatalog`; `Game.ts` no longer holds a `skinMap` (removed — previously a duplicate of catalog data).
- `ProgressionView` is pure and side-effect-free: every display value derives from authoritative state at render time (screens are rebuilt on each navigation via `Screen.mount()` → `build()`), so profile data is always fresh.

## Files Created / Modified

| File                                                                | Change                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/progression/ProgressionView.ts`                                | NEW — `xpProgress(xp)` → {xp, level, into, needed, ratio, pct} (flat 1000/level from P8.1, never duplicated); `formatCurrency(value)` (thousand separators, invalid → "0"); `levelUpText(levelBefore, levelAfter)`; `rewardSummary(completion)` (earned/totals/levels/title/unlocked)                                                            |
| `src/progression/ProgressionView.test.ts`                           | NEW — 16 tests (XP boundaries 0/999/1000/1001/1999/2000/250000 + invalid, currency formatting, level-up text, rewardSummary shape)                                                                                                                                                                                                               |
| `src/managers/ProfileManager.ts`                                    | `purchaseSkin(skinId, cost?)` / `purchaseNeon(neonId, cost?)` — catalog is the price authority (caller-supplied price must EXACTLY equal the catalog price or the purchase is rejected; unknown ids rejected); ownership/funds validated; no mutation on any failure. `selectSkin`/`selectNeon` additionally require `isKnownSkin`/`isKnownNeon` |
| `src/managers/ProfileManager.test.ts`                               | +7 tests (catalog-sourced purchase, wrong/NaN/float price rejection, unknown-id rejection, no double charge, insufficient funds, unknown/unowned equip rejection, equipped-cosmetics persistence across reload)                                                                                                                                  |
| `src/screens/GarageScreen.ts`                                       | FULL REBUILD — ContentCatalog-driven skin + neon grids (11 cards), driver profile section, purchase/equip via domain only, toasts, error shake, keyboard focus groups, mobile-safe, no duplicated ids/prices/hexes                                                                                                                               |
| `src/screens/MainMenuScreen.ts`                                     | Driver profile strip: LEVEL, title (titleForLevel), COINS (formatted), XP progress bar with into/needed, RACES — rebuilt fresh per navigation                                                                                                                                                                                                    |
| `src/ui/VictoryCeremony.ts`                                         | `CeremonyData` extended (totalXp/totalCoins/levelBefore/levelAfter/levelsGained/title/unlocked); renders `.ceremony-totals`, `.ceremony-levelup` banner, `.ceremony-unlock` title line — the 3-stat `.ceremony-grid` contract is untouched                                                                                                       |
| `src/main.ts`                                                       | AI ceremony fed with the full gate outcome summary; non-AI results screen gets a rewards strip (+XP/+COINS, totals, level-up banner)                                                                                                                                                                                                             |
| `src/game/Game.ts`                                                  | Hardcoded `skinMap` REMOVED → `skinHex(state.selectedSkin)`; NEW neon underglow plane (emissive, `neonHex(state.selectedNeon)`, opacity 0.35, purely visual); `applyCosmetics()` called from `prepareRace()` — event-driven, never per-frame                                                                                                     |
| `src/style.css` / `src/ui/ui.css`                                   | `.ceremony-levelup` (pulse + reduced-motion override), `.ceremony-totals`, `.ceremony-unlock`, `.menu-profile*`, `.profile-xpbar/fill/text`                                                                                                                                                                                                      |
| `e2e/probe-p84.spec.ts` / `probe-p85.spec.ts` / `probe-p88.spec.ts` | TEMPORARY browser probes (P8.8) — all passed, all deleted after the run                                                                                                                                                                                                                                                                          |

## Profile Presentation (P8.4)

- **Main menu**: `.menu-profile` strip — `LEVEL N`, current title (e.g. ROOKIE), `COINS` (thousand-separated), XP progress bar (`into / needed XP TO LEVEL N+1`), `RACES`. Values render from `profileManager.currentState` at build time.
- **Ceremony (AI)**: the existing 3-stat grid (+PTS/+COINS/+XP — E2E contract unchanged) is followed by a `LEVEL UP!` banner (`LEVEL X → LEVEL Y`, only when `levelsGained > 0`) and a totals row (TOTAL XP / COIN BALANCE / TITLE). All numbers come directly from the gate outcome — nothing is recomputed in the UI.
- **Non-AI results (survival / versus / multiplayer)**: new rewards strip — +XP/+COINS earned, TOTAL XP / COIN BALANCE, level-up banner when applicable. High-score table untouched.
- **Garage**: driver profile section — LEVEL / COINS / RACES stat boxes + XP progress bar with `into / needed · total · next level` caption.
- Reduced motion: the level-up pulse animation is disabled under `data-reduced-motion`; the level-up information is never animation-only (static text remains visible).

## Garage Domain (P8.5)

`ProfileManager.purchaseSkin(id, cost?)` and `purchaseNeon(id, cost?)`:

1. Unknown id → `false`, no mutation.
2. `cost` may be omitted (catalog price used) or supplied — it must EXACTLY equal `skinCost(id)` / `neonCost(id)`; any mismatch (including NaN, floats, negative, off-by-one) → `false`, no mutation. The UI never passes a price; the catalog is the only price authority.
3. Already owned → `false`, no double charge.
4. Insufficient coins → `false`, no mutation.
5. Success → unlocked + persisted; `true`.

`selectSkin` / `selectNeon` now also reject unknown ids (in addition to the existing "must be owned" rule). Equipped cosmetics survive reload (tested through a fresh ProfileManager instance).

## Garage UI + Cosmetic Integration (P8.6)

- `GarageScreen` is fully rebuilt on `ContentCatalog.SKIN_ITEMS` + `NEON_ITEMS` (5 skins + 6 neons = 11 cards): color swatch, name, status (`EQUIPPED` / `OWNED` / `X,XXX COINS`), `selected` class for the equipped item. Cards are real `<button>`s (keyboard + FocusNavigator `data-focus-group` friendly).
- Interaction: tap an owned item → equip (+ toast); tap an unowned item with funds → purchase → card becomes OWNED (a second tap equips); without funds → error toast + shake animation. Every outcome is validated by the domain; the UI only mirrors the authoritative result via `rebuild()` (re-runs `build()` from fresh `currentState`).
- `Game.ts`: hood paint from `skinHex(selectedSkin)` (same catalog hexes as the removed `skinMap`), plus a new neon underglow plane under the chassis from `neonHex(selectedNeon)`. `applyCosmetics()` is invoked at every `prepareRace()` — an event-driven refresh, never per-frame, no physics impact.

## P8.7 — Documented Skip

**P8.7 — Performance upgrades intentionally skipped because the GDD defines progression as cosmetic-only.** The catalog (`ContentCatalog.ts` header) documents this explicitly: no stat-bearing items exist, no upgrade/speed/boost economy exists, and the garage UI contains no performance section. Nothing in P8 introduces a performance purchase path.

## Browser Verification (P8.8 — temporary probes, deleted)

Three Playwright probes, run against the real dev server, all PASSED, then deleted (only the 40 baseline E2E tests remain):

1. **Probe A (desktop, `probe-p84.spec.ts`)** — fresh profile: menu shows `LEVEL 1 / 0 COINS / 0 RACES / 0 of 1000 XP`; one full AI race → ceremony `+400 XP / +200 COINS`, totals `400 / 200`, NO level-up (level 1); `vs_profile_state` → `"xp":400` (polled, no arbitrary sleep); menu rebuilt after the race shows `400 / 600 XP TO LEVEL 2 / 200 COINS / 1 RACES`; reload → intact.
2. **Probe B (desktop, `probe-p85.spec.ts`)** — seeded `{xp:950, coins:2000}`: menu shows `2,000 COINS / 950 of 1000 XP`; garage shows 11 cards, profile stats `1 / 2,000 / 0`; buy 'blue' (catalog 1,500) → coins `500`, card OWNED; second tap → EQUIPPED + `selected`; reload → still equipped; race (+400 XP → 1350) → ceremony `LEVEL 1 → LEVEL 2` banner, totals `1350 / 700`, stat grid still exactly 3.
3. **Probe C (Pixel 5, `probe-p88.spec.ts`)** — zero horizontal overflow on menu profile strip and garage; tap purchase without funds → error toast, no equip, no overflow.

## Validation — exact commands and results

```bash
npm run typecheck                             # PASS (tsc --noEmit, 0 errors)
npx vitest run                                # 544 passed (40 files) — baseline 521 + 23 new (16 view + 7 garage domain)
npx eslint src --ext .ts                      # PASS (0 errors/warnings)
npx prettier --check "src/**/*.{ts,css}" "e2e/**/*.ts"   # PASS
npm run build                                 # ✓ built in 1.16s
npx playwright test --project=chromium        # 14 passed / 6 intentional skips / 0 failed (baseline preserved)
npx playwright test --project=mobile-chromium # 13 passed / 7 intentional skips / 0 failed (baseline preserved)
```

Unit inventory: `ProgressionView.test.ts` 16 new; `ProfileManager.test.ts` +7 (garage domain); the full suite is **544/544** across 40 files — no existing test weakened or deleted (521 + 23 = 544).

## Regressions / Known Limitations

- **No regressions**: full unit suite 544/544; chromium E2E 14/6/0 and mobile 13/7/0 — identical to the P8.3 baseline; `.ceremony-stat` count still exactly 3 (game-flow.spec.ts:210 passes); TournamentManager, SaveManager, AI, physics, replay, hand tracking, versus/multiplayer, navigation untouched.
- **Two-tap purchase UX**: buying then equipping is two taps (domain keeps purchase and equip separate). Intentional — matches the P8.2-era domain contract and keeps `purchaseSkin` side-effect-free beyond unlocking.
- **Cosmetics are visual-only**: skin + neon have zero gameplay effect by design (GDD cosmetic-only).
- **Persistence failure warning**: unchanged single `console.warn` on write failure (P8.3 behavior preserved).
- **`applyCosmetics` timing**: cosmetics refresh at race start; a garage change is visible from the next race (no live mid-race restyle — per-frame work deliberately avoided).

## Answers to the Required Report Questions

- XP/level display: one derivation (`xpProgress`, flat 1000/level) shared by menu, garage and ProgressionView tests; the gate's `levelBefore/levelAfter` are the ceremony's source.
- Coin display: `formatCurrency` everywhere (menu, garage, ceremony, results, toasts never render values) — no duplicated formatting.
- Garage data: `SKIN_ITEMS` / `NEON_ITEMS` are the only cosmetic source; GarageScreen renders them, never redefines them.
- Purchase validation: catalog price authority; optional caller price must match exactly; unknown ids rejected; no mutation on failure (unit-tested: wrong price, NaN, float, negative, off-by-one, unknown id, double purchase, insufficient funds).
- Equip validation: known AND owned required; fallback never touches an unowned/unknown item (unit-tested).
- Cosmetic application: `applyCosmetics()` at race start reads the authoritative state; `skinMap` duplicate removed; neon underglow added; reduced-motion respected; no per-frame work.
- Performance upgrades: SKIPPED (P8.7 documented skip — GDD cosmetic-only).
- Mobile: Pixel-5 probe — no overflow on menu/garage, taps work, error toast visible; mobile E2E baseline preserved.
- Browser verification: three probes (menu+ceremony+reload / seeded level-up+garage purchase+equip+reload / mobile overflow+taps) — all passed, all deleted.
- Level-up presentation: `.ceremony-levelup` banner with LEVEL X → LEVEL Y text, only when `levelsGained > 0`; totals row shows TOTAL XP / COIN BALANCE / TITLE; non-AI results get the same presentation in a rewards strip.
- Duplicate-source audit: no id/price/hex/formula is defined in UI code; no direct localStorage reads in UI; no new global store; RaceResultGate still the ONLY reward boundary.
- Exact results: 544/544 unit (40 files), typecheck/lint/prettier/build PASS, chromium E2E 14/6/0, mobile E2E 13/7/0.

## Final Verdict

**PASS — P8 COMPLETE.** Progression presentation (P8.4), garage domain validation (P8.5), catalog-driven garage UI + in-race cosmetic integration (P8.6), documented cosmetic-only skip (P8.7), browser verification (P8.8) and full regression (P8.9) are all delivered. The P8.1–P8.3 foundations are preserved: 544/544 unit tests, full E2E baselines intact on desktop and mobile, no regressions, no new stores, single reward boundary and single cosmetic authority.
