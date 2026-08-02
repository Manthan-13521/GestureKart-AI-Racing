# In-Race HUD Design

The HUD is the one screen the player looks at while doing something else entirely — steering, braking, watching for apexes. Everything here is written with that constraint first.

## Contents

- The information hierarchy
- Spatial layout: where things go and why
- The core cluster: speed, position, lap/time
- Secondary systems: nitro, damage, tires, fuel
- The minimap
- Sim telemetry (when the genre calls for it)
- Diegetic vs. overlay HUDs
- Dynamic HUDs: fading, flaring, and celebrating
- Selling a sense of speed (and why motion blur alone isn't the answer)
- Practical implementation notes

## The information hierarchy

Rank everything you might put on screen into three tiers before you design a single widget:

- **Tier 1 — always visible, always the same place:** current speed, race position, current lap. These are read dozens of times per minute; if their position ever moves, the player has to re-find them every time.
- **Tier 2 — visible during the race, secondary priority:** minimap, lap/split time, boost or nitro meter, gear indicator. Read every few seconds, not every second.
- **Tier 3 — contextual, appears only when relevant:** damage warnings, wrong-way indicators, incoming-item alerts, "new best lap," rival gaining/losing ground, penalty notices, tire-wear warnings. These should be invisible until they're true, then unmissable.

A HUD that gives Tier 3 the same permanent screen presence as Tier 1 is the most common way racing HUDs get overcrowded. If it's not needed every lap, it shouldn't cost screen space every lap — surface it as a transient notification instead.

## Spatial layout: where things go and why

The player's gaze rests on the upper-center of the screen, tracking the road and the racing line. Keep that zone almost entirely clear. Persistent HUD elements belong at the edges and corners, in the peripheral vision the player is already using to stay aware of the car's state without central focus.

A layout that has worked across most racing games, adapted to the genre's information budget:

```
┌──────────────────────────────────────────────────┐
│ [pos/lap]                          [minimap]      │  ← corners: persistent,
│                                     [rivals list]  │     low-attention info
│                                                    │
│                                                    │
│              (clear sightline to track)           │  ← center: nothing here
│                                                    │     but transient alerts
│                                                    │
│  [nitro/boost]                                    │
│  [tire/damage]                    [gear] [speed]  │  ← bottom: the elements
│                                    [tachometer]    │     read most often, closest
└──────────────────────────────────────────────────┘     to the player's thumbs/
                                                            hands on a wheel/pad
```

Speed and the tachometer/gear sit bottom-right (or bottom-center in a cockpit view) in the large majority of racing games because that's where a real car's instrument cluster lives, and because it's the zone the eye returns to fastest after checking the road. Position and lap count sit top-left almost as universally, likely because that's the natural reading-order starting point in left-to-right languages. These aren't arbitrary — deviating from them without a reason makes the game feel unfamiliar in a way that costs the player learning time for no payoff. Deviate deliberately (e.g., to match a diegetic dashboard's real gauge placement), not by default.

## The core cluster: speed, position, lap/time

No racing game — arcade, sim, kart, or mobile — ships without some form of these two: **current speed** and **race position**. Everything else is optional. If a design brief is thin on detail, this is the one part of the HUD you can build with total confidence.

**Speed.** Two dominant treatments:

- _Analog-style:_ a needle over an arc of tick marks, mimicking a real speedometer. Reads well because the _angle_ of the needle communicates roughly how fast before the player even parses a number — pattern-matching beats reading digits under time pressure.
- _Digital-style:_ a large numeral, sometimes with a smaller unit label (mph/km/h). Reads precisely but requires an actual glance-and-parse; pair it with a secondary analog cue (a color-coded bar, a partial arc) if the game is fast enough that precision matters less than trend ("am I speeding up or slowing down").
  Most HUDs use both at once: a numeral for precision, a needle or bar for at-a-glance trend. Use **tabular (fixed-width) numerals** for the speed readout — proportional digits cause the number to visibly reflow and jitter as it changes, which reads as noisy at a glance. This is a one-line CSS/font-feature fix (`font-variant-numeric: tabular-nums` on the web) that most reference mockups skip.

