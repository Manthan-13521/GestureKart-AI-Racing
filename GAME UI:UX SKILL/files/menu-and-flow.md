# Menus, Screens, and Flow

Everything in a racing game that isn't the HUD lives here. Players spend real time in these screens — a garage or car-select screen often gets studied far more carefully than any single HUD element, so it earns more visual patience and detail than the HUD does.

## Contents

- Navigation conventions (read this first — it applies to every screen below)
- Title and main menu
- Garage and car select
- Customization: livery, upgrades, tuning
- Track and event select
- Pre-race, lobby, and matchmaking
- Loading screens
- Pause menu
- Results, rewards, and post-race flow
- Leaderboards, crews, and clubs
- Onboarding and tutorials

## Navigation conventions (read this first)

Get this wrong and every screen below feels worse, no matter how well each one is designed individually:

- **Pick one confirm action and one back/cancel action, and use them identically in every menu in the game.** This is the single most common complaint in racing-menu player feedback — a button that confirms in one screen and does something else in another breaks the muscle memory the player built up in the previous nine screens.
- **A paused race resumes on the very first button press**, with "Resume" pre-selected at the top of the pause list. Resuming is by a wide margin the most common pause-menu action; make it the zero-effort default, not something to navigate to.
- **Group related options together and label the group**, rather than presenting one long undifferentiated list. A player looking for "how do I turn down music volume" should be able to jump straight to an Audio group, not scan every setting in the game.
- **Support every input method the platform supports**, and make sure focus/selection state is always visually obvious — a gamepad player needs to see which element has focus at all times, since there's no cursor to imply it the way a mouse does.
- **Design for a controller-first flow even on platforms that also support a mouse.** A menu that only works by precise cursor clicking will fight a gamepad or remote player at every screen.

## Title and main menu

The title screen is the first brand impression and should get out of the way quickly — a "press to start" or auto-advance after a few seconds, not a mandatory sit-through. The main menu is the hub every session returns to; treat it as a small number of clearly differentiated destinations (Play/Career, Garage, Multiplayer, Settings — adjust to the game) rather than a dense grid of every feature in the game. If the game has live-service elements (daily challenges, a season pass, a shop), give them their own clearly-labeled entry point rather than surfacing their promotional art on the primary hub — mixing "here's how you start racing" with "here's what we want you to buy" in the same visual space undercuts both.

## Garage and car select

This is a showcase screen as much as a functional one — players in this genre frequently spend more time here, per session, than in any single HUD interaction, so it's worth real visual craft.

- **Let the player see the car properly.** A 3D turntable or a large, well-lit hero shot beats a thumbnail grid for the _currently selected_ car; a denser grid is fine for browsing/comparing the rest of the collection.
- **Surface the stats that actually differentiate cars** — top speed, acceleration, handling, weight class, whatever the game's physics model actually varies — as a compact visual comparison (bars, a radar/spider chart, or a simple numeric table), not a wall of numbers. The player is trying to answer "is this car right for this race," not audit a spec sheet.
- **Blanked-out or silhouetted slots for uncollected cars** create anticipation and make progression legible at a glance — the player can see the shape of what's left to unlock without it being spoiled or, conversely, without pretending the collection is smaller than it is.
- **Class/tier grouping** (by speed class, price, or category) helps once the collection is larger than a dozen or so cars; a flat list stops scaling quickly.
- Keep the **"select and go race" path short.** However much depth the garage has, the player who already knows what they want should be able to get from "open garage" to "on the grid" in a couple of steps, not a forced tour through every tab.

## Customization: livery, upgrades, tuning

Split by what's being changed, since they're different mental modes for the player:

