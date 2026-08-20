# P15 Design Decisions — Rationale & Trade-offs

**Generated:** 2026-08-20  
**Purpose:** Document WHY each major design decision was made for future reference and team alignment.

---

## 1. Brand Identity: "Neon Velocity" + "Garage Prestige"

**Decision:** Dual-theme identity — primary "Neon Velocity" (dark cyber-track, razor-thin light trails, precision telemetry) with secondary "Garage Prestige" (showroom lighting, carbon-fiber textures, gold accents).

**Why:**

- **Neon Velocity** differentiates from Forza (realism), NFS (gritty urban), GT (museum). It's a _browser-native_ aesthetic: CSS glow, scanlines, animated gradients — things only web can do efficiently.
- **Garage Prestige** elevates the cosmetic/collection layer without inventing fake gameplay stats. Cosmetic progression is the only progression authority (ProfileManager) — lean into it.
- Research showed NFS Heat/Unbound uses "visual signature" (flare/graffiti) and F1 25 uses "engine-spark palette + three-state type". Our signature = **the racing line** — a glowing curve connecting all screens.

**Rejected:** Pure realism (GT), pure arcade (Asphalt), pure minimalism (Horizon Chase). We're a _simcade_ — accessible depth, telemetry-grade clarity.

---

## 2. Color System: 4 Semantic Accents, 1 Role Each

**Decision:** 4 accent colors, each with exactly ONE functional role. No decorative use.

| Token              | Hex       | Role                                           |
| ------------------ | --------- | ---------------------------------------------- |
| `--accent-primary` | `#00ff66` | GO, speed, primary CTA, success, boost ready   |
| `--accent-gold`    | `#ffd700` | 1st place, premium, best, mastery achievements |
| `--accent-cyan`    | `#00e5ff` | INFO, draft/slipstream, combo counter, tech    |
| `--accent-red`     | `#e10600` | DANGER, loss, collision, error, shift warning  |
| `--accent-magenta` | `#ff2d95` | WARNING, dirty air, near-miss, validation      |

**Why:**

- Cyberpunk 2077 was criticized for using red for _everything_ (ornament + warning + feedback) with no functional color coding.
- F1 broadcast uses green gained / red lost positions — color = meaning, not decoration.
- Colorblind safety: red/green never sole encoding; always icon + text + shape.
- High contrast mode forces all accents to pure primaries (`#00ff00`, `#ffff00`, etc.)

**Rejected:** More than 4 accents (cognitive load), accent reuse across roles (confusion).

---

## 3. Typography: Orbitron + Rajdhani + Inter + Share Tech Mono

**Decision:** 4-font stack, all Google Fonts OFL.

| Role                | Font            | Why                                                                   |
| ------------------- | --------------- | --------------------------------------------------------------------- |
| Display/Logo        | Orbitron        | Geometric sci-fi, 4 weights + VF, league of movable type              |
| Headings/HUD        | Rajdhani        | Squared/condensed, "technical/futuristic" per designers, tabular nums |
| Body                | Inter           | Workhorse, high x-height, tabular nums, excellent screen legibility   |
| Timers/Leaderboards | Share Tech Mono | Monospace, tabular figures, technical readouts                        |

**Why:**

- NFS Unbound: DIN Pro Condensed (UI) + Eurostile (brand) — we use free equivalents.
- Cyberpunk 2077: Rajdhani primary + Orbitron decorative — validated for techno UI.
- GT: Custom wide wordmark + neutral data sans with tabular figures.
- Tabular figures MANDATORY for speed, position, lap, time, score — prevents jitter.

**Rejected:** Eurostile/Audiowide/Michroma (single weight, poor readability), custom fonts (licensing, perf).

---

## 4. Glassmorphism Recipe (The "Liquid Glass" Card)

**Decision:** Standardized premium card recipe used everywhere.

