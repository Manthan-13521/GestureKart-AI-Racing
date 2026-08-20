# P15 Competitive Analysis — Racing Game UI/UX Deep Dive

**Sources:** Forza Horizon 5/6, Need for Speed Heat/Unbound, Gran Turismo 7, Asphalt 8/9, F1 22/25, Rocket League, Cyberpunk 2077, iRacing, Horizon Chase, F1 Manager 23, automotive configurators (Mazda, AITO), Awwwards WebGL sites (HAOQI, PX PUSH, RiotX Arcane)

---

## Forza Horizon 5 / 6

**Strengths:**

- World-as-menu: open world is the menu, seamless transitions
- Forzavista / showroom: cinematic camera stages, photorealistic car presentation
- Accessibility: analog/digital speedo, units, colorblind/high-contrast, moving-background toggle (Can I Play That)
- Quality tiers + dynamic resolution + GPU lifecycle management

**Weaknesses (Anti-Patterns):**

- FH5 main menu: "Windows 8 Metro UI" — 6 tabs × 4–8 options = 30+ first-level choices → overwhelming, anxiety-inducing (Kritiqal)
- Settings/accessibility buried as one small block
- Notification spam, dopamine-badge popups, endlessly repopulating icons
- FH7: "Too much time spent fighting through menus" (UX Design)
- FH6: Customizable garages add depth but risk feature creep

**Lessons for P15:**

- **Restraint at entry point** — main menu must have ONE clear CTA + secondary nav
- **Garage as showcase** — but keep navigation flat
- **Accessibility baked in** — quality tiers, colorblind, high-contrast, reduced motion
- **Car owns the screen** in garage; UI is invisible support

---

## Need for Speed Heat / Unbound

**Strengths:**

- **Visual Signature:** "Reusable visual signature in vein of Battlefield's flare/fire... reflected across key art, menu BGs, illuminated AR & HUD elements... brings motion and intrigue" (Creative Pixels)
- **Garage as Front End:** "Campaign, online, matchmaking all start in garage... players constantly anchored to customized vehicle... immerses player and creates showcase for vehicle & achievements" (Creative Pixels)
- **UI as Vehicle Extension:** "Vibrant pop against urban/gritty backgrounds... anchoring UI around player's own upgraded vehicle"
- **Celebration Through State Change:** Speedometer changes color when boost ready — one cue = celebration + state
- **Track Cards:** "Large tiles with clear descriptions displayed in foreground, in front of 3D object and illuminated backgrounds... different camera perspectives create excitement" (Creative Pixels)
- **HUD:** "Serve information in glanceable way... without absolutely blocking the game world with boxes" (Sailesh Vaghela)

**Lessons for P15:**

- **Define a visual signature** — one repeatable motif (glow style, line language, color treatment)
- **Garage = hub** — player's car visible from menu
- **State-change = celebration** — color shift, pulse, glow when something important happens
- **Track selection = visual first** — map silhouettes, weather chips, illuminated previews
- **HUD minimal footprint** — edge placement, no boxes over world

---

## Gran Turismo 7

**Strengths:**

- **Collector Fantasy:** Menu books, café, car history, photographic presentation (Scapes)
- **HUD Realism:** Mimics real instrumentation; custom wordmark + neutral data sans with tabular figures
- **Brand/Museum Storytelling:** Each manufacturer has a pavilion; car acquisition has narrative
- **Photographic Presentation:** Scapes mode = photo mode as art

**Weaknesses:**

- **Hub friction:** GT Resort diegetic world criticized as "clunky," "iOS-app-like," "too many menus" (VGC, Upcomer)
- **License tests force menu exits repeatedly** — "every small speed bump forces you back to menu" (VGC)
- **Navigation depth** — too many layers for simple actions

**Lessons for P15:**

