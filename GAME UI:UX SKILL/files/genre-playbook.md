# Genre Playbook

Racing games split into a handful of subgenres with genuinely different UI conventions, built from surveying the interfaces of sim, arcade, kart, mobile, and time-trial racers across the genre's history — from the Ridge Racer and Mario Kart era through current titles like Gran Turismo 7, Forza Horizon, F1 25, Need for Speed Unbound, Mario Kart World, and Sonic Racing. This file is organized by _pattern_, not by a ranked list — rank doesn't tell you anything useful about what to build, but knowing which subgenre a project belongs to tells you almost everything about HUD density, menu depth, and tone. Use it to calibrate, and to translate a reference like "make it feel like Mario Kart" into concrete decisions.

## Contents

- Quick-reference table
- Simulation
- Open-world arcade
- Arcade checkpoint & combat
- Kart racing
- Time trial / precision
- Mobile touch (arcade)
- Drag racing
- Rally & off-road
- Borrowing across genres without breaking the fantasy

## Quick-reference table

| Subgenre                   | HUD density        | Menu depth                | Representative titles                                                                                | Core UI trait                                      |
| -------------------------- | ------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Simulation                 | High               | Deep (setup/tuning)       | Gran Turismo 7, Forza Motorsport, F1 25, iRacing, Assetto Corsa Competizione, Le Mans Ultimate       | Telemetry, diegetic cockpit view, precision tuning |
| Open-world arcade          | Medium             | Deep (map/collection)     | Forza Horizon 5/6, Need for Speed Unbound/Heat, The Crew Motorfest, Test Drive Unlimited Solar Crown | Navigation minimap doubles as world map            |
| Arcade checkpoint & combat | Low–Medium         | Shallow                   | Burnout Paradise, Wreckfest, Hot Wheels Unleashed, Ridge Racer                                       | Big, punchy, damage/takedown-forward               |
| Kart racing                | Low                | Shallow–Medium            | Mario Kart 8 Deluxe / World, Crash Team Racing Nitro-Fueled, Sonic Racing CrossWorlds                | Item-forward, rubber-banding, chaos-tolerant       |
| Time trial / precision     | Very low           | Shallow                   | Trackmania, F-Zero GX, Distance                                                                      | Delta-to-ghost is the entire HUD                   |
| Mobile touch (arcade)      | Low, auto-assisted | Medium (collection/gacha) | Asphalt 9: Legends, Real Racing 3, CarX Street, Racing Master                                        | Simplified-vs-manual control toggle                |
| Drag racing                | Very low, linear   | Medium (garage-heavy)     | CSR Racing 2, Nitro Nation                                                                           | Reaction-time + shift-timing HUD, no steering      |
| Rally & off-road           | Medium–High        | Medium                    | Dirt Rally / WRC series, Dakar Desert Rally                                                          | Co-driver pace-note callouts as HUD element        |

## Simulation

**Fantasy:** technical mastery, authenticity, "this is what real racing feels like."

- HUD leans dense by default but should make every element individually toggleable — see `hud-design.md`'s telemetry section and `accessibility.md`. Sim players are the audience most likely to want to configure exactly what's on screen.
- Cockpit/diegetic camera is a first-class mode, not an afterthought — many sim players race exclusively from it. Plan the diegetic-vs-overlay fork from the start (see `hud-design.md`).
- Menus go deep on setup: tire pressure, gear ratios, aero, brake bias. Sliders need visible numeric values, not just a position on a track — precision-oriented players want to read and record exact numbers.
- **Borrow:** the delta-to-reference-lap readout. It's the single most useful piece of information for a player trying to improve, and it generalizes to any genre with a time element.
- **Avoid:** forcing sim-level density onto every camera mode and every player. A "simplified HUD" toggle isn't a betrayal of the genre — Forza Motorsport's accessibility-menu approach (colorblind filters, HUD contrast, adjustable text size, alongside the deep sim options) shows the two aren't in tension.

## Open-world arcade

**Fantasy:** freedom, spectacle, a world to explore between races.

