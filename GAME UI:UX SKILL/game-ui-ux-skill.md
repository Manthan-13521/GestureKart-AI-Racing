---
name: game-ui-ux
description: Best-practice reference for designing and building game user interfaces — HUDs, menus, onboarding, game feel/juice, accessibility, and platform-specific specs like touch targets, contrast, safe zones, and text size. Use this whenever building, coding, reviewing, or planning any game (web, mobile, desktop, or console-style) and UI/UX comes up in any form — HUDs, menus, settings screens, tutorials, inventory or dialogue systems, notifications, pause screens — or when the user just wants the game to feel good, feel polished, or be easier to play, even without ever saying the words UI or UX.
---

# Game UI/UX Design

Approach this the way a UX lead at a game studio would: the interface isn't decoration bolted onto the game afterward, it's the channel every rule, every piece of feedback, and every choice has to pass through to reach the player. A game can have brilliant mechanics and still lose players if they can't perceive what's happening or don't know what to do next. The best game UI disappears — the player feels the game, not the interface sitting on top of it. None of this is tied to a specific engine or language; the same principles apply whether the game is built in Unity, Godot, Unreal, a web canvas, or anything else.

## Start with information, not decoration

Before placing a single button, decide three things: what the player needs to know right now, what they need to know soon, and what they never need to see on this screen. Most weak game UIs come from skipping this and displaying everything the system tracks, all the time, "just in case."

- **Hierarchy first.** The most urgent, most frequently needed information (health, ammo, the currently selected tool) gets the biggest, highest-contrast, most central treatment. _Breath of the Wild_'s map highlights only what matters for the player's current goal instead of every point of interest at once — that's hierarchy doing its job.
- **Respect cognitive load.** Every extra number, icon, or bar on screen is something the player has to parse mid-action. If a value won't change a decision in the next few seconds, it probably belongs in a menu, not the HUD.
- **Make it conditional.** The strongest HUDs appear only when relevant and fade out otherwise — a health bar that only shows up in combat keeps the frame clean without losing the information when it counts.

## Choose where each element lives

A reliable way to decide how to present any given piece of information is to ask two questions: does it exist in the game's fiction, and does it occupy physical space in the world? The combination gives four categories — a framework that originates from Fagerholt and Lorentzon's _Beyond the HUD_ research and is now standard vocabulary in the field:

