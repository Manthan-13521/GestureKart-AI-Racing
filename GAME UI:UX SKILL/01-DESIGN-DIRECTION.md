# 01-DESIGN-DIRECTION.md

**Virtual Steering — P15 UI/UX Visual Transformation**  
Single source of truth for visual identity. Consumes all research, outputs one coherent direction.

---

## DESIGN NORTH STAR

**Primary Theme:** _Neon Velocity_ — Dark cyber-track at night, razor-thin light trails cutting through atmosphere, precision telemetry glowing in the periphery.

**Secondary Theme:** _Garage Prestige_ — Showroom lighting on carbon-fiber, gold accents for mastery, tactile material contrast.

**Emotional Tone:** High-adrenaline precision; clean, confident, not cluttered. "This game respects my time and skill."

**Visual Metaphor:** **The Racing Line** — The optimal path, glowing through darkness, connecting all screens as a continuous thread.

**Racing Identity:** Modern simcade — Accessible depth, telemetry-grade clarity, no compromise on readability.

**Differentiator:** The only browser racing game where the UI _is_ the racing line — every transition, every glow, every number follows the same visual grammar.

---

## TARGET EMOTIONAL RESPONSE

| Moment       | Target Feeling                                      |
| ------------ | --------------------------------------------------- |
| First load   | "This looks premium — not a prototype"              |
| Main Menu    | "I see my car. I want to drive."                    |
| Track Select | "I recognize that layout. I know this track."       |
| Mode Select  | "Clear choices. I know what each does."             |
| Garage       | "My car looks incredible. I want to customize."     |
| Race HUD     | "I know exactly where I am, how fast, what's next." |
| Victory      | "Earned. Visceral. Share-worthy."                   |
| Mobile       | "Plays as well as desktop — no compromise."         |

---

## TARGET GAMER AUDIENCE

- **Primary:** Racing simcade enthusiasts (Forza Horizon, NFS, Assetto Corsa Competizione players) who value clarity over clutter
- **Secondary:** Mobile browser gamers (portrait menus, landscape race) who expect touch-first controls
- **Tertiary:** Portfolio reviewers — code quality, design systems thinking, accessibility discipline visible in result

---

## VISUAL IDENTITY

### Brand DNA

| Attribute                 | Definition                                                                                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visual Signature**      | The Racing Line — single glowing curve connecting every screen transition                                                                                                                                               |
| **Color Philosophy**      | Dark base → Panel layer → Muted info layer → **Vivid action layer (reserved for meaning only)**. Action colors NEVER appear in base layers.                                                                             |
| **Typography Philosophy** | One display face (Orbitron) + one condensed workhorse (Rajdhani) + one body face (Inter) + one mono for data (Share Tech Mono). Tabular figures mandatory for all numbers.                                              |
| **Spatial Philosophy**    | Edge-first layout — critical UI hugs screen edges, center reserved for content. Critical Focus Area (diamond around horizon + car) never occluded.                                                                      |
| **Glass/Neon/Carbon**     | Glass = universal container (blur 12px, saturate 160%, inset highlight, diagonal sheen). Neon = semantic accents only (4 colors, 1 role each). Carbon = texture suggestion via subtle noise overlay, not heavy imagery. |
| **Racing-Line Usage**     | Draws on entrance, morphs between screens, retraces on exit. SVG stroke, not CSS animation.                                                                                                                             |
| **Visual Hierarchy**      | 1. Primary CTA (Race) → 2. Live data (speed, position) → 3. Secondary actions → 4. Meta/info. Never more than 3 visual weights per screen.                                                                              |
| **Information Density**   | Mobile: 1 column, stacked cards. Desktop: 3-4 column grids. Horizontal rails for track/mode. No horizontal overflow ever.                                                                                               |

---

## COMPETITIVE INSPIRATION — WHAT TO BORROW CONCEPTUALLY

