# 04-ASSETS-AND-IMPLEMENTATION-ROADMAP.md

**Virtual Steering — P15 Assets & Implementation Roadmap**  
Extremely practical. Part A = assets (verified licenses), Part B = priorities, Part C = phased execution.

---

# PART A — ASSETS

**Policy:** ONLY CC0, MIT, ISC, Apache-2.0, OFL, Public Domain. Unclear / NC / SA / GPL = DO NOT USE or mark **VERIFY LICENSE**. All assets self-hosted or CDN with integrity hashes. No runtime API calls requiring attribution.

## A1. Fonts (Google Fonts — OFL 1.1)

| Font                | Role                             | Source URL                                        | Weights      | Subset     | Self-Host     | License | Commercial | Attribution  | Fallback                   |
| ------------------- | -------------------------------- | ------------------------------------------------- | ------------ | ---------- | ------------- | ------- | ---------- | ------------ | -------------------------- |
| **Orbitron**        | Display/Logo/Buttons/Countdown   | https://fonts.google.com/specimen/Orbitron        | 400–900 + VF | Latin      | Yes (preload) | OFL 1.1 | ✅         | Not required | Rajdhani, system-ui        |
| **Rajdhani**        | Headings/HUD/Labels              | https://fonts.google.com/specimen/Rajdhani        | 300–700 + VF | Latin      | Yes (preload) | OFL 1.1 | ✅         | Not required | Share Tech Mono, system-ui |
| **Inter**           | Body text                        | https://fonts.google.com/specimen/Inter           | 100–900 + VF | Latin      | Yes (preload) | OFL 1.1 | ✅         | Not required | system-ui, sans-serif      |
| **Share Tech Mono** | Timers/Leaderboards/tabular data | https://fonts.google.com/specimen/Share+Tech+Mono | 400, 700     | Latin      | Yes           | OFL 1.1 | ✅         | Not required | JetBrains Mono, monospace  |
| Chakra Petch        | Countdowns/Flags (optional)      | https://fonts.google.com/specimen/Chakra+Petch    | 300–700      | Latin+Thai | Optional      | OFL 1.1 | ✅         | Not required | Rajdhani                   |
| Oxanium             | Numeric/Stat HUD (optional)      | https://fonts.google.com/specimen/Oxanium         | 200–800      | Latin      | Optional      | OFL 1.1 | ✅         | Not required | Rajdhani                   |
| JetBrains Mono      | Data/code (optional)             | https://fonts.google.com/specimen/JetBrains+Mono  | 100–800 + VF | Latin      | Optional      | OFL 1.1 | ✅         | Not required | Share Tech Mono            |

**OFL note:** If self-hosting font files, include each font's `OFL.txt` in `THIRD_PARTY_NOTICES.md`.

## A2. Icons

| Library                    | License    | Racing icons available                                                           | Delivery                       | Size     | Commercial | Attribution                          | Fallback       |
| -------------------------- | ---------- | -------------------------------------------------------------------------------- | ------------------------------ | -------- | ---------- | ------------------------------------ | -------------- |
| **Phosphor** (RECOMMENDED) | MIT        | car, steering-wheel, trophy, joystick, engine, gear, ranking, speedometer, timer | SVG/Font/React, tree-shakeable | 300+     | ✅         | MIT notice in THIRD_PARTY_NOTICES.md | Lucide, Tabler |
| Tabler                     | MIT        | 6,184 icons; car, steering-wheel, trophy, settings, joystick, speedometer        | SVG/Font/React                 | Large    | ✅         | MIT notice                           | Lucide         |
| Lucide                     | ISC        | car, gauge, settings, trophy, medal, ranking, gamepad-2, flag, timer             | SVG/React                      | Light    | ✅         | ISC notice                           | Phosphor       |
| Material Symbols           | Apache-2.0 | settings, trophy, sports/esports, speed, leaderboard, steering                   | Variable Font                  | Variable | ✅         | Apache notice                        | Phosphor       |

**Recommendation:** Phosphor — best thematic match, MIT, tree-shakeable SVG. Keep license notice.

## A3. 3D Models (glTF for Three.js)

