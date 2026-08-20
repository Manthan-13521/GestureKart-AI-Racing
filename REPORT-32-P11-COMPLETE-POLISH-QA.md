# REPORT-32 — P11 COMPLETE: POLISH & QA (RELEASE-READY)

## 1. Objective

Complete the P11 phase ("Polish & QA" per GDD §17) in a single run on the frozen
P10 baseline: implement every still-missing GDD requirement for performance
tiers + dynamic resolution, accessibility (one-hand mode, colorblind presets,
reduced-motion completeness), the audio sound-map / mixing completion, and the
rich-visual-feedback / victory presentation items, then pass the full validation
gate (unit suite, typecheck, lint, prettier, build, chromium E2E, mobile E2E)
plus a real-browser verification probe on desktop and mobile. Write this report
and STOP — **no P12 started.**

## 2. Scope Locked (GDD-referenced, no invented features)

Audit result — the concrete P11 scope (all anchored to MASTER-GDD):

- **Perf tiers (GDD §11.2)** — High / Mid / Low quality tiers; auto-tier +
  rolling 2s frame-budget auto-drop (frame > 18ms sustained → step resolution
  down; recovery below 16ms → step back up). Wire the previously dead
  graphics-quality / shadows / particles settings.
- **Accessibility (GDD §2.4)** — colorblind presets (deuteranopia/protanopia/
  tritanopia palettes), one-hand mode (steering + throttle on one touch),
  reduced-motion completeness (speed lines, vignette, collision flash, camera
  shake, particle bursts all honor the toggle).
- **Audio (GDD §12.1/§12.2/§12.3)** — master → music/SFX/UI/ambience buses;
  menu music −6dB; remaining sound-map items (cinematic intro sting, lightning
  rumble, NEW RECORD gold sting, victory brass + crowd wash, defeat minor
  resolve, near-miss whoosh, boost swell, ghost delta tick, ambience wind loop,
  UI deny); no duplicate one-shot SFX in a frame (cooldown guard).
- **Rich visual feedback (GDD §6.7 / §13)** — combo ring around the combo
  multiplier, near-miss glow, speed lines (exists), victory fireworks +
  confetti (fireworks added to VictoryCeremony).
- **Browser matrix (GDD §17)** — desktop + mobile E2E green and a temporary
  real-browser probe for the new surface (deleted after).

## 3. Architecture Before P11

- **Settings**: `SaveManager` had boolean `colorblind`, `graphicsQuality`
  (stored but unused), `shadows`, `particles` (stored but unused); the
  `SettingsScreen` had no one-hand or colorblind controls.
- **Input**: `TouchSource.read()` was strictly left/right/throttle independent —
  no one-hand composition.
- **Audio**: `AudioManager` had engine/gear/collision/UI tones via `SoundHooks`;
  single master gain, no buses; no music; no boost/near-miss/victory/defeat/
  intro/lightning/ghost-tick/NEW-RECORD SFX; one-shot SFX could double-trigger
  in a frame.
- **VFX**: HUD combo existed as text only (no ring); near-miss had no glow;
  VictoryCeremony had confetti only (no fireworks); reduced-motion gated only
  some elements (camera shake / sparks), not speed lines / vignette / flash.
- **Rendering**: fixed `renderer.setPixelRatio(window.devicePixelRatio)`;
  graphics-quality/shadows/particles settings were dead (never applied).

## 4. Audit Findings (gaps vs GDD)

1. Quality tiers existed only as a stored string — never applied. `setPixelRatio`
   was fixed at `devicePixelRatio` regardless of tier or frame budget.
2. `shadows` / `particles` settings were saved but ignored by the renderer.
3. Colorblind accessibility was a single boolean with no palette presets.
4. One-hand mode (GDD §2.4 Input) was missing entirely.
5. Reduced-motion didn't gate speed lines, speed vignette, or collision flash.
6. Sound map incomplete: missing boost swell, near-miss whoosh, ghost delta tick,
   cinematic intro sting, lightning rumble, NEW RECORD gold sting, victory brass
   - crowd wash, defeat minor resolve, wind ambience, menu/race music beds, UI
     deny.
