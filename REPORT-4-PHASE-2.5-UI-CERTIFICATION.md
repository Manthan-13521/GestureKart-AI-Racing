# REPORT-4 — PHASE 2.5: UI POLISH & UX CERTIFICATION

Phase 2 certified at `v0.3.0-phase2-ui-foundation`. This phase delivered the
premium-feel polish layer: a defined motion language, cinematic visuals,
microinteractions, sound sync, responsiveness, accessibility, and robustness
QA. Gameplay logic (`src/game/Game.ts`, `src/input/*`) is untouched — no new
gameplay was added by directive.

## 1. UX Audit

| Finding (from Phase 2)                      | Resolution                                                     |
| ------------------------------------------- | -------------------------------------------------------------- |
| `#btn-settings` nav gear was inert          | Wired in `main.ts` — opens Settings screen via `nav.go()`      |
| No selection-persist on cards               | `GlassCard.setSelected()`; grids clear + mark on click         |
| Settings save gave no feedback              | Back from Settings fires `notify.success('Settings', 'Saved')` |
| `hero-grid` repainted (background-position) | Rewritten as transform-only translation (GPU-composited)       |
| `ui-pulse` used default `ease-in-out`       | Eased with the motion-token cubic-bezier                       |
| Unselected cards after pick stayed lit      | Sibling dimming via `:has(.is-selected)` + hover re-brighten   |

Selection persists visually until the screen is disposed (navigating away).

## 2. Animation Report — the motion language

`AnimationSystem.EASE_BY_KIND` now maps every animation kind to an intentional
easing; `opts.easing` overrides remain supported:

| Kind group            | Easing     | Rationale                          |
| --------------------- | ---------- | ---------------------------------- |
| `fade-in/out`, slides | `ease-out` | Enter fast, settle soft            |
| `slide-out-*`         | `snap`     | Exit snappy — feels immediate      |
| `scale-in`            | `spring`   | Buttons/modals bounce 6% then lock |
| `scale-out`           | `snap`     | Confirmable dismissal              |
| `blur-in/out`         | `inOut`    | Cinematic title reveal             |

New ambient motion: aurora light blobs (22s/28s drift, `blur(70px)`, transform
only), glass sheen sweep (700ms on hover, 120% travel), vignette + film grain
(static SVG noise, `pointer-events: none`). All ambient animation disabled
under reduced motion.

## 3. Accessibility Report

- **Screen focus management**: `Screen.mount()` / `screenWake()` move focus to
  the first focusable (fallback: the section with `tabIndex=-1`), so keyboard
  users land on usable content on every navigation (WCAG 2.4.3).
- **High-contrast mode**: `.screen-title` / `.menu-title` gradient text
  collapses to solid white; all tokens brighten (text/border/accent).
- **Reduced motion**: aurora added to the kill-list; JS durations already zeroed.
- **ARIA**: toasts `aria-live`, modals `role="dialog" aria-modal` + focus trap,
  screens toggle `aria-hidden`, focus rings on `:focus-visible`.
- **Responsiveness**: `card-grid` scrolls (max-height 52vh) on ≤640px, slider
  keeps a usable 140px min width, screens scroll with padded safe zone,
  large-HUD mode scales titles/settings text.

## 4. Performance Report

- `hero-grid` animation now animates `transform` only — zero paint/repaint per
  frame vs. the old `background-position` animation.
- Aurora and grid are CSS-composited layers (`blur(70px)` cost amortized over
  22s; 2 elements total); noise is a single inline-SVG tile at 4.5% opacity.
- No new per-frame work in the UI layer; screens still build once + dispose.
- `:has()` sibling dimming runs on 3–4 nodes — negligible.
- Bundle unchanged by design (509 kB JS, three.js dominant; chunking deferred).

## 5. Regression Report

- `src/game/Game.ts` — **byte-identical** (zero changes).
- `src/input/*` — zero changes.
- Behavior changes (intentional, UI-layer only):
  - `#btn-settings` now opens Settings (was inert in Phase 2).
  - Selection state persists on track/mode cards; unselected siblings dim.
  - Settings Back shows the "Saved" toast (replaces silent return).
  - Countdown ticks on 3/2/1, GO chime, and finish fanfare via SoundHooks.
  - Screen navigation now repositions focus (keyboard-first).
- QA suite added (`src/ui/qa.test.ts`, 11 tests):
  - Nav spam: drops mid-transition safely, no double mount, recovers.
  - Modal stacking: panels/backdrops never orphan, close/closeAll idempotent.
  - Theme spam: rapid `set()` converges, idempotent, partial patches never
    drop earlier prefs.
- Gates: `tsc --noEmit` ✓ · `eslint` ✓ · `vitest` 29/29 ✓ · `vite build` ✓.

## 6. Known Debt / Next

- Real track previews are still CSS gradients (art pass deferred).
- Gesture calibration remains a UI stub (real center capture deferred).
- No `paused` state; chunk-splitting deferred to Phase 3.
- **Next phase: Phase 3 — Ghost Mode (You vs You)**, then AI Race (4),
  Multiplayer (5), Graphics/Weather/VFX (6), Audio/Replay/Photo (7),
  Optimization/Final QA (8).
