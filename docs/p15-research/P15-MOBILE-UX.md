# P15 Mobile UX — Portrait Browser Racing Game

**Status:** IMPLEMENTATION READY  
**Target:** Pixel 5 (393×851), iPhone SE (375×667), Galaxy S23 (360×780)  
**Constraint:** Desktop and mobile are NOT the same UI — responsive behavior, not forced desktop layout

---

## 1. Touch Target Standards

| Platform        | Minimum      | Recommended  | Virtual Steering Target  |
| --------------- | ------------ | ------------ | ------------------------ |
| Apple HIG       | 44×44 pt     | 48×48 pt     | **48×48 px minimum**     |
| Material Design | 48×48 dp     | 56×56 dp     | **56×56 px for primary** |
| WCAG 2.2        | 24×24 css px | 44×44 css px | **48×48 css px**         |

**Implementation:**

```css
.btn {
  min-height: 48px;
  min-width: 48px;
}
.btn-primary {
  min-height: 56px;
} /* Primary CTA larger */
.tab {
  min-height: 44px;
}
.card-interactive {
  min-height: 56px;
} /* Track/mode cards */
```

---

## 2. Portrait vs Landscape Strategy

### 2.1 Menu Screens (Portrait-First)

```
┌─────────────────────────────────────┐  ← Safe area top
│  NAV BAR (logo + cam status)        │  44px
├─────────────────────────────────────┤
│                                     │
│  [HERO CAR — 40vh max]             │  Scales down on short viewports
│  Three.js canvas                    │
│                                     │
├─────────────────────────────────────┤
│  [DRIVER PROFILE STRIP]            │  Collapsible on < 600px height
│  Level • Title • XP Arc • Coins    │
├─────────────────────────────────────┤
│  [ACTION CARDS — Vertical Stack]   │  Full-width, scroll if needed
│  Race (primary, 56px)              │
│  Garage                            │
│  Profile                           │
│  Leaderboards                      │
│  Achievements                      │
│  Settings                          │
│  How to Play                       │
├─────────────────────────────────────┤
│  [FOOTER NOTE]                     │
└─────────────────────────────────────┘  ← Safe area bottom (home indicator)
```

### 2.2 Track Select (Portrait)

- **Horizontal rail** with `scroll-snap-type: x mandatory`
- Card width: 280px (leaves 113px peek for next card)
- `overscroll-behavior-x: contain`
- Touch drag + wheel + gamepad D-pad supported

### 2.3 Race HUD (Landscape-Only During Race)

- **Force landscape** during gameplay via Screen Orientation API
- Fallback: portrait HUD with repositioned clusters
- AI HUD rail (right) must not overlap touch steering (left/right) or accel (bottom-center)

---

## 3. Mobile HUD Layout (Race Active)

### 3.1 Cluster Positions (Portrait Fallback)

```
┌─────────────────────────────────────┐
│ [POS]          [TIME]        [SCORE]│  Top: 8px from safe area
│  1/12          1:23.456       1.2M  │
├─────────────────────────────────────┤
│                                     │
│        [THREE.JS RACE VIEW]         │
│                                     │
├─────────────────────────────────────┤
│ [GEAR]           [SPEED]            │  Bottom: 148px from safe area
│   3              247                │  (above touch controls)
├─────────────────────────────────────┤
│  ◄ STEER LEFT     [GAS]     AUTO ►  │  Touch controls layer
│                                     │
└─────────────────────────────────────┘
```

### 3.2 Touch Controls (Existing — Refine)

```css
.touch-controls {
  display: none;
}
@media (pointer: coarse), (max-width: 600px) {
  body.race-active .touch-controls {
    display: block;
  }
}

.touch-btn {
  width: 56px;
  height: 56px; /* ≥ 48px */
  border-radius: 50%;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
}
.touch-btn:active,
.touch-btn.pressed {
  transform: scale(0.9);
  background: var(--accent-primary-dim);
  border-color: var(--accent-primary);
  box-shadow: 0 0 20px rgba(0, 255, 102, 0.3);
}

.touch-left {
  left: 16px;
  bottom: 88px;
}
.touch-right {
  right: 16px;
  bottom: 88px;
}
.touch-accel {
  width: 64px;
  height: 64px;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
}
.touch-auto {
  width: 48px;
  height: 48px;
}
```