**Race position.** Almost always "current / total" (e.g., "3/8"), placed where it's readable without hunting. In a lapped race, pair it with the lap counter ("LAP 2/3") since the two numbers are read together — "what lap am I on, and what place am I in" is one mental query, not two.

**Lap or elapsed time.** Current lap time, and ideally a **delta** against a reference (personal best, session best, a rival, or a ghost). The delta is more useful than the raw time for a player mid-race — "+0.3s" tells you something actionable; "1:24.7" by itself doesn't, unless the player has memorized their target. Time-trial and sim-leaning games should treat the delta as a Tier-1 element, not a Tier-2 afterthought.

## Secondary systems: nitro, damage, tires, fuel

Only include what the game's mechanics actually use — an empty nitro bar in a game with no nitro is just clutter.

- **Nitro/boost meter.** A fill bar or arc that empties as it's used and refills through skill actions (drafting, drifting, near-misses, depending on the game). The moment it hits "full and ready" is a Tier-3 event worth a distinct visual state — a color shift, a glow, a pulse — precisely because that's the instant the player has a decision to make. A boost bar that looks identical at 10% and 100% wastes its own payoff.
- **Damage.** Arcade games favor a simple state indicator (a warning icon, a cracked-glass overlay, a color-coded health bar) because the player needs a binary "am I in trouble" read, not a diagnostic. Sims favor a **schematic of the car** with per-component condition (front-left, rear-right, engine, gearbox) because their players actively manage damage as a resource. Match the fidelity of the display to whether the mechanic is "avoid crashing" or "manage a system."
- **Tire wear / temperature.** Sim-only in almost all cases. Shown as a small per-tire indicator (often color-graded cold→optimal→overheating) near the speed cluster, since tire state directly informs the same braking/throttle decisions the player is making moment to moment.
- **Fuel.** Relevant in endurance sims and some open-world arcade games with a fuel/energy resource. A simple depleting bar or numeral; rarely needs more fidelity than that.

## The minimap

Two genuinely different jobs hide under the same name, and conflating them is the most common minimap mistake:

1. **Circuit racing minimap:** a simplified top-down outline of the _known, closed_ track, with dots or arrows showing every car's position on it. Its job is answering "who's near me and where." Keep it simple — this is a Tier-2 element glanced at a few times a lap, not studied.
2. **Open-world navigation minimap:** shows the surrounding _explorable_ world, waypoints, points of interest, and the route to the next objective. Its job is wayfinding, not race-position awareness, and it earns a permanently larger, more detailed treatment because the player actually reads it to make navigation decisions between events.

If the game is open-world with point-to-point races inside it (Forza Horizon–style), you likely need both behaviors — a lightweight circuit-position view during an active race, and a fuller navigation map the rest of the time. Don't force one minimap style to do both jobs; simplify aggressively for the in-race version.

## Sim telemetry (when the genre calls for it)

Simulation-leaning racers (and especially motorsport-licensed games) have a player base that wants more raw data, not less. On top of the core cluster, sim HUDs commonly add: sector/split times against a reference lap, tire temperature and wear per corner, fuel load and consumption rate, ERS/energy deployment (in hybrid formulas), brake bias, and session flags (yellow, safety car, blue flag). Treat every one of these as opt-in and individually toggleable in settings — see `accessibility.md` — because the same density that a sim veteran wants is overwhelming to a newcomer. A telemetry-dense HUD with per-element visibility toggles serves both audiences; a fixed one only serves whichever audience it was tuned for.

## Diegetic vs. overlay HUDs