- The minimap does double duty — see the minimap section of `hud-design.md`. Get the fork between "in-event circuit view" and "open-world navigation view" right; it's the defining UI challenge of this subgenre.
- Menus tend to be map-centric: a world map is often the real navigation hub, with events, shops, and points of interest as pins on it rather than buried in list menus.
- HUD philosophy in recent entries in this space favors staying quiet during normal driving and celebrating hard on specific moments (boost, big air, a new record) — see the "Dynamic HUDs" section of `hud-design.md`. Don't block the scenery the open world is selling; these games are partly about the view.
- Garage/customization tends to be extensive (visual customization especially) because the fantasy includes self-expression, not just competition.
- **Borrow:** letting the player preview an event's requirements from the map itself, without a menu detour.
- **Avoid:** menu fatigue from switching between "world map" and "garage" and "event list" as three disconnected top-level destinations. Players in this subgenre expect to flow between exploring, racing, and customizing without a hard context switch each time.

## Arcade checkpoint & combat

**Fantasy:** speed, spectacle, crashes as a feature not a failure state.

- HUD stays deliberately sparse — speed, position, a boost meter, sometimes a damage/takedown counter. These games sell velocity and impact over data.
- Damage/takedown feedback is often the loudest HUD moment in the game (a takedown notification, a slow-motion beat) because destruction is core to the fantasy, not an incidental risk to manage.
- Menus are shallow by design — get the player back into a race fast. Long menu chains fight the pick-up-and-play appeal.
- **Borrow:** treating a crash or takedown as a celebrated spectacle event (camera work, a distinct sound and visual sting) rather than just a speed penalty — it reframes what would be a failure state in a sim into content.
- **Avoid:** adding sim-style telemetry "for depth." It dilutes the pick-up-and-play identity this subgenre is built on.

## Kart racing

**Fantasy:** chaotic, friendly competition; skill matters, but so does luck and comeback potential.

- **Rubber-banding is a UI-relevant mechanic, not just a physics one:** item quality/frequency typically scales with race position (trailing racers get stronger items), which means the item-box/inventory UI is communicating a comeback opportunity, not just a random pickup. Make held items clearly visible to the player (and often to opponents) since anticipating what's coming is part of the skill.
- HUD is minimal: position, lap, held item(s), sometimes a coin/currency counter. Speed is often deliberately underplayed compared to other genres — the fantasy is about position and chaos, not velocity.
- Track-relative elements (item boxes on the track itself) are part of the "HUD" in a broader sense — their visual clarity matters as much as the on-screen overlay.
- Menus stay friendly and shallow — character/kart select with clear visual personality per option, simple track select, minimal setup depth.
- **Borrow:** visible held-item slots that create anticipation and let players (and opponents) read the coming threat.
- **Avoid:** hiding the comeback mechanic. Part of what keeps this subgenre inclusive for mixed-skill groups is that trailing players can visibly see their odds improving — obscuring that undermines the design's own inclusivity goal.

## Time trial / precision

**Fantasy:** pure improvement against a clock, often solo, often about muscle memory and margins of a tenth of a second.

- The HUD can be nearly nothing: a timer, a delta-to-ghost or personal-best, sometimes a minimal speed readout. This is the one subgenre where "less" isn't a compromise — an empty HUD is often the _correct_, most-requested state, and top titles in this space let players toggle almost every element off individually.
- Ghost cars (a translucent replay of a reference run) are a core mechanic and a core piece of "HUD" in the broadest sense — they need to read clearly as _not_ a real opponent (distinct material/opacity) while still being spatially precise enough to race against.
- Medal/tier systems (bronze/silver/gold/author-time style tiers) are a common lightweight progression layer that replaces a traditional career menu.
- Live ranking or spectator feeds, when the game supports viewing others' runs, benefit from real-time notifications ("Player X just beat your time") rather than requiring a manual refresh/check.
- **Borrow:** a HUD element visibility picker, letting each player configure exactly what's on screen. This genre's audience is the most likely to actually use per-element toggles rather than just an overall density preset.
- **Avoid:** decorating this HUD. Every non-essential pixel competes with the one thing this genre's players are actually looking at — their margin against the clock.