7. Audio had no bus architecture and no one-shot SFX dedup (double-trigger risk).
8. Menu music −6dB mixing rule unapplied.
9. Combo ring and near-miss glow (GDD §6.7 rich feedback) missing.
10. Victory fireworks (GDD §13 victory presentation) missing.

## 5. Architecture After P11

```
                     P11 SURFACE (all wired in main.ts)
  ┌─────────────────────────────────────────────────────────────┐
  │ QUALITY   resolveQualityConfig(mode, dpr, shadows, particles)│
  │           → Game.setQuality()  ·  FrameBudgetScaler (2s)     │
  │ AUDIO     master ─ sfx/ambience/music buses · menu −6dB      │
  │           SfxCooldown(kind, ms) guards every one-shot        │
  │ A11Y      ThemeManager presets → data-colorblind-mode        │
  │           oneHand → TouchSource throttle=(L||R)?1:0          │
  │           reducedMotion → lines/vignette/flash/shake/sparks   │
  │ VFX       combo ring SVG arc · near-miss glow · fireworks     │
  └─────────────────────────────────────────────────────────────┘
```

## 6. Performance Tiers — Design

`src/managers/QualityManager.ts` (new, pure / testable — no WebGL dependency):

```
QualityConfig { pixelRatio, shadows, particles, bloom, ssr, weather }
resolveQualityConfig(mode, dpr, shadowsToggle, particlesToggle): QualityConfig
  High: min(dpr, 2) · shadows on · bloom on · ssr on · weather on
  Mid:  min(dpr, 1.5) · light bloom · no ssr · weather on
  Low:  1.0 · no post · weather off (mobile baseline)

FrameBudgetScaler
  window 2000ms · drop when frame > 18ms (sustained) · recover when < 16ms
  minFrames 15 · resolution step ×0.8 · floor 0.6 of tier pixelRatio
  effectivePixelRatio(config) = config.pixelRatio * resolutionMultiplier
```

- `Game.setQuality(config)` applies pixelRatio + renderer-derived toggles and
  gates the existing post-processor / shadow / particle paths off the config.
- `main.ts` records every frame's `frameMs` into the scaler and re-applies
  quality whenever `resolutionMultiplier` changes (drop **and** recovery — see
  Bug 3 below).

## 7. Performance Tiers — Wiring & Dead Settings

- `settings.save({graphicsQuality|shadows|particles})` → `applyQuality()`.
- `applyQuality()` composes `resolveQualityConfig` with the scaler's effective
  ratio and calls `game.setQuality(...)`.
- `shadows` / `particles` toggles now actually change the renderer configuration
  (previously dead).

## 8. Audio — Bus Architecture & Mixing (GDD §12.1/§12.3)

- `AudioManager` gains `sfxGain`, `ambienceGain`, `musicGain` buses under
  `masterGain`; `masterVolume` scales the master bus.
- Menu / race music bed runs at `musicGain = 0.5` (−6dB) per §12.3.
- `startMusic('menu'|'race')` / `updateMusic(intensity)` / `stopMusic()` are
  procedural (no asset files needed in headless tests).

## 9. Audio — Sound-Map Completion (GDD §12.2)

Added to `AudioManager`:

- boost swell (`playBoost`), near-miss whoosh (`playNearMiss`),
  ghost delta tick (`playGhostTick`, fired from GhostHud `onDeltaTick`),
  cinematic intro sting (`playIntroSting`),
  lightning rumble (`playLightningRumble`, storm-entry edge-detect),
  NEW RECORD gold sting (`playVictory` variant),
  victory brass + crowd wash (`playVictory`) / defeat minor resolve
  (`playDefeat`), wind ambience loop (`updateWeather`),
  UI deny (`SoundHooks.deny`), `playNoiseWash` transition layer.

## 10. Audio — One-Shot Dedup (SfxCooldown)

- `src/managers/SfxCooldown.ts` (new, pure): `tryAcquire(kind, ms)` blocks
  re-plays of the same kind inside the cooldown window; clock-injectable.
- `AudioManager.playSfx` routes every one-shot through it (no duplicate SFX in
  a frame).

## 11. Audio — Lifecycle Safety

