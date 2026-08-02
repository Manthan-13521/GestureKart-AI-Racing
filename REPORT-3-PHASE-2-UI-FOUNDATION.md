# REPORT-3 — PHASE 2: AAA UI FOUNDATION

Phase 1 certified at `v0.2.0-phase1-certified`. This phase delivered the reusable
UI framework, the canonical flow, all navigation screens, and dev tooling.
Gameplay logic (`src/game/Game.ts`, `src/input/*`) is untouched.

## 1. UI Component Tree

```
ui-root (#ui-root, NavigationSystem host)
├─ Screen (base — every screen extends it)
│  ├─ SplashScreen        — brand reveal, ambient grid + particles, tap/key continue
│  ├─ LoadingScreen       — spinner + progress bar, rAF-driven, onDone hook
│  ├─ MainMenuScreen      — cinematic title glow, staggered CTA buttons, best score
│  ├─ TrackSelectScreen   — 3 GlassCards (Cyber City / Mountain Highway / Space Highway)
│  ├─ ModeSelectScreen    — 4 GlassCards (You vs You / Multiplayer / AI Race / Endless Survival)
│  ├─ SettingsScreen      — 5 animated tabs (Graphics / Audio / Controls / Accessibility / Gameplay)
│  └─ GameplayScreen      — pre-race staging → startRace hand-off
├─ Components (reusable, navigation-agnostic)
│  ├─ Button              — primary/ghost/outline/danger × sm/md/lg, icons, press scale
│  ├─ GlassCard           — preview, badge, meta rows, description, focusable, is-selected
│  ├─ Panel               — eyebrow + title + content + footer
│  ├─ Loading             — spinner sizes + progress bar + label
│  ├─ Dialog              — promise-based confirm (ModalSystem-backed)
│  └─ Toast               — rendered by NotificationSystem (info/success/error)
├─ Core systems
│  ├─ Component           — base element + delegated events + dispose
│  ├─ AnimationSystem     — WAAPI presets (fade/slide/scale/blur) + stagger + wait
│  ├─ TransitionSystem    — enter/exit/swap orchestration (direction-aware)
│  ├─ NavigationSystem    — screen registry, stack, go/back/reset, transitions
│  ├─ ModalSystem         — stacked modals, focus trap, ESC/backdrop close
│  ├─ NotificationSystem  — toast stack, aria-live, auto-dismiss
│  ├─ FocusRing           — keyboard/gamepad arrow-nav over [data-focus-group] grids
│  ├─ SoundHooks          — hover/press/confirm/back/error synthesized UI audio
│  └─ ResponsiveEngine    — breakpoints, watchViewport, clampSize()
└─ ThemeManager + tokens — modes applied via <html data-*> attributes
```

## 2. Navigation Graph

```
Splash ──continue──▶ Loading ──done──▶ Main Menu
                                          │  Race
Main Menu ──Play──▶ Track Select ──select──▶ Mode Select
Main Menu ──Settings──▶ Settings (5 tabs) ──Done──▶ Main Menu
Mode Select ──select──▶ Loading (next=gameplay) ──done──▶ Gameplay (Start Race)
Gameplay ──Start Race──▶ [UI hidden] → countdown → RACE (existing game)
RACE ──game over──▶ Results ──Main Menu──▶ [UI shown] nav.reset('menu')
Any time ──nav title──▶ Main Menu (quits current race)
```

Back edges use `slide-right` (direction-aware exit). Unknown screens throw at
registration lookup (fail fast, tested).

## 3. Animation Graph

| Animation               | Kind(s)                                                     | Where                       |
| ----------------------- | ----------------------------------------------------------- | --------------------------- |
| Title reveal            | blur-in 700ms                                               | Splash, Main Menu, Gameplay |
| Staggered card entrance | slide-in-up 460ms, 80ms step                                | Track/Mode select grids     |
| Staggered CTA entrance  | slide-in-up 90ms step                                       | Main Menu actions           |
| Screen swap             | fade / slide-left / slide-right / blur (per screen)         | NavigationSystem            |
| Modal                   | fade-in backdrop + scale-in panel                           | ModalSystem                 |
| Toast                   | slide-in-up, fade-out dismiss                               | NotificationSystem          |
| Tab content swap        | fade-in + slide-in-up 220ms                                 | Settings                    |
| Ambient                 | hero-grid drift, ui-float particles, ui-title-glow, spinner | Screens                     |
| Press feedback          | scale 1.04 hover / 0.96 active                              | Buttons, cards              |
| Reduced motion          | all animation durations → 0, ambient CSS disabled           | Global                      |

