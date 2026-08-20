# P15 Implementation Plan — Phase-by-Phase Execution

**Status:** READY TO EXECUTE  
**Baseline:** P14 COMPLETE — 653 tests, 27/13/0 E2E, all gates green

---

## Phase Overview

| Phase   | Focus                                  | Duration | Deliverable                       |
| ------- | -------------------------------------- | -------- | --------------------------------- |
| **F**   | Design System Foundation               | 1        | Tokens, components, motion system |
| **G1**  | Main Menu + Track Select + Mode Select | 2        | Hero screens redesigned           |
| **G2**  | Garage + Profile + Leaderboard         | 2        | Progression/competition screens   |
| **G3**  | Achievements + HowToPlay + Settings    | 1.5      | Collection/help/config screens    |
| **G4**  | HUD + Victory + Transitions            | 1.5      | Race experience + flow            |
| **H**   | Micro-interactions Polish              | 1        | Ripple, magnetic, shimmer         |
| **I**   | Mobile Responsive Pass                 | 1        | Pixel 5 perfect                   |
| **J**   | Accessibility Pass                     | 1        | WCAG AA + reduced motion          |
| **K**   | Performance Pass                       | 0.5      | Budget compliance                 |
| **L**   | Regression Gates                       | 0.5      | All green                         |
| **M**   | Visual QA + Probe                      | 0.5      | 22/22 probe pass                  |
| **N/O** | Fix + Clean + Report                   | 0.5      | Zero residue                      |

---

## Phase F: Design System Foundation (Files to Create/Modify)

### F.1 `src/style.css` — **MAJOR OVERWRITE**

- Replace entire token section with consolidated semantic system
- Add component base classes (`.card`, `.btn`, `.tab`, `.badge`, `.progress-*`)
- Add motion keyframes and stagger helpers
- Add screen transition keyframes
- Add reduced motion media query
- Add mobile responsive adjustments
- Add high contrast mode overrides
- **Preserve:** Existing HUD, ambient, touch controls, game overlays (enhance only)

### F.2 `src/ui/tokens.ts` — **EXTEND**

- Export all MotionTokens, ColorTokens, ZTokens, RadiusTokens, FontTokens
- Add TabularNums constant

### F.3 `src/ui/components/` — **NEW/REWRITE**

| File             | Action  | Key Changes                                                     |
| ---------------- | ------- | --------------------------------------------------------------- |
| `Button.ts`      | Rewrite | Ripple, variants (primary/ghost/danger), sizes, magnetic hover  |
| `GlassCard.ts`   | Rewrite | Premium glass, sheen, selected/disabled states, stagger support |
| `Screen.ts`      | Extend  | `playEntrance()`, `playExit()`, stagger children helper         |
| `TabBar.ts`      | New     | Animated indicator, keyboard nav, focus visible                 |
| `ProgressArc.ts` | New     | Circular XP arc with draw animation                             |
| `ProgressBar.ts` | New     | Linear + shimmer                                                |
| `Badge.ts`       | New     | Semantic variants (primary/gold/cyan/red/magenta)               |
| `RacingLine.ts`  | New     | Shared-element SVG transition component                         |

### F.4 `src/ui/core/`

| File                  | Action                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| `AnimationSystem.ts`  | Add `stagger()`, `play()` with reduced-motion gate, `isMotionReduced()` |
| `TransitionSystem.ts` | Add `shared-element` transition kind, racing line support               |
| `ThemeManager.ts`     | Add high-contrast mode, large-hud scale, colorblind filter application  |

### F.5 `src/screens/ambient.ts` — **ENHANCE**

- Add `spawnScanlines()`, `spawnVignette()`, `spawnNoiseOverlay()` (mounted once on app root)
- Upgrade `spawnGrid()` → perspective grid with configurable angle
- Upgrade `spawnAurora()` → CSS-based animated gradients (cheaper than DOM)
- Add `spawnHeroBackground()` for main menu (gradient sky + scanlines)

---

## Phase G1: Main Menu + Track Select + Mode Select

### G1.1 `src/screens/MainMenuScreen.ts`