```css
.card {
  background: var(--surface-elevated); /* #13171e */
  border: 1px solid var(--glass-border); /* rgba(255,255,255,0.08) */
  border-radius: 16px; /* --radius-lg */
  backdrop-filter: blur(12px) saturate(160%); /* cap blur ≤12px for perf */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.card::before {
  /* inset highlight */
}
.card::after {
  /* diagonal sheen, mix-blend-mode: screen */
}
```

**Why:**

- superdesign.dev / pixcode.io / webtricks.dev all converge on this recipe.
- Blur ≤12px cap prevents mobile GPU thrash; never animate blur radius.
- `mix-blend-mode: screen` sheen = "liquid glass" feel without expensive shaders.
- Reduced motion: sheen disabled globally via media query.

**Rejected:** CSS `backdrop-filter: blur()` animation (layout thrash), multiple blur layers, `filter: blur()` on containers (repaint storm).

---

## 5. Motion System: 7 Durations, 5 Easings, Asymmetric Timing

**Decision:** Tokenized motion vocabulary with strict rules.

| Token                | Duration | Use                                 |
| -------------------- | -------- | ----------------------------------- |
| `--motion-instant`   | 50ms     | Color/opacity hover, tooltip        |
| `--motion-fast`      | 120ms    | Button press, ripple, focus ring    |
| `--motion-base`      | 200ms    | Dropdown, tab switch, card entrance |
| `--motion-medium`    | 280ms    | Modal, drawer, screen transition    |
| `--motion-slow`      | 400ms    | Page transition, full sheet         |
| `--motion-cinematic` | 700ms    | Hero entrance, first-run only       |
| `--motion-ambient`   | 1800ms   | Background loops                    |

**Easing Rules:**

- **Default: ease-out** (`cubic-bezier(0.22, 1, 0.36, 1)`) — feels responsive.
- **Asymmetric timing:** User-triggered = fast intro/slow outro; code-triggered = slow intro/fast outro.
- **Exit = 75% of entrance duration.**
- **Stagger:** 60ms interval, max 8 items, `animation-fill-mode: both`.

**Why:**

- NN/g research: 200–300ms for modal/UI, 500ms+ feels "draggy".
- Emil Kowalski: "Never ease-in on UI. It starts slow, delaying the exact moment the user is watching."
- Forza/GT menus criticized for >150ms animations feeling sluggish by 10th visit.
- Reduced motion: global gate disables all non-essential animation, keeps state communication (progress, rank pop).

**Rejected:** Spring/bounce on everything (childish), ease-in (feels slow), stagger >80ms (list feels slow).

---

## 6. Main Menu: Hero Car + Racing Line + Premium Actions

**Decision:** Three.js hero car (Kenney CC0 sports car) + animated racing line SVG + premium glass action cards.

**Why:**

- NFS Heat/Unbound: "Large tiles with clear descriptions displayed in foreground, in front of 3D object and illuminated backgrounds... camera perspectives create excitement."
- Forza Horizon 5's 30+ first-level options = anti-pattern. We have **ONE primary CTA (Race)** + flat secondary nav.
- Garage as hub (NFS Unbound): Hero car visible from menu → player's car is the anchor.
- Racing line = visual signature connecting Menu → Track → Mode → Race → Victory → Menu.
- Kenney CC0 car kit: 45+ low-poly vehicles, glTF ready, zero license friction.
- Lazy-loaded, pauses on reduced motion, falls back to static SVG.

**Rejected:** Diegetic world-as-menu (GT7 — criticized as clunky), static background (lifeless), video background (perf, bandwidth).

---

## 6. Track Select: Horizontal Rail + SVG Map Silhouettes

**Decision:** Horizontal scroll-snap rail, 280px cards, layered SVG track maps (glow→core→highlight), weather/time chips, medal overlays.

**Why:**

- Forza community: Players can't memorize layouts by name → put **track map directly in card**.
- Horizon Chase: Color-coded performance (red/blue/gold/white) — "prioritize colors instead of texts."
- Race Force UI: Photo + title + bronze/silver/gold medals, horizontal rail with paging.
- Minimalist F1 Circuits: Layered SVG strokes + draw-on animation + hover scale/glow.
- Weather: Simple icon + time-of-day chip, not decorative illustration.

