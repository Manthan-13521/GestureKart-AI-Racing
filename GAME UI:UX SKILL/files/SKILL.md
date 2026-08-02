---
name: racing-game-ui-ux
description: Research-grounded UI/UX design system for car and kart racing games — HUD/speedometer/minimap layout, garage and car-select screens, menu flow, typography, color, motion feedback, and accessibility, drawn from patterns across sim, arcade, kart, mobile-touch, and time-trial racers (Forza, Gran Turismo, Need for Speed, Mario Kart, F1, Trackmania, Asphalt, and more). Includes a working HTML/CSS/JS HUD + garage component kit to adapt directly into code. Use this any time the user is designing, building, reviewing, or improving a racing/driving/kart game's interface — HUD, dashboard, speedometer, minimap, garage, car customization, track select, race menu, lobby, leaderboard, or lap timer — even if they just say "build me a racing game" or "add a HUD to my driving game" without using the words UI or UX.
---

# Racing Game UI/UX

Approach this as the UI/UX lead on a racing game team who has shipped HUDs for sim, arcade, and mobile racers and knows exactly which numbers a driver's eye needs at 200 mph and which ones are just noise. Racing UI is a narrow, well-studied genre with real conventions — this skill exists so you don't have to reinvent the speedometer from first principles, and so the screens you build feel like they belong to a shipped game rather than a generic dashboard with a car on it.

This skill covers racing-**domain** knowledge: what screens a racing game needs, what each one must communicate, and the genre conventions that make a HUD readable at speed. For general visual-design craft — palette selection, type pairing, avoiding templated AI-default looks, layout composition — pair this with the `frontend-design` skill if it's available. That skill makes the pixels good; this skill makes them _correct for a racing game_.

## The non-negotiables

Every racing UI decision traces back to one of these. When in doubt, come back here.

1. **Glanceability over completeness.** The player's eyes are on the road, not the HUD. Every element must be readable in the fraction of a second it takes to flick your eyes down and back up. If it needs more than a glance to parse, it's a menu screen, not a HUD element.
2. **Genre sets the information budget.** An arcade racer earns clutter by having fewer systems to track; a sim earns density because its players want the data. Don't port a simulator's dashboard onto an arcade game, or an arcade game's empty screen onto a sim — see `references/genre-playbook.md`.
3. **Quiet by default, loud on the moment that matters.** The best racing HUDs stay calm during normal driving and spend their visual energy — color shifts, glow, motion — on the instant something significant happens: a full boost bar, a near-miss, a new personal best, taking the lead. Constant noise trains players to ignore everything.
4. **Speed and position are the two facts nobody skips.** Every racing game ever made surfaces "how fast am I going" and "where do I rank" in some form. Start every HUD with these two before adding anything else.
5. **The HUD is a layer on top of the world, not a wall in front of it.** Keep the sightline into the track clear, especially the upper-center of the screen where the driving line is read. Push persistent elements to corners and edges.
6. **Consistency beats cleverness in menus.** The same button confirms everywhere, the same button backs out everywhere, and a paused race resumes on the first button press. Novel navigation in a racing menu is friction, not delight.
7. **Accessibility is not a checkbox at the end.** Color-only signals, tiny HUD text, and fixed control schemes actively exclude players. Build the redundancy in from the start — see `references/accessibility.md`.

## Three questions that shape everything else

Before designing a single screen, answer these (ask the user if they haven't said, or state your best inference from context and move on — don't stall the build over it):

1. **What's the racing fantasy?** Technical mastery (sim), open-world spectacle (arcade), chaotic fun (kart/party), street culture and self-expression (urban arcade), or pure reflex/time-attack (time trial)? This is the single biggest driver of HUD density, color energy, and menu tone.
2. **What's the platform and input?** Gamepad, keyboard+mouse, touch, or wheel — and is it a phone, a TV from the couch, or a monitor up close? This drives element sizing, safe-area margins, and how much you can rely on precise cursor input vs. directional navigation.
3. **What's the emotional pitch?** Serious and technical, adrenaline and spectacle, or friendly and chaotic? This should be traceable in every copy choice and color decision, not just the splash screen.

State your assumptions for these three explicitly before you start building, the same way you'd state a design-brief assumption for any other project.

## Screen inventory — scope the build with this

A racing game's UI is bigger than the HUD. Use this checklist to figure out what actually needs building before diving into any one screen. Not every game needs every row — a time-trial game might skip "garage" entirely; a couch kart game might skip "lobby."