- Race start: `stopAll()` + intro sting; countdown continues engine/gear/weather
  only while `state.started && !gameOver`.
- Game over: `stopMusic()` (victory/defeat sting plays after).
- Menu: `stopAll()` + menu music.
- Replay entry (from ceremony) and replay exit (`goToMainMenu` → `showMenu`)
  always route through the stop/menu path — no stale race layers.
- `stopAll()` also clears the SFX cooldown map.

## 12. Accessibility — Colorblind Presets (GDD §2.4 Vision)

- `A11yPrefs` gains `colorblindMode: 'none'|'deuteranopia'|'protanopia'|
'tritanopia'` while keeping legacy `colorblind: boolean` (true → deuteranopia)
  for backward compatibility.
- `src/ui/colorblind.ts` (new, pure): preset palette resolver + normalization.
- `ThemeManager` applies the preset token overrides and sets both
  `data-colorblind` (boolean) and `data-colorblind-mode` on `<html>`.
- `ui.css` adds the deuteranopia/protanopia/tritanopia CSS preset overrides.

## 13. Accessibility — One-Hand Mode (GDD §2.4 Input)

- `InputManager.oneHand: boolean`; `TouchSource.read()` composes throttle from
  either steering side: `throttle = (left || right) ? 1 : 0` — one hand steers
  AND accelerates.
- `SettingsScreen` Controls tab gains the One-Hand toggle; saved + restored.
- Mobile touch buttons remain on their original sides; the read logic is the
  only authority (input-architecture untouched otherwise).

## 14. Accessibility — Reduced-Motion Completeness (GDD §2.4 Motion)

- `Game.reducedMotion` gates camera shake + spark bursts (P10-era partial).
- `main.ts` now also gates: speed lines (`drawSpeedLines` skipped + overlay
  cleared), speed vignette (opacity 0), collision flash (class not added).
- `ParticlePool.emissionScale` and `WeatherSystem.enabled` feed the same flag
  so rain/storms and bursts are reduced too.

## 15. VFX — Combo Ring (GDD §6.7)

- `index.html` adds an inline SVG ring next to the combo value; CSS drives the
  arc (`stroke-dashoffset`), fills toward ×5, and turns gold at max.
- `main.ts` `updateGameHUD` maps `comboMultiplier` → arc fill every frame.

## 16. VFX — Near-Miss Glow (GDD §6.7)

- `#near-miss-glow` element + CSS animation; triggered on a near-miss event
  (flash + fade), aligned with the near-miss toast.

## 17. VFX — Victory Fireworks (GDD §13)

- `VictoryCeremony` particle system extended with a `kind` field
  (`confetti` | `spark`), gravity, life fade, and a repeating `spawnFirework`
  burst (~1 per 0.6s) over the results panel alongside the existing confetti.

## 18. Feedback Consistency (main.ts wiring)

Single event → audio + VFX + HUD map:

| Event            | Audio                                  | VFX / HUD                               |
| ---------------- | -------------------------------------- | --------------------------------------- |
| Race start       | intro sting                            | intro (unchanged)                       |
| Boost            | `playBoost` (cooldown 250ms)           | boost bar / flare                       |
| Near miss        | `playNearMiss` (cooldown 300ms)        | near-miss glow + toast                  |
| Collision        | `playCollision` (cooldown 250ms)       | collision flash (unless reduced-motion) |
| Ghost delta flip | `playGhostTick` (cooldown 150ms)       | ghost HUD line                          |
| Storm entry      | `playLightningRumble` (cooldown 800ms) | weather system                          |
| NEW RECORD       | `playVictory` gold sting               | record HUD                              |
| Win / Loss       | `playVictory` / `playDefeat`           | ceremony + fireworks                    |

## 19. Contracts Preserved

- Race physics, seeded deterministic AI, RaceDirector authority — untouched.
- Replay architecture (input-boundary recorder, runtime, viewer, photo) —
  unchanged; `GhostHud` gained an **optional** constructor arg (`onDeltaTick`),
  backward compatible (existing call sites unaffected).
- `SaveManager` `SAVE_VERSION` 3 → 4 with a migration for stored colorblind
  state (see Bug 1); all existing save fields preserved.