**Rejected:** Grid layout (wastes horizontal space), static images (no motion), text-only weather (slow scan).

---

## 7. Mode Select: Compartmentalized Groups + Intent Icons

**Decision:** Two groups (Solo / Multiplayer), mode cards with intent icons, difficulty badges, control method chips with availability sync.

**Why:**

- Rocket League Play Menu redesign: Split into Competitive / Casual / Offline / Private / Training — "reduce cognitive load / clutter."
- Asphalt 8/9: Group by intent (Single vs Multiplayer), color-coded rank vs requirement (red/white/green), vertical side tabs for mobile.
- NFS Unbound: "Each option described clearly so players can make informed decision."
- Control chips: Phosphor icons (steering-wheel, gamepad, hand, phone) + availability dimming (not disabling) for mode-disallowed methods.

**Rejected:** Flat list of all modes (overwhelming), alphabetical (no intent grouping), hiding unavailable methods (confusing for keyboard nav).

---

## 7. Motion Budget Per Surface

**Decision:** Strict motion budgets prevent animation overload.

| Surface                      | Budget                                                |
| ---------------------------- | ----------------------------------------------------- |
| Main Menu Hero               | ≤3 staggered entrances (car, title, actions)          |
| Track/Mode Select            | Card stagger only (60ms interval, max 8)              |
| Garage                       | Camera stage transitions (600ms) + spec bar fills     |
| HUD/Race                     | Micro only (progress fills, rank pulses, boost flash) |
| Victory                      | Crown drop + rank pop + stat stagger                  |
| Settings/Profile/Leaderboard | Micro only (tab indicator, progress shimmer)          |

**Why:** Awwwards WebGL sites (HAOQI, PX PUSH) use "motion budget per surface" — hero ≤3 staggered entrances, dashboard = micro-interactions only.

---

## 8. Mobile-First Responsive (Pixel 5: 393×851)

**Decision:** Responsive behavior, not forced desktop layout.

| Component    | Desktop                  | Mobile (≤600px)                                                      |
| ------------ | ------------------------ | -------------------------------------------------------------------- |
| Main Menu    | Side-by-side car + cards | Stacked: Car (40vh) → Cards (scroll)                                 |
| Track Select | Horizontal rail          | Horizontal rail with peek (113px)                                    |
| Mode Select  | Grid                     | Vertical stack, grouped headers                                      |
| Garage       | 70/30 split              | Tabs: Preview / Cosmetics / Specs                                    |
| Leaderboard  | Table + sidebar          | Horizontal scroll, sticky # column                                   |
| Achievements | 3-col grid               | 1-col stack, larger cards                                            |
| HUD          | Corner clusters          | AI HUD rail (right), Touch controls (left/bottom), Speed above accel |

**Touch Targets:** ≥48×48px (Apple HIG 44pt, Material 48dp, WCAG 24px minimum → we use 48px).
**Safe Areas:** `env(safe-area-inset-*)` for notch/home indicator.

---

## 8. Accessibility: WCAG AA + Reduced Motion

**Decision:** AA compliance for all text/interactive; AAA for critical HUD.

| Requirement    | Implementation                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Contrast       | Normal text ≥4.5:1 (we hit 7:1+), large text ≥3:1 (we hit 4.5:1), critical interactive ≥7:1               |
| Reduced Motion | Global gate disables particles/parallax/shimmer/stagger; preserves progress fills, rank pops, boost ready |
| Focus Visible  | 2px outline, `--accent-primary`, offset 2px, never removed                                                |
| Colorblind     | Deuteranopia/protanopia/tritanopia SVG filters; redundant encoding (icon + color + text)                  |
| High Contrast  | Forces borders, increases text weight, swaps palette to pure primaries                                    |
| Semantic HTML  | `<button>` not `<div>`, `role="progressbar"` + `aria-valuenow`, `aria-live="polite"` for HUD              |
| Scaling        | `--scale` CSS var (1–1.5×) for large HUD                                                                  |