| Screen                                   | Purpose                                         | Reference          |
| ---------------------------------------- | ----------------------------------------------- | ------------------ |
| Title / boot                             | First brand impression, press-to-start          | `menu-and-flow.md` |
| Main menu                                | Mode selection hub                              | `menu-and-flow.md` |
| Garage / car select                      | Choose and inspect a vehicle                    | `menu-and-flow.md` |
| Customization (livery, upgrades, tuning) | Express identity, build performance             | `menu-and-flow.md` |
| Track / event select                     | Choose where to race                            | `menu-and-flow.md` |
| Pre-race / lobby                         | Grid view, opponent list, matchmaking, ready-up | `menu-and-flow.md` |
| Loading                                  | Tips, car/track art, progress                   | `menu-and-flow.md` |
| **In-race HUD**                          | Speed, position, lap, minimap, event feedback   | `hud-design.md`    |
| Pause                                    | Resume, restart, settings, quit                 | `menu-and-flow.md` |
| Results / post-race                      | Standings, splits, XP, unlocks                  | `menu-and-flow.md` |
| Leaderboards / crews / clubs             | Social comparison, rivalries, friend groups     | `menu-and-flow.md` |
| Settings (incl. accessibility)           | Controls, display, audio, HUD customization     | `accessibility.md` |
| Onboarding / tutorial                    | Teach one mechanic at a time, in context        | `menu-and-flow.md` |

## Build workflow

This is the order that actually works — resist the urge to jump straight to building the speedometer.

1. **Nail the fantasy first.** Answer the three questions above. Write them down as a one-paragraph brief before touching code, the same way you would for any UI project.
2. **Scope the screens.** Walk the inventory table and cut anything the game doesn't need. Don't build a crew/clubs screen for a single-player time trial.
3. **Set the visual language before building components.** Pick type pairing, color tokens, and how "loud" the motion/juice will be — see `references/visual-language.md`. Do this before the HUD or menus, not after, or you'll end up re-skinning everything.
4. **Build the HUD in priority order.** Speed → position/rank → lap or time → minimap → secondary systems (nitro, damage, tires, delta) → contextual event feedback. Get the first two right before you add the fifth thing. See `references/hud-design.md`.
5. **Build the menu shell and flow.** Main menu → garage → track select → pre-race, wired together with consistent navigation. See `references/menu-and-flow.md`.
6. **Run the genre check.** Compare your HUD density and menu depth against the closest genre entry in `references/genre-playbook.md`. If you've built a sim-density HUD for an arcade game (or vice versa), trim or add.
7. **Pass it through accessibility.** Contrast, color redundancy, HUD customization, input remapping — see `references/accessibility.md`. Do this before calling anything "done," not as a post-launch patch.
8. **Self-critique like a playtester.** Can you tell your speed and position without focusing on the HUD? Does the screen still work if you desaturate it (colorblind check)? Does the pause menu resume in one press? Fix what fails before moving on.

When you're generating actual code (HTML/CSS/JS, React, Unity UI Toolkit, Unreal UMG, etc.), start from `assets/hud-component-kit.html` — it's a working, themeable reference implementation of the HUD and garage patterns described below, not just a mockup. Read its CSS custom-property block first; that's the token system to adapt to the project's own visual language rather than hand-rolling one from scratch.

## Reference map

Read these on demand — don't load them all up front unless you're doing a full build.

- **`references/hud-design.md`** — Read when building or reviewing the in-race overlay: what goes in it, how genre changes its density, diegetic vs. overlay HUDs, minimap patterns, boost/damage/tire feedback, sim telemetry, and how to sell a sense of speed without leaning on motion blur alone.
- **`references/menu-and-flow.md`** — Read when building any screen that isn't the HUD: menu structure, navigation input conventions, garage/customization patterns, pre-race lobbies, pause menus, results/rewards flow, and onboarding.
- **`references/genre-playbook.md`** — Read when you need to calibrate density and tone, or when the user names a specific game or subgenre to emulate ("make it feel like Mario Kart," "I want something like Gran Turismo"). Covers sim, open-world arcade, arcade checkpoint/combat, kart, time trial, mobile touch, drag, and rally/off-road.
- **`references/visual-language.md`** — Read when choosing typography, color systems, iconography, or deciding how much motion/"juice" to use.
- **`references/accessibility.md`** — Read before finalizing any screen. Contrast ratios, colorblind-safe design, HUD customization, and input accessibility.
- **`assets/hud-component-kit.html`** — Open directly in a browser or copy from it. A single-file, themeable HUD + garage screen built with CSS custom properties, an animated speedometer, minimap, and a density toggle demonstrating arcade vs. sim scaling. Treat it as a starting point to restyle, not a template to ship unchanged.

## Common pitfalls

- **Cloning a specific game's exact look.** Genre conventions are free to reuse; a specific game's logo, exact typeface, or signature color combo isn't. Build an original visual identity that follows the _pattern_, the way `genre-playbook.md` describes it, not a pixel-for-pixel skin.
- **A HUD that's fully static or fully animated.** Static HUDs feel dead; HUDs that constantly move or pulse are exhausting and hide the moments that should stand out. Reserve motion for state changes.
- **Over-trusting motion blur for "sense of speed."** It's the first thing people reach for and the least reliable — see `hud-design.md` for what actually reads as fast.
- **Menus that require different buttons to confirm/back out in different screens.** This is the single most common racing-menu complaint in player feedback. Pick a mapping in step 1 of the build workflow and never break it.
- **Designing only for 1920×1080 gamepad play.** Racing games run on phones held sideways, ultrawide monitors, and TVs from the couch. Check the layout against the platform answer from the three questions above.
- **Treating accessibility as a settings-menu afterthought.** Color-only state (red = damaged, green = boost ready) fails colorblind players by design, not by oversight. Build the icon/shape redundancy into the component itself.