All JS animations go through `AnimationSystem`, which is the single motion
vocabulary (tokens `MotionTokens.duration/easing`).

## 4. Theme Tokens

Design tokens live in `src/ui/ui.css` `:root` + `src/ui/tokens.ts` (JS side).

- **Color**: bg `#06080c`, surface `rgba(255,255,255,0.025)`, text `#eef1f7` /
  `#9aa3b5` / `#5b6478`, gold `#ffd700`, accent `#2dff9a`, blue `#38bdf8`, red `#ff4d5e`
- **Mode overrides**: high-contrast (brighter text/borders/accents), colorblind
  (accent→blue, gold→orange, green→blue)
- **Radius**: 18px cards, 10px buttons; **Shadow**: 20px/60px drop
- **Type**: display = Orbitron (letter-spaced, uppercase), body = Segoe UI
- **Motion**: fast 160 / base 260 / slow 420 / cinematic 700 / ambient 1800; easings
  out/spring/snap (cubic-bezier presets)
- **Z**: screen 10, modal 100, toast 200
- **Layout**: breakpoints 640 / 1024 / 1280; fluid via `clamp()`; large-HUD scale 1.22

## 5. Performance Report

- **Zero framework deps** — vanilla TS + Web Animations API + CSS. No React/DOM libs.
- All ambient effects are CSS-only (GPU-composited) except JS particle spawn (26 nodes, one-time).
- Screens build DOM once on mount; disposed on navigation (`dispose()` removes listeners + nodes).
- `EventBus` emit copies the listener set (no mutation during dispatch).
- Bundle: 509 kB JS (three.js dominant) — unchanged; chunk-split deferred to Phase 3
  (only the Dialog is lazy-loaded today via dynamic import).
- **No per-frame allocations** in the UI layer; game loop untouched.
- Dev-server transform check: all 24 UI/screen modules serve 200.

## 6. Regression Report

- `src/game/Game.ts` — **byte-identical** (zero changes; all gameplay physics/scoring/collision/camera intact).
- `src/input/*` — only HandTracker typing changed (`any` → typed MediaPipe declarations), zero behavior delta.
- Behavior changes (intentional, UI-layer only):
  - Landing/menu/howtoplay/settings overlays replaced by framework screens.
  - `UIManager` now manages only in-game overlays (ready/game-over/countdown).
  - Sensitivity settings-Back divergence bug (`0.85` vs `0.6`) fixed in Phase 1 gate review (committed).
  - During a race the nav settings button is inert; nav title quits to Main Menu.
- Gates: `tsc --noEmit` ✓ · `eslint` ✓ · `vitest` 18/18 ✓ · `vite build` ✓ · dev server HTTP 200 ✓.
- Manual browser playtest still recommended (camera + gyro need real hardware).

## 7. Dev Tooling (added this phase)

- ESLint 10 flat config (typescript-eslint recommended + prettier), legacy `public/` demo excluded.
- Prettier 3 (+ lint-staged pre-commit formatting).
- Vitest 4 + happy-dom (18 tests across SaveManager, ThemeManager, NavigationSystem, flow wiring).
- Husky pre-commit → lint-staged (eslint --fix + prettier).
- GitHub Actions CI: typecheck → lint → test → build on push/PR.
- `npm run typecheck|lint|format|test|test:coverage` scripts.

## 8. Known Debt / Next

- `InputManager` still not the GDD §6.2 unified `InputFrame` producer (Phase 3).
- Track/mode selections are stored but don't yet affect gameplay (Phase 3+).
- Gesture calibration is a UI stub (saves + toasts; real center capture deferred).
- No `paused` state; howtoplay content lives in a Dialog (content parity with old overlay).
