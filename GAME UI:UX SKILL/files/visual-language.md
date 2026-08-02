# Visual Language: Typography, Color, Motion

Racing UI has a real, recognizable visual vocabulary — condensed technical type, dark grounds with saturated accents, purposeful motion. That vocabulary is a strong starting point, not a costume to apply identically to every project. This file gives concrete, usable defaults _and_ the reasoning to deviate from them on purpose. For the broader craft of avoiding generic, templated-feeling design (palette clichés, safe layout defaults), pair this with the `frontend-design` skill if it's available — the guidance below is racing-specific on top of that general foundation.

## Contents

- Typography
- Color
- Iconography
- Motion and "juice"
- Racing-specific clichés to avoid

## Typography

Racing HUDs and dashboards read fastest in **condensed, technical, geometric sans-serifs** — the family of typefaces that also shows up on real motorsport timing towers and dashboards. They fit more digits in less horizontal space (useful when a HUD element has a fixed corner budget) and their geometric, slightly mechanical character matches the domain without needing decoration to say "racing."

**A workable three-role system:**

- **Display/title** (logo, splash screen, event names, big celebratory moments): something with more personality and energy than the functional type — a bolder, more geometric or angular face. Use it sparingly, in the largest, least-frequent text only. Real, freely-available options with this character: _Orbitron_, _Audiowide_, _Russo One_, _Teko_ (bold weight).
- **Functional/HUD** (speed, position, lap time, gear, anything read in a fraction of a second): a condensed, highly legible technical sans, used at multiple weights for hierarchy. Real, freely-available options: _Barlow Condensed_, _Saira Condensed_, _Rajdhani_, _Exo 2_, _Chakra Petch_. These read cleanly at small sizes and hold up under motion in a way that decorative faces don't.
- **Body/menu text** (settings labels, descriptions, tutorial copy, anything meant to be actually read rather than glanced at): a plain, highly readable sans that doesn't fight the eye over paragraph-length text. Real, freely-available options: _Inter_, _Titillium Web_, _Barlow_ (the non-condensed sibling of the HUD face above, for a cohesive family).

Two roles is often enough for a small project (functional + body, skipping a distinct display face); three is a reasonable ceiling before it starts feeling inconsistent. Don't reach for a fourth typeface without a specific reason.

**Numerals matter more than usual in this genre.** Any digit that updates in real time — speed, lap time, position, countdown — should use **tabular/monospaced figures** (`font-variant-numeric: tabular-nums` on the web, or the equivalent fixed-width numeral feature in the engine's text system) so the digits don't visibly reflow as they change. This is a small technical detail with an outsized effect on how "solid" a HUD feels.

## Color

**Start from a dark ground with a small set of saturated accents, not a saturated ground.** Most racing HUDs — across sim, arcade, and mobile — sit on a dark or semi-transparent-dark base specifically so a small number of bright accent colors can carry real meaning without competing with each other or with the track underneath. A rule of thumb: one neutral dark base, one or two neutral lighter tones for secondary text/panels, and two to three saturated accents reserved for meaning (primary brand/selection color, a warning/danger color, a positive/boost/success color). If everything on screen is equally saturated, nothing reads as more urgent than anything else — see the "quiet by default, loud on the moment that matters" principle in the main SKILL.md.

**Ground the palette in the game's specific fantasy, not in "what racing games usually look like."** Genre gives a starting mood, not a fixed formula:

- Simulation: often restrained and closer to real motorsport broadcast graphics — whites, a single team/manufacturer accent, functional rather than decorative.
- Open-world arcade / street: room for more energy and saturation, often tied to a specific setting (neon for a night-city street-racing fantasy, warm sun-bleached tones for a desert/coastal open world) — the accent choice should say something about _this_ game's world, not just "racing game."
- Kart / party: bright, high-saturation, friendly — closer to a children's toy aisle than a dashboard, on purpose.
- Time trial / precision: often the starkest and most restrained of all — a near-monochrome HUD with a single accent for the delta/ghost readout, because restraint _is_ the aesthetic here.
- Rally/off-road: earthier, higher-contrast against unpredictable natural backdrops (mud, snow, dust) rather than the clean asphalt-and-neon palette of street racers.

**Reserve color-coding for consistent, learnable meaning**, and never let color alone carry a distinction a colorblind player would miss — pair every color-coded state with an icon, shape, or position cue too (see `accessibility.md`). Common, learnable conventions worth keeping consistent within a project: the player's own car/marker in one fixed color throughout every screen (minimap, results list, leaderboard), rivals or targets in a second consistent color, danger/damage states in warm/red tones, and boost/success states in the game's primary accent.

## Iconography

HUD and menu icons need to read as a silhouette at small size, often while the screen itself is in motion. Favor simple, high-contrast, geometric icon shapes over detailed or naturalistic ones — a stylized gear/wrench, a simple lightning bolt for boost, a tire silhouette, a checkered-flag mark for finish — over anything with fine internal detail that disappears under compression or motion blur. Keep one consistent icon style (stroke weight, corner radius, filled vs. outline) across the entire HUD and menu system; mixing icon styles reads as unfinished even when each individual icon is well drawn. Where an icon and a text label would say the same thing in the same space, prefer the icon in the HUD (faster to parse) and the icon-plus-label together in menus (where there's room and precision matters more than speed).

## Motion and "juice"

Motion in a racing UI should be **purposeful, not ambient.** Every animation should be attached to something changing — a value updating, a state transitioning, an event occurring — rather than looping for its own sake. A few reliable, genre-appropriate patterns:

- **State-change flashes/pulses:** a brief, distinct animation exactly once on the transition into an important state (boost ready, final lap, new best time), not a continuous loop for as long as the state holds.
- **Impact feedback:** a small camera shake or UI punch (a quick scale/shake on the relevant HUD element) tied to collision severity, capped so it never becomes disorienting — and always offered as a reduced-motion option, since screen shake is a real motion-sensitivity concern.
- **Numeral transitions:** speed and timer digits can tick or roll rather than snapping instantly; keep it fast enough (well under a quarter-second) that it reads as responsive rather than laggy.
- **Menu transitions:** consistent, quick, and directional (a new menu level slides in from the direction the player navigated) so the transition itself reinforces where the player is in the navigation hierarchy, rather than being decoration layered on top of it.

Spend the most elaborate motion in the fewest number of places — one genuinely memorable celebratory sequence (a race win, a new record) lands harder than the same amount of animation energy spread thinly across every minor UI interaction. A HUD that treats every event as equally exciting trains the player to stop noticing any of them.

## Racing-specific clichés to avoid

The same way generic web design clusters around a few templated looks, racing UI has its own default clichés worth naming so you can choose them on purpose or avoid them, rather than falling into them by default:

- Red-and-black-and-carbon-fiber-texture as the palette for every racing game regardless of fantasy — it's correct for some (aggressive street/tuner games) and wrong for most others (a sunny open-world arcade game, a friendly kart racer, a rally game set in snow).
- A heavy, slanted "impact"-style display font as the only typographic idea in the game — it reads as a placeholder more than a decision at this point, given how often it's the first thing reached for.
- Checkered-flag motifs scattered as generic texture rather than used deliberately (a finish line, a results screen) where the motif actually means something.
- Speed-line or lens-flare overlays applied uniformly across every screen, including menus where nothing is moving — motion cues should appear where motion is actually happening.
- Cyan-and-magenta "synthwave" neon as a default for any near-future or tech-forward racing concept, regardless of whether that specific mood fits the game's actual setting and tone.