- **Overlay (non-diegetic) HUD:** flat UI drawn on top of the game world — the default for almost all racing games. Clearest, most flexible, easiest to make accessible.
- **Diegetic HUD:** information shown as part of the game world itself — a cockpit-view dashboard with real gauges, a windshield HUD projection, mirrors that actually reflect standings. Sim and cockpit-camera modes lean diegetic because it reinforces immersion and matches what players who chose that camera are asking for.
- Most shipped racing games actually run **both**, tied to camera choice: a full overlay HUD in chase/hood camera, a reduced or fully diegetic HUD in cockpit camera (where the real dashboard already shows speed and RPM). If the project supports a cockpit camera, plan for this fork explicitly rather than pasting the same overlay HUD over a cockpit view — that duplicates information the player can already see on the modeled dashboard.

## Dynamic HUDs: fading, flaring, and celebrating

The strongest pattern to borrow from recent arcade racers: keep the HUD deliberately quiet during normal driving, and spend visual energy — brightening, color-shifting, animating — only at the moment something significant happens (a full boost bar, a near-miss, a big air trick, taking first place, a personal best). This does two things at once: it keeps the default state calm and unobtrusive (serving the "glanceability" non-negotiable), and it makes the payoff moments actually feel like payoffs instead of getting lost in a HUD that always looks equally busy. A related, subtler technique: letting non-essential HUD elements fade to lower opacity during steady, uneventful driving and brighten back up under braking, cornering, or any state change — the HUD becomes quieter exactly when the player needs the road more, and louder exactly when they need the HUD more.

## Selling a sense of speed (and why motion blur alone isn't the answer)

Perceived speed is a bigger lever than actual velocity numbers for how "fast" a game feels, and it's built from several techniques layered together, not one silver bullet:

- **Field-of-view widening** as speed increases is one of the most effective and cheapest techniques — it's the same trick that makes a phone-camera "hyperlapse" feel fast. Tie FOV subtly to velocity and it reads as speed even at moderate frame rates.
- **Peripheral blur or streaking** at the screen edges (not full-screen motion blur) keeps the center — where the player is actually looking — crisp while still selling velocity in peripheral vision.
- **Particle work:** speed lines, passing scenery streaks, dust/spray kicked up by the car, all scaled to velocity.
- **Camera behavior:** subtle shake or sway tied to speed and surface, plus a camera that pulls back or lowers slightly at high speed.
- **Audio:** engine pitch, wind noise, and passing-object doppler do a surprising amount of the perceptual work, often more than any visual effect alone.
- **Full-screen motion blur** is the technique most people reach for first, and it's the least reliable one: it's expensive to render well, plenty of players disable it immediately given the option, and controlled research on racing games has found it doesn't reliably improve either lap times or reported enjoyment even though players can tell it's there. Treat it as a stylistic option behind a settings toggle, not a required ingredient — and never let it be the _only_ speed cue, because players who turn it off (many will) shouldn't lose all sense of velocity.

Always make heavy screen-space effects (FOV pull, camera shake, blur, chromatic effects) toggleable or reducible — they're also a motion-sensitivity and accessibility concern, not just a taste preference. See `accessibility.md`.

## Practical implementation notes

- Use **tabular/monospaced numerals** for any digit that updates in real time (speed, lap time, position) so digits don't visibly reflow.
- Keep persistent HUD text at a size and contrast that passes at the _smallest_ target screen (a phone at arm's length, a TV from a couch), not the designer's monitor — see `accessibility.md` for concrete contrast ratios.
- Build every HUD element as an independent, positionable, toggle-able component from the start. "Let players turn off or move the minimap" is a much smaller lift if the minimap was never hard-coded to a fixed corner in the first place.
- Animate state _changes_, not steady states. A speed needle should move continuously (it's tracking a continuously changing value); a "boost ready" glow should trigger once on the transition into that state, not loop indefinitely and become wallpaper.
- Reserve the purest, most saturated color in the palette for the rarest, most important HUD state (boost-full, final-lap, damage-critical). If everything on the HUD is equally bright, nothing reads as urgent.