- **Visual customization (livery, paint, decals, body kits, vanity items):** self-expression, browsed leisurely, benefits from a large real-time preview since the payoff _is_ the look.
- **Performance upgrades (engine, drivetrain, aero, tires):** a build/optimization puzzle. Show the stat delta of every choice immediately and concretely (+12 top speed, not a vague "better"), and if upgrades cost currency, show affordability state at a glance rather than making the player discover a purchase failure after selecting.
- **Fine tuning (gear ratios, suspension, ride height, differential):** sim-only territory almost always. Its audience wants precision — sliders with visible numeric values and sensible min/max ranges, not abstracted "low/medium/high" presets, though offering presets _alongside_ the sliders is a reasonable on-ramp for less experienced players.

## Track and event select

Show enough about a track or event before commitment that the player is making an informed choice: track layout (even a simplified outline), length, surface/weather if it varies, and what's required to enter (car class restrictions, cost, difficulty). An open-world game layering events onto a explorable map should let the player preview an event from the map itself rather than forcing a menu detour to find out what an icon means.

## Pre-race, lobby, and matchmaking

For multiplayer or grid-based starts: show who else is racing (name, car, sometimes a skill/rank indicator), confirm the track and rules are what the player expects, and give a clear ready-up state so nobody is confused about why the race hasn't started. Matchmaking screens should communicate that _something is happening_ (estimated wait, a visible search state) rather than a static screen the player can't tell is working.

## Loading screens

Loading is dead time — spend it. Common, effective uses: gameplay tips (genuinely useful ones, rotated, not the same three repeated every load), car or track art that reinforces the upcoming race, or a progress indicator if load times are long enough that its absence would read as a hang. Avoid tips that are really just upsell prompts dressed as advice.

## Pause menu

Deliberately small: Resume (pre-selected, top of list), Restart, Settings, and Quit/Exit cover the overwhelming majority of what a player wants mid-race. Anything bigger than this belongs in a full menu, not a pause overlay. See the navigation conventions above for why Resume needs to be the effortless default.

## Results, rewards, and post-race flow

This is a sequence, not a single screen, and shipped racing games converge on roughly this order:

1. **Immediate result** — did you finish, what position, was it a personal best. This is the emotional payoff and should land fast, not after several loading beats.
2. **Detailed standings/splits** — full finishing order, lap/sector times, sometimes a replay or highlight.
3. **Rewards and progression** — currency, XP, unlocks earned from this specific result, shown as a clear consequence of what just happened, not a generic screen unrelated to the race just run.
4. **Leaderboards** — how this result compares to friends, rivals, or the wider player base, if the game has this system.
5. **Post-race menu** — the offramp back into the main loop: rematch, next event, return to garage/menu.

Keep this sequence skippable for a player who just wants back into the action — a "skip" or "hold to skip" affordance on each beat respects players who've seen it a hundred times, without removing the payoff for players seeing it the first time.

## Leaderboards, crews, and clubs

Most racing games with any social layer add some version of a group identity — crews, clubs, teams — alongside individual leaderboards. Functionally these are a scoped leaderboard (compare within a group, not the whole player base) plus a lightweight roster/chat/invite surface. Keep this visually and structurally separate from the core race loop (garage → track → race) so it reads as an optional social layer, not a gate in front of racing.

## Onboarding and tutorials

Racing games teach mechanical skill (throttle/brake feel, drifting, drafting) better through guided practice than through text. The pattern that holds up across genres:

- **Progressive:** introduce one mechanic at a time, in the context where it's actually used, not a wall of rules before the first race.
- **Interactive:** have the player actually brake into the corner or trigger the boost, rather than reading a description of it.
- **Skippable:** an experienced player should be able to bypass the tutorial entirely without being penalized for it.
- **Revisitable:** keep a controls/mechanics reference reachable from the pause or settings menu, so a player who forgets how drifting works three hours in isn't stuck relearning by trial and error.

For a new player's very first race specifically, consider a simplified "training wheels" HUD or assist state (steering/braking assist, simplified controls) with a visible, easy path to turn it off once they're comfortable — this mirrors the mobile-touch "simplified vs. manual" control pattern covered in `genre-playbook.md`, and works just as well on gamepad.