| Asset                                      | Source                                                          | License                                     | Commercial                                          | Attribution                                              | Use                                                             | Fallback                             |
| ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------ |
| **Kenney Car Kit** (sports car / supercar) | https://kenney.nl/assets/car-kit                                | CC0 1.0                                     | ✅                                                  | Not required (courtesy ok)                               | Hero car (Main Menu) + Garage preview. Low-poly <5k tris, ~50KB | Procedural car built from primitives |
| Kenney Racing Kit                          | https://kenney.nl/assets?q=racing (Kenney car tag page)         | CC0 1.0                                     | ✅                                                  | Not required                                             | Additional race vehicles                                        | Car Kit                              |
| Kenney Toy Car Kit                         | https://kenney.nl/assets/toy-car-kit                            | CC0 1.0                                     | ✅                                                  | Not required                                             | Stylized/kart alternative aesthetic                             | Car Kit                              |
| Kenney Starter-Kit-Racing (GitHub)         | https://github.com/KenneyNL/Starter-Kit-Racing                  | CC0 1.0                                     | ✅                                                  | Not required                                             | `.glb` cars + sounds load straight into GLTFLoader              | Car Kit                              |
| Poly Haven 3D                              | https://polyhaven.com/models                                    | CC0 1.0                                     | ✅                                                  | Live API requires credit — **self-host assets to avoid** | Trackside props (barriers, buildings), no cars                  | Kenney props                         |
| Sketchfab CC0 filter                       | https://sketchfab.com/search?features=downloadable&licenses=cc0 | **CC0 / CC-BY — VERIFY EACH MODEL'S BADGE** | CC0 ✅ / CC-BY ✅ (with credit) / CC-BY-NC or SA ❌ | CC-BY requires credit screen                             | Specialty props                                                 | Kenney                               |

## A4. Textures / HDRIs

| Asset                              | Source                               | License                         | Commercial | Attribution                                                                | Use                                                        | Fallback                             |
| ---------------------------------- | ------------------------------------ | ------------------------------- | ---------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| **ambientCG** (PBR textures to 8K) | https://ambientcg.com                | CC0 1.0                         | ✅         | Not required                                                               | Asphalt, concrete, metal, noise — track surfaces, env maps | Procedural gradients/noise           |
| **Poly Haven HDRIs**               | https://polyhaven.com/hdris          | CC0 1.0                         | ✅         | Live API requires "Powered by Poly Haven" — **self-host downloaded files** | Showroom HDRI lighting for hero car / garage               | Gradient environment, plain lighting |
| OpenGameArt CC0 filter             | https://opengameart.org (CC0 filter) | **CC0 per asset — VERIFY each** | ✅         | Per asset                                                                  | Neon/noise overlays                                        | Generated CSS/SVG                    |

## A5. UI Sounds

| Asset                                  | Source                                                  | License                                            | Commercial | Attribution  | Use                                            | Fallback                    |
| -------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- | ---------- | ------------ | ---------------------------------------------- | --------------------------- |
| **Kenney Interface Sounds**            | https://kenney.nl/assets/interface-sounds               | CC0 1.0                                            | ✅         | Not required | Clicks, confirms, navigation                   | Web Audio synthesized blips |
| Kenney UI Audio                        | https://kenney.nl/assets/ui-audio                       | CC0 1.0                                            | ✅         | Not required | Buttons, switches, generic clicks              | Interface Sounds            |
| Kenney Sci-fi / Impact / Digital Audio | https://kenney.nl/assets (audio category)               | CC0 1.0                                            | ✅         | Not required | Engine whooshes, boosts, impacts, glitch beeps | Synthesized                 |
| freesound.org CC0 filter               | https://freesound.org/search/?q=race+engine&license=cc0 | **CC0 per sound — screenshot license at download** | ✅         | Not required | Race/engine/crowd SFX                          | Kenney                      |

## A6. CSS/Design Resources (MIT — code only, reference for patterns)

| Resource | URL                                    | License | Use                                              |
| -------- | -------------------------------------- | ------- | ------------------------------------------------ |
| GlassKit | https://github.com/JUNGHERZ/GlassKit   | MIT     | 24 pure-CSS glass components reference           |
| Glin UI  | https://github.com/glincker/glinui     | MIT     | Aurora backgrounds, glow/prism borders reference |
| liqgui   | https://github.com/bymehul/liqgui      | MIT     | Glass web components, spring physics reference   |
| farvist  | https://github.com/FloKuersten/farvist | MIT     | Sass glassmorphism utilities reference           |
| arc-ui   | https://github.com/arc-language/arc-ui | MIT     | CSS-first liquid-glass ~3KB reference            |