- **Diegetic charm ≠ good UX** — don't sacrifice navigation efficiency for world-building
- **Tabular numerals essential** for lap times, speed, gear, position
- **Collector fantasy works** — achievement/progression visualization should feel like a collection
- **Custom wordmark** for brand identity (Orbitron already does this)

---

## Asphalt 8 / 9 (Mobile-First)

**Strengths:**

- **Speed of Navigation:** Class filters (D–S), color-coded rank vs requirement (red/white/green)
- **Great UX = Invisible:** "Players won't remember details. The game will just feel right" (Gameloft)
- **Mode Grouping:** "Single" vs "Multiplayer" top-level split; social/leaderboard/profile consolidated
- **Vertical Side Tabs:** Work well for tall mobile screens
- **Spec Hierarchy:** Car + performance rank + stars + blueprints + 4 stats (Accel/Top Speed/Handling/Nitro)

**Lessons for P15:**

- **Color-code state, not just text** — rank vs requirement = instant scan
- **Group by intent** — single vs multiplayer, not alphabetical
- **Vertical layouts for mobile** — side tabs, stacked cards
- **Garage specs as scannable bars** — not walls of numbers

---

## F1 Games (22/25 / F1 Manager 23)

**Strengths:**

- **Broadcast Replication IS the Identity:** Timing tower (left), position deltas, tyre compounds, DRS/ERS bars, real TV presentation
- **Per-Element HUD Customization:** Position/size/opacity per widget (F1 2021 feedback)
- **Live Data Aesthetic:** AWS-style timing, green gained/red lost positions
- **F1 25 Identity:** "Engine-spark color palette, three-state type (Box/Apex/DRS), backgrounds abstracting motion blur/light trails/circuits" (Further Group)

**Lessons for P15:**

- **Timing tower pattern** for leaderboards — left rail, position + name + gap + status
- **Three-state type system** — static / momentum / max speed — maps to our menu/race/boost
- **Broadcast authenticity** — leaderboard = timing tower, not spreadsheet
- **Color coding gains/losses** — green up, red down

---

## Rocket League

**Strengths:**

- **Cognitive Load Reduction:** Play Menu redesign → Competitive / Casual / Offline / Private / Training cards
- **Item Shop:** "One or two featured items primary focus, secondary focus less rare" (Noah Watkins)
- **Car Individualization:** Goal replays show off customization; Item Pass preview on live 3D car body
- **Compartmentalization:** "Reduce clutter... don't give all gameplay options upfront" (Psyonix)

**Lessons for P15:**

- **Compartmentalize modes** — don't dump all options
- **Primary vs Secondary focus** — clear hierarchy on every screen
- **Live 3D preview** for cosmetics (garage, item shop equivalent)

---

## Cyberpunk 2077

**Strengths:**

- **Total Thematic Consistency:** FUI, diegetic HUD as "part of V's optic enhancements," curvature/chromatic aberration shaders
- **Context-Adaptive HUD:** Health hidden when full, stamina only when draining
- **Technical:** RT + compute bloom for glow; scanlines, chromatic aberration post-process

**Weaknesses (Anti-Patterns):**

- **Red used for everything** — ornament + warning + feedback = no functional color coding (Prototypr)
- **Superfluous "window dressing" competing with data**
- **Inconsistent heading system** across screens

**Lessons for P15:**

- **Semantic color roles** — each accent has ONE meaning (not decorative + functional)
- **Context-adaptive** — hide UI when not needed (e.g., HUD elements fade in straight sections)
- **Glow = post-process** not per-element CSS (performance)
- **Consistent heading hierarchy** across all screens

---

## Futuristic Automotive HMI (Nissan IMs, Lexus UX, Hyundai Mobis)

**Principles:**

- **Z-axis/Parallax for Hierarchy:** "Time-sensitive alerts move closer to driver's eyes... less critical info remains farther away"
- **Layered Transparent Displays:** Natural parallax creates depth
- **Single Omnipresent Background Pattern:** Unifies multi-screen transitions with shared stopping point
- **Holographic/HOE Windshield:** Eyes on road, data in peripheral vision

