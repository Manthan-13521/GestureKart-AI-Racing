# F1-Style Racing Game — Build Prompt + UI/UX Skill

> Note: To stay clear of trademark/IP issues, this uses an original fictional
> racing league ("Apex Grand Prix") instead of real F1 team names, liveries,
> logos, or driver likenesses. Swap in your own branding freely — the
> structure, physics, and UI/UX principles below are what actually matter for
> the game to feel like top-tier open-wheel racing.

---

## 1. The prompt (paste this into your coding agent)

```
Build a browser-based open-wheel racing game called "Apex Grand Prix" using
Three.js + JavaScript (or React Three Fiber if the project is React-based).
The game should capture the feel of top-tier Formula-style racing: high-speed
circuits, precise car handling, and a broadcast-quality UI.

### Core gameplay
- Single-player race against 10-19 AI opponents on a closed circuit.
- Open-wheel car physics: acceleration, braking, tire grip, drafting
  (slipstream) behind other cars, and basic tire wear affecting grip over a
  race distance.
- A DRS-style "overtake assist" zone on the main straight that reduces drag
  when within a set distance of the car ahead.
- Damage/collision penalties (spin-out or time loss) for wall contact.
- Pit lane with a pit-stop sequence (enter, stop in box, tire change timer,
  exit) that costs real race time.
- Lap timing: current lap, best lap, sector splits (S1/S2/S3), delta to
  personal best shown live.
- Start sequence: formation lap optional, then a 5-light start sequence
  (lights out = green).
- Weather variant (optional stretch goal): light rain reduces grip and adds
  a visual effect + spray behind cars.

### Track
- One original circuit, ~4-6km, with a mix of high-speed straights,
  chicanes, and at least one hairpin — inspired by real F1 track archetypes
  (street circuit energy + permanent-circuit flow) but an original layout.
- Track boundaries with run-off areas, curbs (rumble strips), and a pit
  lane branching off the main straight.
- Track-side elements: grandstands, sponsor boards (fictional brands),
  marshal posts, start/finish gantry.

### Cars
- Original open-wheel car model (or low-poly placeholder if a full model
  isn't feasible yet): low profile, large rear wing, exposed wheels.
- 3-4 fictional "teams" with distinct original livery colors/numbers.
- Camera modes: cockpit (with visible wheel/halo), chase cam, TV broadcast
  cam (cinematic, cuts between cars), and a top-down for replays.

### UI/UX (this is the priority — see the skill section below for detail)
- Main menu → Team/Car select → Track select → Race settings → Race.
- In-race HUD: speed, gear, mini-map with car blips, position (P1-P20),
  current lap/total laps, live delta, tire wear indicator, DRS indicator,
  mirrors or rear proximity warning.
- Pause menu, results/standings screen after the race with sector analysis.
- Responsive: playable with keyboard, gamepad, and on-screen touch controls
  on mobile (steering via tilt or touch zones).

### Tech/structure
- Clean separation: /engine (physics, input), /render (Three.js scene,
  camera), /ui (HUD, menus — ideally a separate DOM/React layer over the
  WebGL canvas so text stays crisp), /data (track definition, car specs).
- 60fps target on a mid-range laptop; use instancing for spectators/props.
- Build in phases and check in after each:
  1. Empty track + one drivable car + basic camera
  2. Lap timing + AI ghost/opponent cars (even as simple waypoint-followers)
  3. Full HUD overlay
  4. Menus + race flow (start lights → race → results)
  5. Polish: pit stops, DRS, damage, weather (stretch)

Ask me clarifying questions before starting if the tech stack, target
platform (desktop/mobile/both), or scope (arcade vs. semi-sim) is unclear.
```

Swap the tech stack line if you're targeting Unity (C#) or Godot instead of
web — the rest of the spec (track, car, UI/UX, phased build order) carries
over unchanged.

---

## 2. UI/UX skill: designing HUDs and menus for racing games

Reusable principles for this game or any similar high-speed racing project.

### Core constraint: the player is looking at the track, not the UI

Everything in-race has to be readable in peripheral vision at 200+ km/h.

- Put critical info (speed, gear, position) in a fixed HUD zone the eye can
  glance at without hunting — usually bottom-center or bottom-right for
  speed/gear, top-center or top-left for position/lap.
- Never require the player to read more than 2-3 words or 1-2 numbers to
  get an update. Use icons and color over text wherever possible.
- Anything that changes every frame (speed, RPM) should use large,
  high-contrast, low-detail numerals — a technical/monospace font reads
  faster than a decorative one at a glance.

### Color coding, consistently

- Reserve one color for "you're doing well" (grip/tires green), one for
  "warning" (amber — tire wear, fuel, DRS available), one for "critical"
  (red — damage, off-track, last lap). Don't reuse these hues for anything
  else in the UI or they stop meaning anything.
- Team/livery colors identify cars on the mini-map and in the standings
  list — keep at least 3:1 contrast between any two teams' colors so they
  aren't confused in the heat of a race.

### Motion and feedback

- Every player action needs immediate feedback: gear change flashes the
  gear indicator, DRS activation changes the DRS icon state instantly (no
  more than ~100ms delay), overtakes trigger a brief position-change
  animation so the player notices without reading numbers.
- Screen-space effects (motion blur, speed lines, camera shake on impact)
  should scale with speed/impact force, not be constant — constant effects
  just become visual noise the player tunes out.
- Avoid UI elements that move/resize/pulse continuously without reason;
  reserve animation for state changes so it stays meaningful.

### Menu flow — keep it shallow and fast

- Racing games are replayed constantly, so minimize clicks between "I want
  to race" and "I'm racing." Ideal flow: Main Menu → Quick Race (1 click)
  as a shortcut, with the full Team/Track/Settings path available for
  players who want to customize.
- Use large, glove-friendly (or thumb-friendly on mobile) tap targets —
  racing games are often played with a controller or touch, not a mouse.
- Show a live 3D preview of the selected car/track behind menus — it's
  both aesthetically stronger and communicates the choice better than
  static thumbnails.

### Data density without clutter

- Post-race screens (standings, sector times, lap chart) can be dense —
  that's expected and desired here, this is the moment players _want_ to
  read details. Use tables/graphs, not prose.
- In-race, invert that: minimum viable data only. A toggle for "detailed
  HUD" vs "minimal HUD" serves both casual and hardcore players.

### Accessibility (don't treat as optional)

- Colorblind-safe palettes for position/tire/DRS indicators (test
  red/green combos specifically — the most common form).
- Fully remappable controls, and support for both analog (gamepad/wheel)
  and digital (keyboard) input with separate sensitivity curves.
- Subtitle/caption support for any spoken race engineer audio.
- Adjustable HUD scale for readability on both phone screens and TVs.

### Audio-visual pairing

- Pair every major HUD state change with a short, distinct sound (DRS
  activation, lap complete, final lap warning, position gained/lost) —
  players react faster to audio cues than visual ones while focused on
  the track.
- Engine audio pitch should track RPM directly; it's a secondary
  speedometer players use unconsciously.

### Quick checklist before shipping a racing HUD

- [ ] Can a new player identify their position, speed, and lap in under
      half a second?
- [ ] Do all critical warnings (damage, off-track, tire critical) use the
      same red across every screen?
- [ ] Does every menu path back to "start racing" take 3 clicks or fewer?
- [ ] Is there a minimal-HUD mode?
- [ ] Are controls fully remappable, with a colorblind-safe mode?