**Usage:** Patterns only. Copied code inherits MIT — keep notices.

## A7. VERIFY LICENSE / DO-NOT-USE

| Asset                                                                 | Reason                                                    |
| --------------------------------------------------------------------- | --------------------------------------------------------- |
| Sketchfab CC-BY-NC / CC-BY-SA models                                  | NC = no commercial; SA = copyleft derivative — DO NOT USE |
| freesound / OpenGameArt CC-BY-NC                                      | Commercial use forbidden — DO NOT USE                     |
| OpenGameArt GPL 2.0/3.0                                               | Copyleft contamination — DO NOT USE                       |
| Any asset with "personal use only" / "no redistribution" / no license | **VERIFY LICENSE** or DO NOT USE                          |
| Poly Haven live API (not the assets)                                  | ToS requires attribution — self-host instead              |
| Any AI-generated asset with unknown training data / unclear terms     | **VERIFY LICENSE** before use                             |

## A8. Recommended Asset Package

| Asset                                   | File                                             | ~Size         | Purpose                     |
| --------------------------------------- | ------------------------------------------------ | ------------- | --------------------------- |
| Kenney Sports Car                       | `car-sports.glb`                                 | ~50 KB        | Hero car + garage preview   |
| Kenney UI Sounds                        | `click.ogg`, `confirm.ogg`, `back.ogg`           | ~5 KB each    | Navigation feedback         |
| Poly Haven HDRI                         | `showroom_4k.hdr`                                | ~2 MB         | Garage/showroom lighting    |
| Phosphor Icons (SVG)                    | `car.svg`, `trophy.svg`, `steering-wheel.svg`, … | ~1 KB each    | UI icons                    |
| Orbitron/Rajdhani/Inter/Share Tech Mono | Latin-subset WOFF2                               | ~150 KB total | Typography                  |
| **Total added asset weight**            |                                                  | **~2.5 MB**   | Acceptable for browser game |

## A9. Attribution Checklist

1. **CC0** (Kenney, ambientCG, Poly Haven, CC0 Sketchfab, CC0 freesound): no credit required; optional courtesy.
2. **CC-BY** (some Sketchfab/OpenGameArt/freesound): credits screen with title, author, source URL, license link.
3. **MIT/ISC/Apache code + icons** (Phosphor, Tabler, Lucide, Material Symbols, CSS libs): `THIRD_PARTY_NOTICES.md` with copyright/license texts.
4. **OFL fonts**: include each font's `OFL.txt` in `THIRD_PARTY_NOTICES.md`.

---

# PART B — ASSET PRIORITIES

**P0 = essential · P1 = high value · P2 = polish · P3 = optional**

| Priority | Asset                                              | Justification                                                            |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| **P0**   | Orbitron, Rajdhani, Inter, Share Tech Mono (fonts) | Core identity + readability; already partially in use. Subset + preload. |
| **P0**   | Phosphor Icons                                     | Every button/card/chip needs icons; tree-shakeable SVG.                  |
| **P0**   | Kenney Sports Car `.glb`                           | Main Menu hero + Garage — the visual anchor.                             |
| **P0**   | Poly Haven showroom HDRI                           | Lighting for hero car/garage = "Garage Prestige".                        |
| **P1**   | Kenney Interface Sounds (click/confirm/back)       | Feedback parity with visuals; tiny size.                                 |
| **P1**   | ambientCG textures (asphalt/metal/noise)           | Track-surface realism + carbon/noise overlays.                           |
| **P1**   | Kenney Racing Kit / extra cars                     | Garage variety (only if garage cosmetics include car models).            |
| **P2**   | Kenney Sci-fi/Impact/Digital sounds                | Race feedback (boost, collision, near-miss).                             |
| **P2**   | Chakra Petch / Oxanium fonts                       | Countdown + stat readouts (only if existing fonts insufficient).         |
| **P2**   | Poly Haven 3D props                                | Trackside environment dressing (visual-only).                            |
| **P3**   | freesound CC0 crowd/engine SFX                     | Atmosphere; verify each license at download.                             |
| **P3**   | Sketchfab CC0 props                                | Specialty; verify each model badge.                                      |
| **P3**   | OpenGameArt CC0 overlays                           | Extra neon/noise textures; verify each.                                  |