| Source           | Concept                                         | P15 Application                                                  |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| NFS Heat/Unbound | Visual signature (flare/graffiti) → Racing Line | Single repeatable glow/line motif across all screens             |
| NFS Unbound      | Garage as hub                                   | Player's car visible from main menu; 3D preview                  |
| Forza Community  | Track map in card                               | SVG track silhouettes on every track card                        |
| Asphalt 9 / F1   | Color-coded state                               | Rank gaps green/red, draft optimal/cyan, dirty/magenta           |
| F1 Broadcast     | Timing tower                                    | Left rail, position + name + gap + compound                      |
| Rocket League    | Compartmentalized modes                         | Mode cards grouped by intent (Solo/MP/Training)                  |
| F1 25            | Three-state type system                         | Box (static) / Apex (momentum) / DRS (max) → Menu / Race / Boost |
| Cyberpunk 2077   | Semantic color roles                            | Each accent = ONE function only                                  |
| Awwwards WebGL   | DOM + WebGL separation                          | CSS layout, Three.js depth/lighting only                         |
| Awwwards WebGL   | Motion budgets per surface                      | Hero ≤3 staggers, dashboard = micro only                         |
| Cyberpunk 2077   | Context-adaptive HUD                            | Hide non-critical in straight sections                           |
| GT / TelemetryIQ | Tabular numerals                                | All HUD numbers tabular                                          |
| NFS Heat / Kraj  | Critical focus area                             | Diamond zone around horizon — never occlude                      |
| NFS Unbound      | State-change celebration                        | Color shift/pulse when boost ready, rank up                      |

---

## WHAT NOT TO COPY

| Anti-Pattern                                           | Source                  | Why Rejected                                                 |
| ------------------------------------------------------ | ----------------------- | ------------------------------------------------------------ |
| 30+ first-level menu options                           | Forza Horizon 5         | Overwhelming, anxiety-inducing — restraint at entry point    |
| Diegetic world-as-menu friction                        | Gran Turismo 7          | Navigation depth kills efficiency — diegetic charm ≠ good UX |
| Red for everything (ornament + warning + feedback)     | Cyberpunk 2077          | No functional color coding — semantic roles required         |
| Notification spam, dopamine badges                     | Forza Horizon 5         | Compounds resentment — respect player time                   |
| Animating `backdrop-filter` or `width/height/top/left` | General                 | Layout thrash — animate `transform`/`opacity` only           |
| Unskippable >150ms menu animations                     | Forza/Gran Turismo      | Feels sluggish by 10th visit — cap at 280ms for UI           |
| Excessive glow/particles/glassmorphism                 | "AAA" misinterpretation | Visual clutter — AAA = hierarchy, consistency, restraint     |

---

## MOTION PHILOSOPHY

- **Default easing:** `ease-out` (`cubic-bezier(0.22, 1, 0.36, 1)`) — starts fast, feels responsive
- **Asymmetric timing:** User-triggered = fast intro/slow outro; code-triggered = slow intro/fast outro
- **Exit duration:** 75% of entrance duration
- **Stagger:** 60ms interval, max 8 items, `fill-mode: both`
- **Budgets:** Hero ≤3 staggered entrances (800ms max), screens = micro-interactions only, race = progress fills + rank pulses only
- **Reduced motion:** Global gate disables ALL non-essential animation; preserves state-communicating animation (progress fills, rank pops, boost ready)

---

## INTERACTION PHILOSOPHY

- **Feedback > Flourish** — Every press, hover, focus has immediate visible response (<120ms)
- **No hidden gestures** — All actions have visible UI affordance
- **Keyboard parity** — Tab order logical, `Escape` always goes back, `Enter`/`Space` activates
- **Touch-first mobile** — 48×48px minimum targets, 56px for primary CTA, thumb-zone placement
- **State change = celebration** — Color shift, pulse, glow when something important happens (boost ready, rank gain, lap complete)

---

## ACCESSIBILITY PHILOSOPHY

- **Contrast:** Normal text ≥ 4.5:1 (target 7:1), large text ≥ 3:1 (target 4.5:1), critical interactive ≥ 7:1, HUD numeric ≥ 10:1 via glow + dark outline
- **Reduced motion:** Non-essential = instant; state-communicating = preserved
- **Focus visible:** 2px outline, `--accent-primary`, offset 2px, NEVER removed
- **Colorblind:** Deuteranopia/protanopia/tritanopia SVG filters; redundant encoding (icon + color + text + shape) always
- **High contrast mode:** Forces borders, increases text weight, swaps to pure primaries
- **Semantic HTML:** `<button>` not `<div>`, `role="progressbar"` + `aria-valuenow`, `aria-live="polite"` for HUD
- **Scaling:** `--scale` CSS var (1–1.5×) for large HUD/low vision

---

## MOBILE PHILOSOPHY

- **Portrait menus, landscape race** — Force landscape during gameplay via Screen Orientation API
- **Responsive behavior, not forced desktop layout** — Stack cards vertically, horizontal rails with peek, tab bars for primary nav
- **Safe areas respected** — `env(safe-area-inset-*)` for notch/home indicator
- **Touch controls don't overlap HUD** — AI HUD rail (right), touch steering (left/right), accel (bottom-center)
- **Performance first** — Blur ≤8px mobile, particles ≤20, scanlines/CRT disabled, Three.js hero only on menus

---