**Lessons for P15:**

- **Parallax backgrounds** unify screen transitions
- **Layered depth** (DOM foreground, WebGL background, post-process top)
- **Shared visual anchor** across transitions (e.g., the "racing line" glow persists)

---

## Awwwards WebGL Sites (HAOQI, PX PUSH, RiotX Arcane)

**Principles:**

- **"Let DOM and WebGL Share a Stage":** CSS owns structure/semantics/accessibility; WebGL only for depth/lighting/refraction CSS can't do
- **One Visual Thesis:** Dot-matrix language repeated in hover reveals, page transitions, loading
- **Motion Budget Per Surface:** Hero ≤3 staggered entrances; dashboard = micro-interactions only
- **HAOQI:** Clip-path/radial-mask reveals, text-scramble on shared ticker, scroll-velocity distortion
- **PX PUSH:** Scanline bar (8s loop), line pattern, soft bloom, vignette, animated noise — single component above app

**Lessons for P15:**

- **DOM + WebGL separation of concerns** — don't put layout in Three.js
- **Single visual language** repeated across all screens
- **Motion budgets** per screen type
- **Shared global effects** (scanlines, vignette, noise) as single mounted component

---

## Horizon Chase

**Strengths:**

- **Color-Coded Performance:** Red=default, blue=finished, gold=max, white=bonus — "prioritize colors instead of texts"
- **HUD Grouping:** Race position/time → left; car status → right; minimap moved off horizon (critical focus area)

**Lessons for P15:**

- **Color encoding > text** for instant scanning
- **Critical focus area** must be protected from UI occlusion

---

## Race Force Game UI (Behance)

- Photo + title cards, medal overlays (bronze/silver/gold), horizontal rail with paging, bright-yellow parallelogram for selected state (controller)

---

## Minimalist F1 Circuit Collection

- Layered SVG strokes (glow→core→highlight), draw-on animation, per-track accent colors, hover scale/glow, fullscreen detail modal

---

## Summary: P15 Design DNA (Synthesized)

| Principle                    | Source           | P15 Application                                                  |
| ---------------------------- | ---------------- | ---------------------------------------------------------------- |
| **Visual Signature**         | NFS Heat         | One repeatable glow/line motif across all screens                |
| **Garage as Hub**            | NFS Unbound      | Player's car visible from main menu; 3D preview                  |
| **Track Map in Card**        | Forza Community  | SVG track silhouettes on every track card                        |
| **Color-Coded State**        | Asphalt 9 / F1   | Rank gaps green/red, draft optimal/cyan, dirty/magenta           |
| **Timing Tower Leaderboard** | F1 Broadcast     | Left rail, position + name + gap + compound                      |
| **Compartmentalized Modes**  | Rocket League    | Mode cards grouped by intent (Solo/MP/Training)                  |
| **Three-State Type**         | F1 25            | Box (static) / Apex (momentum) / DRS (max) → Menu / Race / Boost |
| **Semantic Color Roles**     | Cyberpunk        | Each accent = ONE function only                                  |
| **DOM + WebGL Separation**   | Awwwards         | CSS layout, Three.js depth/lighting only                         |
| **Motion Budgets**           | Awwwards         | Hero ≤3 staggers, dashboard = micro only                         |
| **Context-Adaptive HUD**     | Cyberpunk        | Hide non-critical in straight sections                           |
| **Tabular Numerals**         | GT / TelemetryIQ | All HUD numbers tabular                                          |
| **Critical Focus Area**      | NFS Heat / Kraj  | Diamond zone around horizon — never occlude                      |
| **State-Change Celebration** | NFS Unbound      | Color shift/pulse when boost ready, rank up, etc.                |
| **Restraint at Entry**       | FH5 anti-pattern | Main menu = 1 primary CTA + flat secondary nav                   |

---

## File: docs/p15-research/P15-COMPETITIVE-ANALYSIS.md