**New Structure:**

```typescript
protected build(): void {
  // 1. Three.js hero car (lazy-loaded, low-poly Kenney CC0)
  // 2. Animated gradient sky + scanlines (ambient.ts)
  // 3. Racing line SVG (draws on entrance)
  // 4. Title: Orbitron, gradient text, blur-in entrance
  // 5. Profile strip: XP arc (ProgressArc), animated stat counters
  // 6. Action cards: GlassCard premium, staggered slide-up
  // 7. Footer note: fade-in
}
```

**Three.js Hero Car:**

- Load `car-sports.glb` (Kenney CC0, ~50 KB)
- Showroom HDRI (Poly Haven CC0)
- Slow Y-rotation (20s loop), pauses on hover → camera stage dolly
- Emissive materials for neon accents
- No shadows, no post-process on mobile
- `prefers-reduced-motion` → pause rotation

### G1.2 `src/screens/TrackSelectScreen.ts`

**New Structure:**

```typescript
protected build(): void {
  // 1. Horizontal rail (flex + scroll-snap)
  // 2. TrackCard component per track:
  //    - SVG track map (layered strokes: glow→core→highlight)
  //    - Draw-on animation on entrance
  //    - Weather/time chips (badge-cyan/badge-gold)
  //    - Best time + difficulty stars
  //    - Medal overlays (🥇🥈🥉) if raced
  // 3. Selected card: scale 1.05, border-primary, racing line connects to mode select
}
```

**Track Map SVGs:** Create 3 SVGs (Cyber City, Mountain Highway, Space Highway) — layered strokes with `stroke-dasharray` draw-on.

### G1.3 `src/screens/ModeSelectScreen.ts`

**New Structure:**

```typescript
protected build(): void {
  // 1. Group headers: Solo / Multiplayer / Training (slide-down stagger)
  // 2. ModeCard per mode:
  //    - Large icon (Phosphor SVG)
  //    - Name + 1-line description
  //    - Badges: Player count, Difficulty (●●○○○), Control methods (✋⌨️📱🎮)
  //    - Selected: border-primary, scale 1.02
}
```

---

## Phase G2: Garage + Profile + Leaderboard

### G2.1 `src/screens/GarageScreen.ts`

**Layout:** 70/30 split (desktop) → Tabs (mobile)

```typescript
// Three.js car preview (same model as main menu, different camera stages)
// Camera stages: Exterior (0s) → Rear (3s) → Interior (6s) → Detail (9s) → loop
// Smooth dolly between stages (600ms ease-out)
// Sidebar tabs: Skins / Neons / Wheels (TabBar component)
// Cosmetic grid: GlassCard premium, hover sheen, selected border-primary
// Spec bars: ProgressBar with animated fill
```

### G2.2 `src/screens/ProfileScreen.ts`

```typescript
// Hero: Level + Title + XP Arc (ProgressArc) + animated stat counters (count-up)
// Title Progression: Vertical timeline, current tier glows, locked dimmed
// Best Records: Timing-tower mini table (top 5)
// Recent Races: Collapsible list
// Achievement Summary: 3 most recent unlocks with shimmer
```

### G2.3 `src/screens/LeaderboardScreen.ts`

```typescript
// Timing tower layout:
// - Tabs: Global / By Track / By Mode (TabBar)
// - Filter pills: Track dropdown, Mode dropdown
// - Table: # | PLAYER | SCORE | DATE | GAP
// - Current player row: highlight background, pulse animation
// - Rank changes: slide + color flash (green gain / red loss)
// - Empty state: "No times set" + ghost car illustration
```

---

## Phase G3: Achievements + HowToPlay + Settings

### G3.1 `src/screens/AchievementsScreen.ts`

```typescript
// Category tabs: Progression / Collection / Mastery (TabBar)
// Cards:
//   LOCKED: dimmed, 🔒, progress bar
//   UNLOCKED: accent-primary border, shimmer sweep on hover
//   MASTERY (data-driven: category===mastery && target≥50): gold glow + ⭐⭐⭐
// Unlock animation: scale pop (spring) + shimmer + XP arc increment
// Completion ring: circular progress (total/total)
```