**Note on cosmetic assets (skins/neons/wheels):** If garage cosmetics use raster images, generate them procedurally (CSS gradients, SVG) or use Kenney/Phosphor — avoid unlicensed images.

---

# PART C — IMPLEMENTATION ROADMAP

**Baseline:** P14 complete (653 unit tests, E2E 14/6/0 desktop + 13/7/0 mobile, prod probe 22/22). P15 has: design system foundation + Main Menu/Track Select/Mode Select redesigns done, **but 24 unit test failures, lint/prettier issues, remaining screens undone, E2E/probe not validated.**

**Cross-cutting constraint for EVERY phase:** preserve authorities — RaceResultGate, ProfileManager, SaveManager, ReplayStore, NavigationSystem, InputManager, deterministic simulation, replay correctness, persistence behavior. Visual-only changes must not alter gameplay logic.

---

## PHASE 0 — BASELINE AUDIT

- **Objective:** Reproduce current state; capture exact failure list.
- **Files affected:** none (read-only).
- **Tasks:**
  1. `npm run typecheck`, `npm run lint`, `npx prettier --check .`
  2. `npx vitest run` → record the 24 failing tests + failure reasons (selectors, mock API shape).
  3. `npm run build` (confirm passes).
  4. `npx playwright test` (dev) → confirm E2E status (expect blocked).
  5. Diff current `src/ui`, `src/screens` against P14 to catalog what changed.
  6. Note current `style.css` size, hero car file size, fonts loaded.
- **Constraints:** Read-only. Do not fix anything here.
- **Validation:** Baseline report with exact counts (test failures, lint errors, prettier files, build status, asset sizes).
- **Definition of done:** Complete, reproducible snapshot of P15 blockers.

---

## PHASE 1 — FIX P15 TEST COMPATIBILITY

- **Objective:** Restore green gates so all subsequent work is verifiable.
- **Files affected:** `tests/` (mock API shape), screen selectors in tests (`.glass-card`→`.card`, ModeSelect chip selectors, FlowApi mock missing props), any test setup TS issues.
- **Tasks:**
  1. Update unit tests: `.glass-card` → `.card`; `.menu-actions-premium` → actual `.menu-actions` used; ModeSelect chip exposure; add `achievements/profile/leaderboard` props to FlowApi mocks.
  2. Fix the 4 TypeScript test-setup errors.
  3. Run `npm run lint -- --fix`; `npx prettier --write .` (26 files).
  4. `npx vitest run` → target 0 failures.
  5. `npm run typecheck` → PASS.
- **Constraints:** Do NOT weaken/skip/delete tests. Selector updates must match real DOM. Keep test intent identical.
- **Validation:** Unit tests 100% pass; typecheck/lint/prettier pass.
- **Definition of done:** `npx vitest run` green; lint/prettier/typecheck green.

---

## PHASE 2 — DESIGN-SYSTEM STABILIZATION

- **Objective:** Make the design system from Phase F fully consistent and consumable before more screens.
- **Files affected:** `src/style.css`, `src/ui/tokens.ts`, `src/ui/components/*` (Button, GlassCard, TabBar, Badge, ProgressBar, ProgressArc, Chip, Modal, Toast, Tooltip, Toggle, Slider, Dropdown, LoadingState, Skeleton, EmptyState, ErrorState, RacingLine), `src/ui/core/*` (AnimationSystem, TransitionSystem, ThemeManager), `src/screens/ambient.ts`, `src/screens/heroCar.ts`.
- **Tasks:**
  1. Consolidate tokens per 03-DESIGN-SYSTEM (§1) — color, type, spacing, radius, shadow, glow, blur, opacity, z-index. Verify TS mirror in `tokens.ts`.
  2. Audit existing components against spec; fix drift (e.g., missing `min-height:48px`, missing focus-visible, missing reduced-motion classes).
  3. Add missing components used by upcoming screens (Modal, Toast, Chip, Skeleton, EmptyState, ErrorState, StatBlock, LeaderboardRow, TrackCard, ModeCard, AchievementCard).
  4. Implement `AnimationSystem.stagger()` + reduced-motion gate; `TransitionSystem` shared-element kind; `RacingLine` SVG component.
  5. Implement `ThemeManager` high-contrast palette, colorblind filters, `--scale` large-HUD.
  6. Re-verify 3 redesigned screens (MainMenu, TrackSelect, ModeSelect) use the system components (not bespoke CSS).