## PERFORMANCE PHILOSOPHY

| Guardrail         | Limit                        | Enforcement                  |
| ----------------- | ---------------------------- | ---------------------------- |
| CSS gzipped       | < 25 KB                      | Build check                  |
| Three.js hero car | < 100 KB glTF                | Kenney CC0 ~50 KB            |
| Fonts (preloaded) | < 150 KB total               | Subset Latin, WOFF2, preload |
| Glass blur        | ≤12px desktop, ≤8px mobile   | CSS clamp, never animated    |
| Particles         | ≤60 desktop, ≤20 mobile      | Ambient config               |
| Frame budget      | Dynamic resolution preserved | FrameBudgetScaler            |
| Three.js render   | Only hero on menus           | Conditional init             |
| DOM complexity    | < 2000 nodes menus           | Component reuse, lazy mount  |

---

## CONSISTENCY RULES

1. **One Racing Line** — Same SVG, same glow, same behavior everywhere
2. **Four Accents, One Role Each** — Primary=Go, Gold=1st, Cyan=Info, Red=Danger, Magenta=Warning
3. **Typography Roles Fixed** — Orbitron=Display/Buttons, Rajdhani=HUD/Headings, Inter=Body, Share Tech Mono=Timers
4. **Glass Card Universal** — Every card uses `.card` base; variants via modifier classes only
5. **Motion Tokens Only** — No hardcoded durations/easings in component code
6. **Touch Targets ≥ 48px** — Enforced via CSS `min-height`/`min-width` on all interactive
7. **Tabular Figures Mandatory** — Speed, position, lap, time, score, combo, any columnar data
8. **Reduced Motion Global** — Single media query + JS gate, no per-component opt-out

---

## ANTI-PATTERNS / THINGS TO AVOID

- ❌ More than 4 accent colors
- ❌ Accent colors used decoratively (only semantic)
- ❌ Orbitron for body text
- ❌ Non-tabular numerals in HUD/leaderboards
- ❌ Animating `backdrop-filter`, `width`, `height`, `top`, `left`
- ❌ Menu animations >280ms (cinematic 700ms = first-run hero only)
- ❌ Stagger >8 items or >80ms interval
- ❌ Particles/parallax on mobile
- ❌ Horizontal overflow at any breakpoint
- ❌ Touch targets < 48px
- ❌ Focus styles removed
- ❌ Red/green as sole state encoding
- ❌ Three.js on mobile HUD (hero car menus only)
- ❌ Diegetic navigation that adds friction
- ❌ Notification badges that persist without action

---

## DEFINITION OF "PREMIUM"

Premium is **not** excessive glow, animation, glassmorphism, giant typography, visual clutter, or constant particles.

Premium **is**:

- Hierarchy — clear primary/secondary/tertiary at every screen
- Consistency — same tokens, same components, same motion everywhere
- Responsiveness — mobile feels native, not squashed desktop
- Purposeful motion — every animation communicates state or guides attention
- Excellent feedback — press = ripple, hover = brighten, focus = outline, all <120ms
- Clarity — information finds you, you don't hunt for it
- Polish — no layout thrash, no font flash, no jank, no broken states
- Restraint — knowing what NOT to animate, what NOT to glow, what NOT to show

---

## DEFINITION OF "NEXT-LEVEL"

Next-level is **not** copying Forza/NFS/GT visuals.

Next-level **is**:

- A browser game where the UI _is_ the racing line — coherent visual grammar across 15+ screens
- Three.js + DOM integration where each does what it's best at (CSS layout/semantics, WebGL depth/lighting)
- Accessibility baked into design system, not bolted on (colorblind filters, high contrast, reduced motion, semantic HTML, live regions)
- Motion budgets per surface — hero gets cinema, HUD gets micro, nothing gets bloat
- Asset pipeline with zero legal risk (CC0/MIT/OFL verified, self-hosted, attributed)
- Test-compatible design system — selectors stable, APIs predictable, regression gates green

---

## DEFINITION OF "DONE"

P15 is done when:

1. ✅ All 15+ screens redesigned per spec (Main Menu, Track Select, Mode Select, Garage, Profile, Leaderboard, Achievements, How-To-Play, Settings, Splash, Loading, Race HUD, Countdown, Victory, Results, Replay, Photo Mode, overlays/modals)
2. ✅ Design system complete (tokens, components, motion, transitions, theme manager)
3. ✅ 24 unit test failures resolved (selector/API compatibility)
4. ✅ E2E regression passes (27/13/0 desktop/mobile)
5. ✅ Production probe passes (22/22 on dist/ — chromium + Pixel 5)
6. ✅ WCAG AA compliant, reduced motion verified, colorblind presets functional
7. ✅ Performance budgets met (CSS <25KB, hero <100KB, fonts <150KB, blur ≤12px/8px, particles ≤60/20)
8. ✅ Zero lint/prettier/typecheck errors
9. ✅ Visual QA checklist complete (all screens desktop + mobile)
10. ✅ Clean repo — no temp files, final report written