### G3.2 `src/screens/HowToPlayScreen.ts`

```typescript
// 7 tabs (Hand/Keyboard/Touch/Gyro/Phone/Gamepad/Accessibility)
// Each tab: Interactive demo area (canvas placeholder for future)
// Search/filter input
// Video/GIF placeholder frames with play button
```

### G3.3 `src/screens/SettingsScreen.ts`

```typescript
// Glass panels per tab (Graphics/Audio/Controls/Accessibility/Gameplay)
// Live preview: Graphics changes apply immediately to Three.js quality
// Reset confirmation modal
// Colorblind/High-contrast/Large-HUD/Reduced-Motion toggles (instant apply)
```

---

## Phase G4: HUD + Victory + Transitions

### G4.1 `src/screens/GameplayScreen.ts` — **HUD POLISH ONLY**

- **Do not change layout** — only visual upgrades:
  - Speed cluster: speed-num glow intensity based on speed tier
  - Position chip: lead glow pulse (existing, enhance)
  - Boost bar: shimmer fill, pulse on ready
  - Combo ring: gold stroke at max, pulse
  - AI HUD: draft pulse (existing), overtake flash (existing)
  - All numbers: ensure tabular-nums, consistent font weights

### G4.2 `src/ui/VictoryCeremony.ts`

- Crown drop (existing) + rank pop (spring)
- Level-up pulse border (existing, enhance glow)
- XP arc draw completion sync
- Stat grid: staggered scale-in
- Total row: count-up animation

### G4.3 Screen Transitions (NavigationSystem + TransitionSystem)

```typescript
// Shared-element: Racing line SVG
// Menu → Track: Line draws from car → becomes track rail
// Track → Mode: Selected track card becomes mode header
// Mode → Race: Car dolly into cockpit
// Race → Victory: Fade to black (500ms) → ceremony
// Victory → Results: Slide-up + crown drop
// Results → Menu: Slide-right + line retraces
```

---

## Phase H: Micro-interactions Polish

| Interaction        | Implementation                                                                       |
| ------------------ | ------------------------------------------------------------------------------------ |
| Button ripple      | `AnimationSystem.ripple(event, element)` — prefers-reduced-motion respected          |
| Magnetic hover     | `mousemove` on `.btn-primary` → `transform: translate(...)` proportional to distance |
| Card magnetic      | Subtle translate toward cursor (max 4px)                                             |
| Tab indicator      | Animated width + position (already in CSS)                                           |
| Progress shimmer   | CSS `::after` with `mix-blend-mode: screen` (disabled in reduced-motion)             |
| Toast choreography | Stack with 80ms stagger, slide-in-right                                              |
| Achievement unlock | Scale pop (spring) + shimmer sweep + XP arc increment                                |
| Rank change        | Slide + color flash + announce via live region                                       |

---

## Phase I: Mobile Responsive Pass

### I.1 Breakpoint Testing

```bash
# Test viewports
npx playwright test --project=mobile-chromium
# Manual: Chrome DevTools device toolbar → Pixel 5, iPhone SE, Galaxy S23
```

### I.2 Mobile-Specific Fixes

- [ ] Main Menu: Hero car 40vh max, action cards vertical stack
- [ ] Track Select: Horizontal rail with peek, touch drag
- [ ] Mode Select: Vertical stack, grouped headers
- [ ] Garage: Tabs (Preview/Cosmetics/Specs), car preview 40vh
- [ ] Profile: Single column, collapsible sections
- [ ] Leaderboard: Horizontal scroll table, sticky # column
- [ ] Achievements: 1-col stack, larger cards
- [ ] Settings: Accordion tabs
- [ ] HUD: Touch controls don't overlap, safe areas respected
- [ ] All text ≥ 14px, touch targets ≥ 48px

---

## Phase J: Accessibility Pass

### J.1 Automated (axe-core)

```bash
npx playwright test --project=chromium --grep "a11y"
# Or: npx axe-cli http://localhost:5173
```