- **Constraints:** Do not rewrite architecture. Keep `.glass-card`/legacy selectors working until tests updated (Phase 1 already done). Do not animate blur. Respect budgets (CSS <25KB gzipped).
- **Validation:** All unit tests still green; lint/prettier/typecheck green; design-system checklist from 03 passes; build passes.
- **Definition of done:** Single source of truth for tokens/components/motion/theme; every existing + planned screen can be built from these components.

---

## PHASE 3 — REMAINING SCREEN REDESIGN

- **Objective:** Redesign all non-HUD screens per 02-SCREEN-BY-SCREEN-UX.
- **Files affected:** `src/screens/GarageScreen.ts`, `ProfileScreen.ts`, `LeaderboardScreen.ts`, `AchievementsScreen.ts`, `HowToPlayScreen.ts`, `SettingsScreen.ts`, `SplashScreen.ts`, `LoadingScreen.ts`, `VictoryCeremony.ts`, (matchmaking/lobby if separate screen), plus components from Phase 2.
- **Tasks (in this order):**
  1. **Garage** (P1): Three.js preview (reuse hero car GLTF), camera stages, category tabs, cosmetic grid, Equip + persistence.
  2. **Profile** (P1): XP arc, stat counters, title progression timeline, records mini-table, achievement summary.
  3. **Leaderboard** (P1): timing-tower rows, current-player highlight, tabs, filter pills, empty state.
  4. **Achievements** (P1): category tabs, lock/unlock/mastery states, data-driven rarity glow, completion ring, unlock animation.
  5. **How To Play** (P2): method tabs, step content, glyphs, search, "Start Racing" CTA if exists.
  6. **Settings** (P2): glass panels, grouped tabs, live preview, reset confirm, accessibility toggles.
  7. **Splash/Loading** (P2): brand animation, progress ring, press-to-skip.
  8. **Victory** (P2): crown drop, rank pop, XP arc sync, stat stagger.
- **Constraints:** Every screen must preserve its data source and logic. Matchmaking restyle only — do NOT touch PeerJS lifecycle. Reuse shared components; no bespoke duplicate styles. Mobile variants enforced per 02.
- **Validation:** Per-screen unit tests (new for redesigned screens) pass; existing tests green; no regression in NavigationSystem flows.
- **Definition of done:** All screens above redesigned and testable; visual QA checklist per screen (desktop + mobile) recorded.

---

## PHASE 4 — HUD / GAMEPLAY UI POLISH

- **Objective:** Polish race HUD + countdown without touching logic.
- **Files affected:** `src/screens/GameplayScreen.ts`, countdown rendering, HUD CSS in `style.css`.
- **Tasks:**
  1. Tabular numerals on ALL HUD numbers (speed, position, lap, time, score, combo).
  2. Ensure Critical Focus Area never occluded (audit cluster positions).
  3. Boost-ready color shift + pulse; rank gain/loss pop + announce; lap complete gold flash; draft/dirty pulses; near-miss/collision flashes (all existing events — visual treatment only).
  4. HUD contrast: light-on-dark strips, 10:1 numeric via glow + outline; large-HUD `--scale` support.
  5. Countdown: scale-pop numerals + GO flash (timing logic untouched).
  6. Mobile: repositioned clusters; touch controls never overlap; safe areas.
- **Constraints:** **Do NOT change HUD data, update rates, input wiring, or touch control lifecycle (GAS/AUTO).** Readability beats flourish — if a glow harms legibility, remove it.
- **Validation:** Existing HUD tests green; manual HUD readability pass; mobile landscape+portrait fallback verified.
- **Definition of done:** HUD polished, no occlusion, reduced-motion preserves state animation, all data/logic identical.

---

## PHASE 5 — MOTION / MICRO-INTERACTIONS

- **Objective:** Apply motion system comprehensively.
- **Files affected:** `src/ui/core/AnimationSystem.ts`, `src/ui/components/*` (ripple, magnetic hover), screens (entrance choreography), `src/style.css` (keyframes).
- **Tasks:**
  1. Button ripple + magnetic hover (mouse only; disabled touch + reduced-motion).
  2. Card magnetic hover (≤4px) + sheen sweep.
  3. Tab indicator, dropdown open, modal scale-in/out.
  4. Toast choreography (80ms stack stagger, slide-in-right).
  5. Achievement unlock, rank change, level-up, record-delta animations.
  6. Screen transition choreography incl. shared-element racing line (Menu→Track→Mode).
  7. Verify stagger limits (60ms, max 8) and asymmetric timing across all screens.