**Why:** Forza Horizon 5 accessibility deep-dive (Can I Play That) shows analog/digital speedo, units, colorblind/high-contrast, moving-background toggle — we match + exceed.

---

## 9. Assets: Zero Legal Risk

**Decision:** Only CC0/MIT/OFL/Apache-2.0 assets. Verified per-asset.

| Category       | Source                | License | Commercial |
| -------------- | --------------------- | ------- | ---------- |
| Fonts          | Google Fonts          | OFL 1.1 | ✅         |
| Icons          | Phosphor              | MIT     | ✅         |
| 3D Models      | Kenney                | CC0 1.0 | ✅         |
| Textures/HDRIs | Poly Haven, ambientCG | CC0 1.0 | ✅         |
| Sounds         | Kenney                | CC0 1.0 | ✅         |

**Self-hosted** (no runtime API attribution). `THIRD_PARTY_NOTICES.md` for MIT/OFL/Apache.

**Rejected:** Sketchfab CC-BY-NC/SA, freesound CC-BY-NC, OpenGameArt GPL — legal risk for commercial portfolio.

---

## 10. Test Compatibility vs. Design Purity

**Decision:** Accepted test breakage for design system purity; fix tests in Phase L.

- `.glass-card` → `.card` (semantic: it's a card, not glass-specific)
- `.menu-actions-premium` → kept `.menu-actions` for test compat
- ModeSelectScreen chip API changed — tests need mock updates
- Flow test selectors updated in Phase L

**Why:** Design system > test compatibility. Tests are correctable; design debt is not.

---

## 11. Performance Guardrails (Non-Negotiable)

| Guardrail       | Limit                        | Enforcement                  |
| --------------- | ---------------------------- | ---------------------------- |
| CSS gzipped     | < 25 KB                      | Build check                  |
| Three.js hero   | < 100 KB glTF                | Kenney CC0 ~50 KB            |
| Fonts           | < 150 KB total               | Subset Latin, WOFF2, preload |
| Blur            | ≤12px mobile                 | CSS clamp                    |
| Particles       | ≤20 mobile / ≤60 desktop     | Ambient config               |
| Frame budget    | Dynamic resolution preserved | FrameBudgetScaler            |
| Three.js render | Only hero on menus           | Conditional init             |

---

## 12. Phases G2–O: Remaining Work (Priority Order)

1. **GarageScreen** — Three.js car, camera stages, spec bars, cosmetic tabs
2. **ProfileScreen** — XP arc, animated counters, title progression, records
3. **LeaderboardScreen** — Timing tower, current player highlight, animated rank
4. **AchievementsScreen** — Collectible cards, rarity glow, unlock animation
5. **HowToPlayScreen** — 7 tabs, interactive demos, search
6. **SettingsScreen** — Glass panels, live preview, accessibility toggles
7. **HUD Polish** — Speed glow tiers, boost shimmer, combo ring, AI HUD polish
8. **Victory/Results** — Crown drop, level-up pulse, stat counters
9. **Transitions** — Shared-element (racing line), slide/fade choreography
10. **Micro-interactions** — Ripple, magnetic hover, shimmer, toast choreography
11. **Mobile Pass** — Pixel 5 audit, touch targets, safe areas, no overflow
12. **Accessibility Pass** — WCAG AA audit, reduced motion, colorblind, high contrast
13. **Performance Pass** — Budget compliance, lazy-load, reduced motion
14. **Test Fix** — Selector updates, mock API alignment
15. **E2E Regression** — Full Playwright suite (dev + prod)
16. **Production Probe** — 22/22 on dist/ (chromium + Pixel 5)
17. **Zero Residue** — Clean temp files, final report

---

**Document Status:** Complete — ready for Phase L execution