- `SettingsModel` gained required `oneHand` — all test fixtures updated.
- Input architecture extended (one-hand), not rewritten; keyboard/gyro/hand/
  phone paths untouched.
- NavigationSystem, progression formulas, RaceResultGate, ProfileManager,
  ContentCatalog, tournament rules, multiplayer — untouched.
- Photo mode (post-processor focus/grain/contrast, capture) — untouched.

## 20. Files Created

- `src/managers/QualityManager.ts` — quality config + frame-budget scaler.
- `src/managers/QualityManager.test.ts` — 8 tests.
- `src/managers/SfxCooldown.ts` — one-shot SFX dedup guard.
- `src/managers/SfxCooldown.test.ts` — 4 tests.
- `src/ui/colorblind.ts` — colorblind preset resolver/normalizer.
- `src/ui/colorblind.test.ts` — 4 tests.
- `REPORT-32-P11-COMPLETE-POLISH-QA.md` — this report.

## 21. Files Modified

- `src/ui/tokens.ts` — `ColorblindMode` + `A11yPrefs.colorblindMode`.
- `src/ui/ThemeManager.ts` (+ tests) — presets, `data-colorblind-mode`.
- `src/ui/ui.css` — colorblind CSS presets; `src/style.css` — combo-ring SVG,
  near-miss glow CSS.
- `index.html` — combo ring SVG + `#near-miss-glow`.
- `src/managers/SaveManager.ts` (+ tests) — v4, oneHand, colorblindMode,
  migration.
- `src/screens/SettingsScreen.ts` — one-hand toggle + colorblind preset select.
- `src/input/sources/TouchSource.ts`, `src/managers/InputManager.ts` —
  one-hand composition (+ touch tests).
- `src/graphics/ParticlePool.ts` — emissionScale; `src/graphics/WeatherSystem.ts`
  — enabled gate.
- `src/game/Game.ts` — reducedMotion field, `setQuality`.
- `src/ui/VictoryCeremony.ts` — fireworks particle system.
- `src/ui/core/SoundHooks.ts` — volume multiplier, `raceFinish`, `newRecord`,
  `deny`.
- `src/managers/AudioManager.ts` — buses, wind, music, full sound map, cooldown.
- `src/replay/hud.ts` (+ `hud.test.ts`) — `onDeltaTick` callback.
- `src/main.ts` — quality scaler wiring, audio hooks, one-hand, reduced-motion
  gates, combo ring, near-miss glow, settings API, lifecycle stops.
- Test fixtures: `flow.test.ts`, `control-ux.test.ts`, `keyboard.flow.test.ts`,
  `ThemeManager.test.ts`, `SaveManager.test.ts`, `InputManager.touch.test.ts`.

## 22. Tests Added

- `QualityManager.test.ts` (8) — tier configs; shadows/particles toggles;
  scaler drop after sustained slow frames, recovery to 1.0, minFrames, floor.
- `SfxCooldown.test.ts` (4) — first-play allow, cooldown block, per-kind
  independence, reset.
- `colorblind.test.ts` (4) — preset resolution, boolean mapping, normalization.
- `hud.test.ts` (delta tick) — tick fires on delta sign/whole-second change;
  silence otherwise.
- `ThemeManager.test.ts` — preset attribute application.
- `InputManager.touch.test.ts` — one-hand throttle composition.
- `SaveManager.test.ts` — version 4 + legacy-boolean migration.

## 23. Unit Suite Totals

- Baseline (P10): **581 passing / 42 files**.
- After P11: **612 passing / 46 files** (`+31 tests, +4 files`).

## 24. Browser Verification (temporary probe, deleted after)

Temporary `e2e/p11-probes.spec.ts` (6 tests, desktop + mobile), run against the
dev server, then **deleted** — no probe residue in the final tree:

1. Settings shows One-Hand toggle (Controls tab) + Colorblind preset select
   (Accessibility tab) — PASS.
2. Selecting a colorblind preset applies `data-colorblind-mode` +
   `data-colorblind` on `<html>` — PASS.
3. Combo ring fill + near-miss glow elements present in DOM — PASS.
   4–6. Same three on the mobile (Pixel 5) project — PASS.

**6 passed / 0 failed.**