- **Constraints:** Transform/opacity only. Budgets per surface (hero ≤3 staggers; HUD micro only). Reduced motion disables all decorative.
- **Validation:** Motion QA checklist; no animation > spec duration; no layout thrash (Lighthouse performance); reduced-motion verified.
- **Definition of done:** Motion system uniformly applied; all choreography respects budgets + reduced motion.

---

## PHASE 6 — MOBILE / RESPONSIVE

- **Objective:** Mobile parity for every screen.
- **Files affected:** All screens (responsive variants), `src/style.css`, touch controls CSS, `index.html` viewport meta.
- **Tasks:**
  1. Verify every screen per 02 mobile variants (stacked cards, rails with peek, accordion, tab bars).
  2. Touch targets ≥48px everywhere; primary CTA 56px.
  3. Safe areas (`env(safe-area-inset-*)`) on HUD clusters, touch controls, tab bar, modals.
  4. No horizontal overflow at 360/375/393px; `touch-action: manipulation`; `overscroll-behavior: contain`.
  5. Landscape race forced + portrait fallback (existing behavior preserved).
  6. `@media (pointer: coarse)` press feedback (50ms).
  7. Test Pixel 5 (393×851), iPhone SE (375×667), Galaxy S23 (360×780).
- **Constraints:** Never hide HUD data on mobile — reposition. Do not compromise desktop for mobile (responsive variants, not compromise).
- **Validation:** Playwright mobile-chromium suite green; manual device toolbar pass; no overflow at 200% zoom.
- **Definition of done:** Every screen mobile-clean per checklist in 02-SCREEN-BY-SCREEN-UX.

---

## PHASE 7 — ACCESSIBILITY

- **Objective:** WCAG AA (AAA for critical HUD).
- **Files affected:** `src/ui/core/ThemeManager.ts`, `src/style.css`, screen templates (semantic HTML/ARIA), `src/main.ts` or `index.html` (SVG colorblind filters, announcer region).
- **Tasks:**
  1. Keyboard-only nav pass on all screens (tab order, arrows, Escape, Enter/Space).
  2. `:focus-visible` verified on every interactive element.
  3. Contrast audit: text ≥4.5:1 (target 7:1), interactive ≥7:1, HUD numeric ≥10:1; fix red accent instances.
  4. Colorblind presets (deuteranopia/protanopia/tritanopia) via SVG filters; redundant encoding audit (icon+text+shape+color) on all color-coded states.
  5. High-contrast mode palette functional.
  6. Reduced-motion: decorative disabled, state-communicating preserved.
  7. Semantic HTML + ARIA: buttons, progressbars, tablist, dialog, live regions, aria-hidden decorative.
  8. Large-HUD scale (1.5×) no overflow.
- **Constraints:** Do not remove any accessibility feature that exists (P14 a11y). No skip/weaken tests.
- **Validation:** `npx axe-cli` / Lighthouse a11y 100 (or zero serious); manual keyboard + screen-reader pass; colorblind simulators.
- **Definition of done:** Automated a11y clean; manual checklist (02/03 §6) complete.

---

## PHASE 8 — PERFORMANCE

- **Objective:** Meet all budgets.
- **Files affected:** `src/style.css` (size), hero car asset, fonts, ambient systems, HUD update paths.
- **Tasks:**
  1. CSS gzipped <25KB; subset+preload fonts (<150KB).
  2. Hero glTF <100KB (Kenney ~50KB) — verify no post-process on mobile, no shadows.
  3. Particles ≤60 desktop / ≤20 mobile; paused when tab hidden.
  4. Blur ≤12px/8px; no animated blur.
  5. DOM nodes <2000 on menus; virtualize leaderboard >100 rows; lazy-render offscreen rail cards.
  6. Verify FrameBudgetScaler, dynamic resolution, quality tiers, menu render gating unaffected.
  7. Build size delta <+50KB gzipped.