### J.2 Manual Checklist

- [ ] Keyboard nav all screens (Tab/Shift+Tab/Enter/Escape/Arrows)
- [ ] Focus visible on all interactive
- [ ] Screen reader (NVDA/VoiceOver) announces correctly
- [ ] Reduced motion: decorative disabled, state preserved
- [ ] High contrast: all text readable, borders visible
- [ ] Colorblind presets (deuteranopia/protanopia/tritanopia): no info loss
- [ ] Large HUD (1.5×): no overflow, touch targets scale
- [ ] Zoom 200%: no horizontal overflow
- [ ] Live regions: rank changes, lap complete, boost ready announced

---

## Phase K: Performance Pass

### K.1 Budgets

| Metric               | Target                       | Current      |
| -------------------- | ---------------------------- | ------------ |
| CSS gzipped          | < 25 KB                      | ~18 KB       |
| Three.js hero car    | < 100 KB glTF                | ~50 KB       |
| Fonts (preloaded)    | < 150 KB total               | ~150 KB      |
| Background GPU/frame | ≤ 2 ms mobile                | —            |
| Glass blur           | ≤ 8px mobile                 | 12px desktop |
| Particles            | ≤ 20 mobile / ≤ 60 desktop   | 26           |
| Frame budget         | Dynamic resolution preserved | ✅           |

### K.2 Optimizations

- Subset fonts (Latin only, WOFF2)
- Preload display fonts in `index.html`
- Lazy-load Three.js hero car (`import()` on menu enter)
- `will-change: transform, opacity` on animating elements (remove after)
- Shared `requestAnimationFrame` for shimmer/progress
- `prefers-reduced-motion` disables particles/parallax

---

## Phase L: Regression Gates

```bash
# Run in order
npx vitest run                    # 653+ tests
npm run typecheck                 # PASS
npm run lint                      # PASS
npx prettier --check .            # PASS
npm run build                     # PASS
npx playwright test               # 27/13/0
npx playwright test --project=mobile-chromium  # 13/7/0
```

---

## Phase M: Visual QA + Production Probe

### M.1 Production Build Probe

```bash
npm run build
npx vite preview --port 4173 &
npx playwright test -c playwright.prod.config.ts --reporter=line
# 22 tests (11 desktop + 11 mobile) — all must pass
```

### M.2 Visual Inspection Checklist

| Screen       | Desktop                                | Mobile               |
| ------------ | -------------------------------------- | -------------------- |
| Splash       | Brand animation, progress ring         | Scaled, centered     |
| Main Menu    | Hero car, racing line, staggered cards | Stacked, car 40vh    |
| Track Select | Horizontal rail, SVG maps, medals      | Rail with peek       |
| Mode Select  | Grouped cards, badges                  | Vertical stack       |
| Garage       | 3D preview, camera stages, spec bars   | Tabs                 |
| Profile      | XP arc, stat counters, title timeline  | Collapsible          |
| Leaderboard  | Timing tower, current player highlight | Horizontal scroll    |
| Achievements | Category tabs, rarity glow, shimmer    | Stack                |
| How-To-Play  | 7 tabs, interactive demos              | Stack                |
| Settings     | Glass panels, live preview             | Accordion            |
| Race         | HUD readable, no occlusion             | Touch controls clear |
| Victory      | Crown drop, level-up pulse             | Scaled               |
| Results      | Score animation, ghost line            | Scaled               |

---

## Phase N/O: Fix Issues + Clean + Report

### N.1 Fix All Discovered Issues

- Visual regressions
- Mobile overflow
- Accessibility gaps
- Performance overages

### N.2 Zero Residue Cleanup

```bash
rm -rf test-results playwright-report
rm -f playwright.prod.config.ts
lsof -ti :4173 :5173 | xargs kill
```

### O.1 Reports

- `REPORT-36-P15-UIUX-VISUAL-TRANSFORMATION.md` (main report)
- `docs/p15-research/P15-DESIGN-DECISIONS.md` (why each decision)

---

## File: docs/p15-research/P15-IMPLEMENTATION-PLAN.md