## 25. Bugs Found and Fixed

1. **SaveManager migration logic bug** — a `!merged.colorblindMode` check never
   triggered because the default `'none'` is truthy, so legacy boolean saves
   weren't migrated to a preset. Fixed in `load()` to test
   `parsed.colorblindMode === undefined`. Caught by the new migration test.
2. **Frame-budget recovery never re-applied full resolution** — `applyQuality()`
   was only called when `resolutionMultiplier < 1`, so recovering back to 1.0
   left the renderer at the last dropped ratio. Fixed with a
   `lastAppliedResolutionMult` change-detect so drop AND recovery re-apply.
3. **`Illegal invocation` in the browser (browser-only crash)** —
   `SfxCooldown` defaulted to `now = performance.now`; the unbound reference
   threw `Illegal invocation` when invoked inside a method. Node (happy-dom)
   tests passed; the chromium E2E caught it on race start (`playIntroSting`).
   Fixed by wrapping: `now = () => performance.now()`. Confirmed green on the
   next full E2E run.
4. **E2E run pollution during development** — an earlier E2E run was executing
   while `main.ts` was being edited; Vite HMR full-reloads reset page state
   mid-test (12 nav-timeout failures that were NOT product regressions). After
   the code was stable, the clean final run passed 27/13/0.

## 26. Regression Results (final, clean run)

- `npx vitest run` → **612 passed (46 files)** — PASS
- `npm run typecheck` → PASS
- `npm run lint` → PASS
- `npx prettier --check .` → PASS
- `npm run build` → PASS (chunk-size warning only, pre-existing)
- `npx playwright test` (chromium) → **14 passed / 6 skipped / 0 failed**
  (matches P10 baseline)
- `npx playwright test` (mobile-chromium) → **13 passed / 7 skipped / 0 failed**
  (matches P10 baseline)
- P11 browser probe (desktop + mobile, spec deleted after) → **6 passed**

## 27. Known Limitations

- Music beds are procedural tones (synthesized), not licensed stems — matches
  the asset-free project constraint; the bus/gain/mixing structure is what the
  GDD contracts.
- Dynamic resolution steps the _pixel ratio_ (render target resolution), not
  the scene LOD / post quality mid-race; the tier select covers the rest.
- The combo ring reads `state.comboMultiplier` (survival only) — the SVG stays
  hidden in other modes (existing combo HUD gating).
- One-hand mode changes throttle semantics only for touch; keyboard/gyro/hand
  input still uses independent throttle+steer (documented GDD approach).

## 28. Required Invariants (final check)

- RaceResultGate is the only progression reward boundary — preserved.
- Replay playback awards zero progression — preserved.
- ProfileManager / ContentCatalog / RaceDirector authorities — preserved.
- Replay determinism / input-boundary design — preserved.
- AI determinism, physics, tournament rules, multiplayer — preserved.
- NavigationSystem, Input architecture (extended only), photo mode — preserved.
- Mobile layout (no overflow), keyboard/touch/phone/hand — verified green.
- No debug hooks / probe residue in the final tree — verified (grep clean).

## 29. Exact Validation Commands

```bash
npx vitest run                      # 612 passed (46 files)
npm run typecheck                   # PASS
npm run lint                        # PASS
npx prettier --check .              # PASS
npm run build                       # PASS
npx playwright test --project=chromium        # 14 passed / 6 skipped / 0 failed
npx playwright test --project=mobile-chromium # 13 passed / 7 skipped / 0 failed
```

## 30. Final Verdict

**PASS.** P11 implementation complete: quality tiers + rolling 2s frame-budget
auto-drop with recovery (previously dead settings now live), full accessibility
surface (colorblind presets, one-hand mode, reduced-motion completeness), the
audio sound map / bus architecture / −6dB menu mixing / one-shot dedup, and the
rich-feedback + victory-fireworks VFX. All gates green: 612/612 unit tests,
typecheck, lint, prettier, build, and both E2E projects matching the P10
baseline; the temporary desktop + mobile browser probe passed and was deleted.
One browser-only crash (`Illegal invocation`) was found by E2E and fixed. All
P1–P10 regression contracts remain intact. **STOP after P11 — no P12 started.**