- **Constraints:** Do NOT weaken FrameBudgetScaler/quality tiers. Readability/gameplay visibility wins over effects.
- **Validation:** Lighthouse perf ≥90 mobile; rAF budget checks; build size measured; GPU/frame ≤2ms background mobile.
- **Definition of done:** All budgets in 03 §7 met; no regression to existing performance guardrails.

---

## PHASE 9 — FULL REGRESSION

- **Objective:** Prove nothing broke.
- **Files affected:** none (test-only).
- **Tasks:**
  1. `npm run typecheck` PASS
  2. `npm run lint` PASS (zero errors)
  3. `npx prettier --check .` PASS
  4. `npm run build` PASS
  5. `npx vitest run` → full unit suite green
  6. `npx playwright test` (desktop) → 14/6/0 (or updated counts, 0 failures)
  7. `npx playwright test --project=mobile-chromium` → 0 failures
- **Constraints:** No test weakened/skipped/deleted. Any failure → fix in place, re-run.
- **Validation:** All gates green simultaneously.
- **Definition of done:** Complete green regression output recorded.

---

## PHASE 10 — PRODUCTION BROWSER VERIFICATION

- **Objective:** Verify on production build, not dev server.
- **Files affected:** none (test-only).
- **Tasks:**
  1. `npm run build`
  2. `npx vite preview --port 4173 &`
  3. `npx playwright test -c playwright.prod.config.ts --reporter=line` → 22 tests (11 desktop + 11 mobile) all pass.
  4. Visual inspection of every screen (desktop + mobile) on the preview build per 02 checklist.
  5. Verify Vercel deployment reflects final build (if deployed).
- **Constraints:** Same assets/paths as production. No dev-only workarounds.
- **Validation:** 22/22 probe pass + visual inspection report.
- **Definition of done:** Production build fully validated on chromium + Pixel 5.

---

## PHASE 11 — CLEANUP / REPORT

- **Objective:** Zero residue + final documentation.
- **Files affected:** repo hygiene, `docs/p15-research/`, final report.
- **Tasks:**
  1. `rm -rf test-results playwright-report`; remove temp configs.
  2. Kill preview servers (`lsof -ti :4173 :5173 | xargs kill`).
  3. Ensure `THIRD_PARTY_NOTICES.md` complete (fonts OFL, MIT/ISC/Apache notices, CC-BY credits if any).
  4. Write final report `REPORT-36-P15-UIUX-VISUAL-TRANSFORMATION.md` (update): verdict, metrics, files changed, design decisions, remaining risks.
  5. Final `git status` clean of unintended files.
- **Constraints:** No leftover debug/commented code. Do not delete research docs.
- **Validation:** `git status` clean (only intended changes); report complete; no temp processes.
- **Definition of done:** Repo clean, report written, P15 fully validated and documented.

---

## ROADMAP SUMMARY

| Phase | Focus                       | Key Gate                                            |
| ----- | --------------------------- | --------------------------------------------------- |
| 0     | Baseline audit              | Failure list captured                               |
| 1     | Fix test compatibility      | Unit tests 100% + lint/prettier/typecheck green     |
| 2     | Design-system stabilization | Token/component/motion/theme single source of truth |
| 3     | Remaining screen redesign   | All P1/P2 screens built on shared components        |
| 4     | HUD/gameplay polish         | HUD readable, no occlusion, logic untouched         |
| 5     | Motion/micro-interactions   | Budgets + reduced-motion respected                  |
| 6     | Mobile/responsive           | Mobile parity, no overflow, touch targets ≥48px     |
| 7     | Accessibility               | WCAG AA, a11y automated + manual clean              |
| 8     | Performance                 | All budgets met                                     |
| 9     | Full regression             | All gates green                                     |
| 10    | Production verification     | 22/22 probe pass                                    |
| 11    | Cleanup/report              | Zero residue, final report                          |

**Cross-cutting NEVER-BREAK list (applies to every phase):**

- RaceResultGate flow and results integrity
- ProfileManager / SaveManager persistence + migration
- ReplayStore + deterministic replay + zero-progression
- NavigationSystem flow + authorities
- InputManager + MediaPipe hands + touch controls (GAS/AUTO)
- PeerJS/WebRTC matchmaking lifecycle
- Deterministic simulation + replay correctness
- Accessibility + reduced-motion guarantees
- FrameBudgetScaler / dynamic resolution / quality tiers / menu render gating