## Mobile touch (arcade)

**Fantasy:** quick sessions, collection, accessible spectacle on a small screen with imprecise input.

- **The defining pattern is a simplified-vs-manual control toggle:** an assisted mode where the car steers and accelerates mostly on its own and the player's input is reduced to swipe-to-change-lane, tap-to-drift, and tap-to-boost, alongside a traditional manual/tilt/tap-to-steer option for players who want full control. This isn't a lesser mode bolted on for casuals — treat it as a legitimate first-class control scheme, since it's frequently the _default and most-used_ option in shipped mobile racers.
- Touch targets for drift/boost/lane-change need to sit where thumbs naturally rest in landscape play, sized well above minimum-tap-target guidelines, and never overlap the sightline to the road.
- HUD stays minimal — screen space is scarce and precious on a phone. Speed, position, and the current boost/drift state cover most needs; resist porting a console-density HUD onto a 6-inch screen.
- Garage/collection screens tend to be a major part of the game (often with gacha- or blueprint-style unlock systems) — budget real design attention here, not just on the HUD.
- **Borrow:** the assisted-control philosophy even for non-mobile platforms as an accessibility/onboarding option — see the onboarding note in `menu-and-flow.md`.
- **Avoid:** placing controls or HUD elements in the corners a hand actually grips the device from; always design against real device safe areas, not just the visible screen bounds.

## Drag racing

**Fantasy:** pure reaction time and mechanical timing, no steering at all.

- HUD is a specialized, narrow instrument: a reaction-time light tree/countdown, a shift indicator or shift-timing prompt, and a simple position/result readout. There's no minimap, no cornering-relevant telemetry — the entire skill expression is in the start and the shifts.
- Garage and tuning tend to be unusually deep relative to the on-track HUD, since the strategic depth of this subgenre lives almost entirely in car-building and matchup selection rather than in real-time driving skill.
- **Borrow:** the light-tree/countdown pattern as a reusable "precise reaction moment" UI beat — it generalizes to any race-start sequence in any subgenre.
- **Avoid:** assuming this subgenre needs less UI craft because the HUD is simple. The garage/tuning screens are doing the heavy lifting here and deserve proportionally more design attention.

## Rally & off-road

**Fantasy:** driving blind into the unknown, trusting a co-driver, fighting the surface as much as the competition.

- **Pace notes / co-driver callouts function as a HUD element**, even though they're often audio-first: a visual pace-note strip or upcoming-corner indicator (tightening/opening turn icons, distance-to-corner) gives players who can't parse audio callouts under pressure a way to anticipate blind corners. Treat this as a genre-specific Tier-1 element, not an optional add-on.
- Surface and weather state (mud, snow, tarmac, changing grip) is often worth a HUD cue since it directly informs braking and throttle decisions, similar to tire temperature in circuit sims.
- Menus split cleanly into stage select (point-to-point routes, not laps) and a service/setup menu between stages (sim-adjacent tuning depth).
- **Borrow:** visual pace notes as a genuinely useful accessibility layer even for players who can hear audio callouts fine — redundant coding, covered further in `accessibility.md`, helps everyone in high-cognitive-load moments, not only players who need it.
- **Avoid:** treating this as "circuit racing with worse traction." The lack of a lap to learn (most stages are point-to-point and driven once) changes what the player needs from the UI — more upcoming-corner information, since they can't rely on memorized track knowledge the way a circuit racer can.

## Borrowing across genres without breaking the fantasy

It's common and often good practice to borrow a specific technique across subgenres — a sim's delta-to-ghost readout works great in an arcade game; a kart racer's visible-item-anticipation idea could inform a sim's tire-strategy display. What breaks the fantasy is borrowing _density_ or _tone_ wholesale: a kart racer with sim-level telemetry stops feeling like a kart racer, and a sim with a kart racer's minimal HUD reads as unfinished rather than elegant to its audience. When in doubt, borrow the specific technique and re-calibrate its density to the target genre's row in the table above.