- **Diegetic** — exists in the world and the character can perceive it (ammo counts printed on a gun model, Isaac's spine-mounted health meter in _Dead Space_). Maximizes immersion, costs flexibility.
- **Non-diegetic** — a screen overlay the character can't see, only the player can (health bars, minimaps, pause menus). Maximizes clarity and is cheapest to iterate on.
- **Spatial** — rendered in world space but invisible to the character, like a waypoint arrow or an enemy nameplate. Directs attention without cluttering the screen edges.
- **Meta** — represents character state through an effect the player perceives with no literal in-world object, like screen edges reddening at low health. Reinforces feeling without adding a widget.

Well-regarded UIs usually mix all four deliberately instead of committing to one philosophy: lean on diegetic and spatial elements where immersion matters most, and fall back to non-diegetic for anything that must stay legible regardless of camera angle or world state — timers, score, critical warnings.

## Make it feel good: game feel and juice

Even a mechanically sound interface can feel dead if actions don't register. Steve Swink's concept of "game feel" splits this into three pillars: real-time control (how responsive input is), simulated space (how the world reacts to and communicates with the player), and polish (the audiovisual layer over both). Apply all three to UI too — buttons should respond within a frame or two, focused elements should visibly react, and confirmed actions need unmistakable feedback. A well-executed parry in _Dark Souls_ reads as successful through animation, sound, and a beat of hit-stop together, not through a number quietly changing in a corner.

"Juice" is the deliberate amplification of that feedback — more sensory response than is mechanically necessary, because it makes the moment feel significant. Techniques worth having in the toolkit:

- **Squash and stretch** on anything that moves or gets hit — from Disney's twelve principles of animation, and the single highest-value trick for making elements feel physical rather than static.
- **Real easing curves on every tween** instead of linear motion or instant jumps: ease-out for things entering or growing, ease-in for things leaving or shrinking.
- **Hit-stop / freeze-frames** — a brief pause (roughly 50–150ms) on impactful moments before continuing. Reads as weight and impact for very little implementation cost.
- **Screen shake and camera kick**, scaled to the size of the event and used sparingly, not applied uniformly to every action.
- **Particles** on state changes — even a few pixels of dust or sparks sell an action as "landing."
- **Sound on every meaningful state change.** Confirmations, errors, and rewards each need distinct audio; sound often registers faster than sight.

The rule that governs all of it: juice is never load-bearing. A player who mutes audio, disables screen shake, or turns on reduced motion should be able to play identically to one who doesn't. Build every juice effect as an optional layer on top of a UI that already fully works without it — good practice, and also an accessibility requirement.

## Teach through play, not paragraphs

Players don't read manuals, and long tutorial text gets skipped or forgotten. The strongest pattern, often called "level zero," puts the player in a low-stakes situation that can only be resolved by performing the action being taught, then surfaces a short, contextual prompt exactly when it's relevant — not before.

- Teach one mechanic at a time, at the moment it first matters, rather than everything up front.
- Prefer contextual tooltips and highlighted interactive elements over a separate "how to play" screen.
- Tie a tooltip's dismissal to the player completing the action, never to a timer — a hint that vanishes before it's used teaches nothing.
- Layer complexity: simple systems get a sentence; deep systems (crafting trees, stat allocation) deserve an optional deeper explanation the player can seek out, not one forced on everyone.
- Let players skip or revisit tutorials on demand. Forcing a returning or experienced player through the same onboarding every session breeds resentment fast.

## Accessibility is a baseline, not a feature

Roughly a third of players have some disability that affects how they interact with games, and accessible choices consistently improve things for everyone else too — bigger touch targets and higher contrast help everyone, the same way a curb cut helps wheelchairs, strollers, and delivery carts alike. The four most commonly requested fixes, in rough order of impact, are remappable controls, adjustable text size, colorblind-safe visuals, and readable subtitle/caption presentation. Build for these from day one; retrofitting them later costs far more.

- Never convey required information through color alone — pair it with an icon, shape, pattern, or label.
- Make every interactive element reachable through the same single input method as the rest of gameplay (don't require a mouse for one menu and a controller for everything else).
- Let players remap controls and adjust input sensitivity.
- Distinguish subtitles (dialogue only) from captions (all meaningful sound, including effects and music cues), and support full captioning, with a direction indicator for important off-screen sound where relevant.
- Let text size, contrast, and subtitle background opacity be adjusted independently of other settings.
- Provide a reduced-motion / reduced-flash toggle that kills screen shake, camera kick, and strobing — this also protects photosensitive and vestibular-sensitive players.
- Avoid making tight timing the _only_ path to success; offer a way to slow down, retry, or bypass it.

## Numbers worth using directly

Where a spec already exists, use it instead of guessing:

- **Touch targets:** minimum 44×44pt (iOS) or 48×48dp (Material), with at least 8dp between adjacent targets. Pad the invisible tap area past the visible icon rather than shrinking the icon to fit a small hitbox.
- **Contrast:** at least 4.5:1 for body text under ~18pt, 3:1 for larger text and for meaningful non-text elements (icon outlines, focus rings) — the WCAG 2.1 floor, and a reasonable one even outside formal compliance work.
- **TV / "10-foot" text:** treat 28px at 1080p as a floor, not a target, since players sit 8–12 feet away; err larger. Keep controller-driven menus shallow — aim to reach any screen within about six inputs from the home screen.
- **Safe areas:** keep essential UI (HUD, subtitles, anything the player must read) inside roughly the center 90% of the frame so it survives overscan, notches, and varying aspect ratios; only decorative background should bleed to the true edge.
- **Motion timing:** 150–300ms reads as responsive without feeling sluggish for most UI transitions; go shorter for frequent micro-interactions (button presses), longer only for full-screen transitions.
- **Thumb zones on mobile:** frequent actions belong in the lower two-thirds of the screen, reachable by a thumb during one-handed play; keep rare or destructive actions (delete save, quit) further away so they aren't hit by accident.

## Core components, at a glance

- **HUD** — the least amount of always-visible information that a decision in the next few seconds depends on. Everything else moves to a menu or becomes conditional.
- **Menus and settings** — group by mental model (Video / Audio / Controls / Accessibility / Gameplay), not by implementation detail. Give accessibility its own clearly labeled section and never gate it behind in-game progress.
- **Inventory / crafting** — favor recognition over recall: pair icons with names rather than codes the player has to memorize, and add sorting or filtering as soon as a list can exceed roughly a dozen items.
- **Dialogue / narrative UI** — keep line lengths readable at a comfortable pace at the platform's default text size, and always give players a way to review missed lines, since real-time dialogue is easy to miss mid-action.
- **Notifications / toasts** — queue rather than stack simultaneous notifications, and never let a low-priority one (loot pickup) visually compete with a high-priority one (low-health warning).
- **Pause / loading screens** — treat pause as a fully accessible, safe menu no matter how chaotic the moment it interrupted was; use loading screens to surface useful context (control reminders, next objective) instead of a blank bar.

## Stay consistent, and always answer the input

Every interactive element needs a visibly distinct default, focused/hovered, pressed, and disabled state — a button that looks identical whether or not it's usable is a constant source of confusion. Once an icon, color, or term means something, it has to mean the same thing everywhere in the game; don't call something a "Quest" on one screen and a "Mission" on another. Every input — click, tap, button press — deserves a reaction within a frame or two, even if the real result takes longer to compute; a brief acknowledgment (a highlight, a sound, a state change) confirms the input registered and heads off frantic re-input.

This consistency has to hold up across languages too if the game will be localized: give text containers slack for expansion (German and Finnish routinely run 30–40% longer than English for the same meaning), plan for right-to-left mirroring if Arabic or Hebrew are in scope, and keep text out of baked images or icons so it can actually be translated.

## Common mistakes worth designing against

- Displaying everything the system tracks, all the time, instead of only what's relevant right now.
- Desktop- or controller-first layouts "shrunk" onto touch afterward instead of designed for thumbs and small screens from the start.
- Tutorials that explain everything up front in text instead of teaching through a guided first action.
- Accessibility treated as a post-launch patch instead of a day-one requirement.
- Screen shake, flashing, or other juice with no way to turn it down or off.
- Inconsistent iconography or terminology that forces players to relearn the interface on every new screen.
- Critical state — health, danger, time pressure — communicated by color alone.
- Dark patterns: placing monetization prompts where accidental taps are likely, or disguising ads as UI. It buys short-term revenue at the cost of trust, and should never be the unexamined default.

## Before you ship: a fast pass

Can the player tell what's most important at a glance? Does everything clickable look clickable, and everything disabled look disabled? Does the game still work with sound off, motion effects off, and default color vision? Can every screen be reached with a single input method? Is there a way to skip or revisit onboarding? Would the layout survive the smallest supported screen and the largest?

## Where this comes from

This draws on some of the field's most cited references, worth going straight to for more depth: Steve Swink's _Game Feel_; Martin Jonasson and Petri Purho's GDC talk _Juice it or Lose it_, and Jan Willem Nijman's _The Art of Screenshake_; Fagerholt and Lorentzon's _Beyond the HUD_ thesis (the source of the diegetic/non-diegetic/spatial/meta framework); Disney's twelve principles of animation (Thomas & Johnston); gameaccessibilityguidelines.com and Microsoft's Xbox Accessibility Guidelines; and WCAG 2.1, Apple's Human Interface Guidelines, and Google's Material Design for the concrete numbers above.