---

## DESIGN LAWS

**Non-negotiable rules OpenCode must follow:**

1. **Semantic Color Only** — Four accents (Primary/Gold/Cyan/Red/Magenta), each with exactly ONE functional role. Never decorative.

2. **Tabular Numerals Mandatory** — Speed, position, lap, time, score, combo, leaderboard columns — `font-variant-numeric: tabular-nums` always.

3. **Critical Focus Area Protected** — Diamond zone around horizon + player car + immediate surroundings. No UI elements occlude this zone during race.

4. **Motion Budgets Enforced** — Hero ≤3 staggers (800ms max), screens = micro only (≤280ms), race = progress/rank/boost only. No exceptions.

5. **Animate Transform/Opacity Only** — Never `backdrop-filter`, `width`, `height`, `top`, `left`, `border-radius`. GPU layers via `will-change`, remove after.

6. **Reduced Motion Global Gate** — Single `@media (prefers-reduced-motion: reduce)` + `AnimationSystem.isMotionReduced()` JS gate. Decorative = instant; state-communicating = preserved.

7. **Touch Targets ≥ 48px** — All interactive elements: `min-height: 48px; min-width: 48px`. Primary CTA: 56px. Enforced in base CSS.

8. **Focus Visible Never Removed** — `:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }` on all interactive.

9. **Colorblind Redundant Encoding** — No state conveyed by color alone. Always icon + text + shape + color.

10. **No Horizontal Overflow** — `overflow-x: hidden` on body, `max-width: 100%` on containers, horizontal rails use `scroll-snap` with peek.

11. **Glass Blur Capped** — `backdrop-filter: blur(12px)` desktop, `blur(8px)` mobile. Never animated. `saturate(160%)` for clarity.

12. **Three.js Menus Only** — Hero car on Main Menu, Garage preview. No Three.js in HUD, race, or mobile menus.

13. **Racing Line = Shared Element** — Single SVG component morphs across transitions (Menu→Track→Mode→Race→Victory→Results→Menu). Not recreated per screen.

14. **Typography Roles Fixed** — Orbitron: Display/Logo/Buttons/Countdown. Rajdhani: Headings/HUD/Labels. Inter: Body/Descriptions. Share Tech Mono: Timers/Leaderboards. No cross-role usage.

15. **Asymmetric Motion Timing** — User-triggered: fast intro (120ms) / slow outro (200ms). Code-triggered: slow intro (280ms) / fast outro (120ms). Exit = 75% entrance.

16. **Stagger Limits** — 60ms interval, max 8 items per choreography, `animation-fill-mode: both`. Beyond 8 = no stagger.

17. **High Contrast Mode Functional** — Forces borders, increases text weight, swaps palette to pure primaries (`#000`/`#fff`/`#0f0`/`#ff0`/`#0ff`/`#f00`/`#f0f`). One toggle in Settings.

18. **Semantic HTML Required** — `<button>` not `<div>`, `role="progressbar"` + `aria-valuenow/min/max`, `aria-live="polite"` for HUD, `aria-hidden="true"` for decorative layers.

19. **Asset License Verified** — Only CC0/MIT/OFL/Apache-2.0. Self-hosted. `THIRD_PARTY_NOTICES.md` for MIT/OFL/Apache. Unclear = VERIFY LICENSE.

20. **Test Selectors Stable** — Design system changes update test selectors in same PR. No "fix tests later" — tests are part of implementation.

21. **Mobile ≠ Desktop Squashed** — Separate layouts per breakpoint: stack cards, tab bars, horizontal rails with peek, accordion settings, collapsible profile sections.

22. **HUD Readability > Visual Flourish** — If glow/animation reduces speed/position legibility, remove it. 10:1 contrast on critical HUD via dark outline + glow.

23. **State Change = Celebration** — Boost ready = speedometer color shift + pulse. Rank gain = pop + green flash + announce. Lap complete = counter flash gold. All <600ms.

24. **Performance Budget Enforced** — Build fails if CSS >25KB gzipped, hero glTF >100KB, fonts >150KB. Mobile GPU ≤2ms/frame for background effects.

25. **Zero Residue** — No temp files, no debug code, no commented-out blocks, no unused imports. Clean repo at ship.