### 3.3 Safe Area Handling

```css
:root {
  --safe-top: env(safe-area-inset-top, 0);
  --safe-bottom: env(safe-area-inset-bottom, 0);
  --safe-left: env(safe-area-inset-left, 0);
  --safe-right: env(safe-area-inset-right, 0);
}

.hud-tl {
  top: calc(8px + var(--safe-top));
  left: calc(10px + var(--safe-left));
}
.hud-tr {
  top: calc(8px + var(--safe-top));
  right: calc(10px + var(--safe-right));
}
.touch-controls {
  padding-bottom: var(--safe-bottom);
}
```

---

## 4. Responsive Card/Grid Adaptation

| Component        | Desktop (≥1000px)             | Tablet (800–1000px)       | Mobile (≤600px)                     |
| ---------------- | ----------------------------- | ------------------------- | ----------------------------------- |
| **Track Cards**  | 3-col grid, 320px             | 2-col grid, 320px         | Horizontal rail, 280px cards        |
| **Mode Cards**   | 3-col grid                    | 2-col grid                | Vertical stack, full-width          |
| **Garage**       | 70/30 split (preview/sidebar) | 60/40 split               | Tabs: Preview / Cosmetics / Specs   |
| **Profile**      | 2-col (hero + stats)          | 2-col                     | Single column, collapsible sections |
| **Leaderboard**  | Table + sidebar               | Table (horizontal scroll) | Horizontal scroll, sticky # column  |
| **Achievements** | 3-col grid                    | 2-col grid                | 1-col stack, larger cards           |
| **Settings**     | 2-col (tabs + panel)          | 2-col                     | Stacked, accordion tabs             |

### 4.1 CSS Pattern

```css
/* Track Select Rail */
.track-rail {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}
.track-card {
  flex: 0 0 280px;
  scroll-snap-align: center;
}

/* Garage Tabs (Mobile) */
@media (max-width: 800px) {
  .garage-layout {
    flex-direction: column;
  }
  .garage-preview {
    height: 40vh;
  }
  .garage-sidebar {
    width: 100%;
  }
}
```

---

## 5. Gesture Discoverability

| Gesture            | Action                          | Visual Hint               |
| ------------------ | ------------------------------- | ------------------------- |
| Horizontal drag    | Track/mode rail scroll          | Peek of next card (113px) |
| Vertical drag      | Garage specs / Profile sections | Scroll indicator          |
| Tap                | Button press, card select       | Ripple + scale            |
| Long press (500ms) | Context menu / preview          | Haptic (if supported)     |
| Swipe up (menu)    | Expand profile strip            | Handle indicator          |

**No hidden gestures** — all actions have visible UI affordance.

---

## 6. Performance on Mobile

| Metric            | Target                                              |
| ----------------- | --------------------------------------------------- |
| Hero car Three.js | < 200ms init, < 2ms/frame                           |
| Glass blur        | ≤ 8px on mobile (vs 12px desktop)                   |
| Particles         | ≤ 20 (vs 60 desktop)                                |
| Scanlines/CRT     | Disabled on mobile                                  |
| Three.js render   | Only hero car on menus; race uses existing pipeline |
| Texture size      | ≤ 512px for UI textures                             |
| Font subset       | Latin-only WOFF2 subsets                            |

---

## 7. Testing Checklist (Pixel 5)

- [ ] No horizontal overflow on any screen
- [ ] All touch targets ≥ 48×48px
- [ ] Text ≥ 14px (body), ≥ 11px (labels)
- [ ] Safe area respected (notch, home indicator)
- [ ] Touch controls don't overlap HUD
- [ ] Scroll smooth (60fps) on all rails
- [ ] No accidental zoom on input focus (viewport meta)
- [ ] Landscape race forced, portrait fallback works
- [ ] Reduced motion disables particles/parallax
- [ ] High contrast mode readable
- [ ] Colorblind presets functional

---

## File: docs/p15-research/P15-MOBILE-UX.md
