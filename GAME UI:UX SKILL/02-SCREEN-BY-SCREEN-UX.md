# 02-SCREEN-BY-SCREEN-UX.md

**Virtual Steering — P15 Screen-Level UX Specification**  
Every player-facing screen, behavior, and priority. MUST/SHOULD/OPTIONAL separation.

**Priority Scale:** P0 = first to implement, P1 = high value, P2 = polish.

---

## 1. SPLASH

- **Purpose:** Instant brand statement while assets warm up.
- **Primary user goal:** Feel the identity in <1s; reach menu fast.
- **Information hierarchy:** Logo (1) → tagline (2) → progress ring (3).
- **Layout:** Centered logo + progress ring + "tap/click to continue" affordance. Ambient background (aurora/grid) active.
- **Main visual treatment:** Orbitron wordmark "VIRTUAL STEERING" with cyan-to-green gradient text, logo `blur-in` entrance (700ms, first-run only).
- **Navigation:** No nav — click/tap/Enter advances to Main Menu. Auto-advance after asset preload if no interaction.
- **Primary CTA:** None (implicit — tap/click/Enter).
- **Secondary actions:** None.
- **States:** Loading (progress ring animates), ready (ring full → pulse), error (retry text if font/asset load fails).
- **Motion:** Logo blur-in (700ms), progress arc draw (600ms), ready pulse (spring). Skip if reduced motion.
- **Micro-interactions:** Press-to-skip (visible hint after 1.5s).
- **Responsive:** Logo scales via clamp; centered both orientations; safe-area aware.
- **Accessibility:** Logo as text (not image) with `aria-hidden` ambient; progress ring is `role="progressbar"`.
- **Performance:** No Three.js; CSS/SVG only; total < 50ms JS.
- **MUST remain intact:** NavigationSystem advance, asset preload hooks.
- **Priority:** P1.

**MUST HAVE:** Brand logo + progress + advance. **SHOULD HAVE:** press-to-skip, ambient background. **OPTIONAL:** tagline animation, sound-on-tap.

---

## 2. MAIN MENU

- **Purpose:** Identity + single clear path into the game.
- **Primary user goal:** Click **Race** and go. Glance at level/currency.
- **Information hierarchy:** Hero car (1) → Title (2) → Profile strip (3) → Action cards (4) → Footer note (5).
- **Layout (desktop):** Three.js hero car left (~55%), glass action-card stack right (~45%). Profile strip spans bottom.
- **Layout (mobile ≤600px):** Stacked: Hero car (40vh) → profile strip (collapsible) → vertical action cards (scroll).
- **Main visual treatment:** Hero car on showroom HDRI stage, slow Y-rotation (20s), racing-line SVG draws through cards.
- **Navigation:** Forward: Race→Track Select, Garage→Garage, etc. Back: none (root). Escape: nothing.
- **Primary CTA:** **Race** — large, primary (56px), first in tab order.
- **Secondary actions:** Garage, Profile, Leaderboards, Achievements, Settings, How To Play (glass cards).
- **States:** Default, hover (scale 1.015 + sheen), focus (outline), pressed (scale 0.97), disabled (opacity 0.5 — e.g., MP when not ready).
- **Hover/focus/pressed/disabled:** Card sheen sweep 200ms; primary button brighten + glow; focus 2px outline.
- **Motion:** Entrance order: racing line draw (800ms) → car fade (600ms) → title blur-in (700ms) → profile strip (250ms) → action cards staggered (60ms interval, max 8, 280ms each). Cinematic only on first visit.
- **Micro-interactions:** Button ripple; profile strip XP arc draw; card magnetic hover (≤4px).
- **Responsive:** Desktop 55/45 split; tablet 50/50; mobile stacked with 40vh hero.
- **Accessibility:** Logical tab order (nav status → settings → Race → cards); hero car `aria-hidden`; buttons real `<button>`; race CTA announce.
- **Performance:** Hero car lazy-loaded (`import()` on menu enter), <100KB glTF, no shadows, no post-process mobile; paused on reduced motion.
- **MUST remain intact:** ProfileManager reads (level/title/XP/coins), NavigationSystem targets, cam status badge, all existing action wiring.
- **Priority:** **P0.**

**MUST HAVE:** Race primary CTA, hero car, profile strip, all existing actions, staggered entrance. **SHOULD HAVE:** racing-line draw, magnetic hover, title treatment. **OPTIONAL:** camera stage dolly on hover, sound.

---

## 3. TRACK SELECT

- **Purpose:** Make tracks recognizable and desirable.
- **Primary user goal:** Pick a track confidently in 2 seconds.
- **Information hierarchy:** Track map (1) → name + weather/time (2) → best time + difficulty (3) → medal (4).
- **Layout:** Horizontal scroll-snap rail, 280px cards (desktop 320px), 16px gap, peek 113px. Selected card centered.
- **Main visual treatment:** Layered SVG track map (glow→core→highlight), draw-on animation on entrance, per-track accent color, weather/time chips (badge-cyan/badge-gold), medal overlays 🥇🥈🥉.
- **Navigation:** Back button (top-left) → Track Select → Mode Select. Rail scroll: wheel, drag, keyboard arrows, gamepad D-pad.
- **Primary CTA:** Track card selection (Enter/click on card → Mode Select).
- **Secondary actions:** Back, filter pills (by class/weather if applicable), detail modal on info icon.
- **States:** Default, hover (scale 1.05 + glow), selected (border-primary + glow + scale 1.05), disabled (unreleased track = dimmed + lock).
- **Motion:** Cards stagger slide-up (60ms, max 8); selected card scale + border transition (150ms); racing line connects to Mode Select (300ms).
- **Micro-interactions:** Card parallax tilt on hover (subtle, ≤3°); draw-on SVG on first view; medal shimmer.
- **Responsive:** Desktop 3-col grid; tablet 2-col; mobile horizontal rail with peek. No vertical scroll.
- **Accessibility:** Arrow-key rail navigation; focus outline on cards; track name read with weather/time; medals with text label (1st/2nd/3rd).
- **Performance:** SVGs inline (no requests); lazy-render offscreen cards; no images.
- **MUST remain intact:** Track data source (ContentCatalog), best times (SaveManager/ProfileManager), unlock state, weather/time data if real.
- **Priority:** **P0.**

**MUST HAVE:** Track map SVG, name + weather/time chip, best time + difficulty, selection flow, back nav, keyboard/DPad. **SHOULD HAVE:** medals, filter pills, detail modal, draw-on animation. **OPTIONAL:** parallax tilt, per-track accent.

---

## 4. MODE SELECT

- **Purpose:** Clear, grouped choice of game mode.
- **Primary user goal:** Pick mode + difficulty informed by intent.
- **Information hierarchy:** Group header (1) → mode name + icon (2) → 1-line description (3) → badges (difficulty, players, controls).
- **Layout:** Groups: **Solo** / **Multiplayer** / (Training if exists). Cards within groups, 3-col desktop → 1-col mobile.
- **Main visual treatment:** Compartmentalized cards with Phosphor intent icons, difficulty dots (●●○○○), player-count badge, control-method chips (hand/keyboard/touch/gamepad) with availability dimming (not hiding).
- **Navigation:** Back → Track Select; forward → pre-race/garage/game start.
- **Primary CTA:** Selected mode card (Enter/click).
- **Secondary actions:** Difficulty selector (chips), control-method toggle if applicable.
- **States:** Card default/hover/selected/disabled; control chips available (full opacity) vs unavailable (dimmed, still focusable for keyboard users).
- **Motion:** Group headers stagger fade (40ms), cards stagger slide-up (60ms, max 8).
- **Micro-interactions:** Chip selection ring pop; difficulty dots animate on change.
- **Responsive:** Desktop grid, mobile vertical stack with sticky group headers.
- **Accessibility:** Chips focusable even when dimmed; mode description read aloud; difficulty conveyed by dots + text ("Medium") not dots alone.
- **Performance:** No heavy assets; icons inline SVG.
- **MUST remain intact:** All mode configuration (game mode config), control-method availability logic, difficulty application, NavigationSystem flow.
- **Priority:** **P0.**

**MUST HAVE:** Grouped cards, descriptions, difficulty + control badges, availability sync. **SHOULD HAVE:** intent icons, dimmed (not hidden) unavailable controls. **OPTIONAL:** difficulty quick-set from card.

---

## 5. GARAGE

- **Purpose:** Showcase the player's car; premium cosmetic presentation.
- **Primary user goal:** Equip/switch cosmetics; feel ownership.
- **Information hierarchy:** Car (1) → category tabs (2) → selected item (3) → spec bars (4).
- **Layout:** Desktop 70/30 split: Three.js car preview (70%) + glass sidebar (30%). Mobile: tabs (Preview / Cosmetics / Specs).
- **Main visual treatment:** Car model with showroom HDRI, camera stages (Exterior→Rear→Interior→Detail), smooth dolly (600ms), emissive neon accents. Cosmetics as thumbnail cards.
- **Navigation:** Back → Main Menu; category tabs (Skins / Neons / Wheels); cosmetic grid.
- **Primary CTA:** **Equip** button on selected item.
- **Secondary actions:** Preview (temporary apply), camera stage toggle, Reset defaults.
- **States:** Item cards default/hover/selected/equipped (check badge); tabs active/inactive; car stage indicator.
- **Motion:** Car fade-in on load (400ms), camera dolly (600ms ease-out), spec bars animate width (80ms stagger), sidebar slide-in-right (200ms).
- **Micro-interactions:** Thumbnail hover glow; equip button ripple + equip confirmation toast.
- **Responsive:** Desktop 70/30; tablet 60/40; mobile tabs with 40vh preview.
- **Accessibility:** Car `aria-hidden`; category tabs real tablist; item names + equipped state in accessible name; keyboard grid nav.
- **Performance:** Reuse hero car model (single GLTF load cache); no shadows; no post-process mobile; pause rotation reduced-motion.
- **MUST remain intact:** Cosmetic data model, equip/unequip persistence (SaveManager), ProfileManager cosmetic ownership, camera controls.
- **Priority:** P1 (after P0 screens).

**MUST HAVE:** Car preview + category tabs + item grid + Equip + persistence. **SHOULD HAVE:** camera stages, spec bars, equipped badge. **OPTIONAL:** Interior/Detail stages, cosmetic preview on car live.

---

## 6. PROFILE

- **Purpose:** Show progression as a collection worth having.
- **Primary user goal:** See level, XP progress, stats, titles, records.
- **Information hierarchy:** XP arc + level + title (1) → stat counters (2) → title progression (3) → records (4) → achievement summary (5).
- **Layout:** Desktop 2-col (hero left, stats right). Mobile single column, collapsible sections.
- **Main visual treatment:** Large ProgressArc XP ring, animated stat count-up, vertical title-progression timeline (current tier glows), timing-tower records mini-table.
- **Navigation:** Back → Main Menu; section links to Leaderboard/Achievements.
- **Primary CTA:** None strong — primary action is navigating to Records/Achievements.
- **Secondary actions:** View Records, View Achievements, Reset profile (confirm modal).
- **States:** XP arc draw; stat counters count-up; title timeline current glowing, locked dimmed; records table rows.
- **Motion:** XP arc draw (600ms), stats count-up (1000ms ease-out), title timeline stagger fade (60ms), records stagger slide-up (60ms).
- **Micro-interactions:** Level-up badge pop (spring); record highlight pulse; achievement shimmer.
- **Responsive:** Desktop 2-col; mobile collapsible accordion sections.
- **Accessibility:** XP arc `role="progressbar"` + `aria-valuenow`; counters announced once (not spam); title progression as list; records as table with headers.
- **Performance:** Counters via rAF (not setInterval); no images.
- **MUST remain intact:** ProfileManager data (level/title/XP/stats/records), migration/validation (P8.3), all persistence.
- **Priority:** P1.

**MUST HAVE:** Level/title/XP arc, stat counters, title progression, records, all ProfileManager wiring. **SHOULD HAVE:** achievement summary, collapsible mobile sections. **OPTIONAL:** level-up celebration, share stat card.

---

## 7. LEADERBOARD

- **Purpose:** Competition via timing-tower presentation.
- **Primary user goal:** See where you rank and by how much.
- **Information hierarchy:** Tabs (1) → filters (2) → rank list (3) → player highlight (4).
- **Layout:** Timing-tower style: left rail column — position | player | score | date | gap. Filter pills (track/mode). Current player row highlighted + pulsing subtly.
- **Main visual treatment:** F1-broadcast aesthetic: green gained / red lost, medal chips 🥇🥈🥉, gap column (+36,333), local-only badge ("This device only" — no cloud).
- **Navigation:** Back → Main Menu; tabs (Global / By Track / By Mode); filter pills.
- **Primary CTA:** None — read-and-browse. If applicable: "Race again" button on empty state.
- **Secondary actions:** Refresh, share (visual-only if exists).
- **States:** Loading (skeleton rows), loaded, empty ("No times set" + ghost car illustration), rank changed (slide + flash).
- **Motion:** Rows stagger slide-up (40ms), player highlight pulse (loop), rank changes slide + color flash (900ms spring).
- **Micro-interactions:** Row hover brighten; medal shimmer; gap color on change.
- **Responsive:** Desktop table + sidebar; mobile horizontal scroll table with sticky # column.
- **Accessibility:** Table semantics (thead/tbody, th scope); medals + text; gain/loss with arrows + labels (not color only); live region for rank changes.
- **Performance:** Paginate/virtualize if >100 rows; no heavy assets.
- **MUST remain intact:** Local leaderboard data source, current-player detection, filter logic, empty state data.
- **Priority:** P1.

**MUST HAVE:** Timing-tower rows, player highlight, tabs, filters, empty state. **SHOULD HAVE:** gain/loss animation, gap column, medal chips, sticky # on mobile. **OPTIONAL:** refresh animation, share.

---

## 8. ACHIEVEMENTS

- **Purpose:** Collection fantasy — every unlock worth showing.
- **Primary user goal:** See what's unlocked, what's next, what's rare.
- **Information hierarchy:** Category tabs (1) → cards (2) → completion ring (3).
- **Layout:** Tabs (Progression / Collection / Mastery) + responsive grid (3-col desktop → 1-col mobile).
- **Main visual treatment:** Collectible cards. Locked = dimmed + 🔒 + progress bar. Unlocked = accent-primary border + shimmer on hover. **Mastery** (data-driven: `category === 'mastery' && progress.target >= 50`) = gold glow + ⭐⭐⭐.
- **Navigation:** Back → Main Menu; category tabs.
- **Primary CTA:** None — browse/collect.
- **Secondary actions:** (Optional) "View all", search/filter.
- **States:** Locked, unlocked, mastery, newly-unlocked (pop + shimmer + XP arc increment).
- **Motion:** Cards stagger scale-in (50ms), unlocked shimmer sweep (300ms delayed), unlock pop (spring 800ms), completion ring arc draw.
- **Micro-interactions:** Hover glow; rarity glow only for mastery (data-driven); XP arc increment on unlock.
- **Responsive:** Desktop 3-col, tablet 2-col, mobile 1-col with larger cards.
- **Accessibility:** Card name + description + progress in accessible name; rarity stars + text ("MASTERY") not color only; progress as `role="progressbar"`.
- **Performance:** No images; CSS/SVG only; data-driven rarity (no hardcoded glows).
- **MUST remain intact:** Achievement definitions, unlock/progress logic, XP rewards, category data.
- **Priority:** P1.

**MUST HAVE:** Category tabs, lock/unlock/mastery states, progress bars, data-driven rarity glow. **SHOULD HAVE:** completion ring, unlock animation, XP arc sync. **OPTIONAL:** search/filter, achievement preview modal.

---

## 9. HOW TO PLAY

- **Purpose:** Teach all input methods without a manual.
- **Primary user goal:** Learn controls for their device in under a minute.
- **Information hierarchy:** Method tabs (1) → demo area (2) → steps (3).
- **Layout:** Tabs: Hand / Keyboard / Touch / Gyro / Phone (if exists) / Gamepad / Accessibility. Demo area per tab (interactive placeholder), steps list.
- **Main visual treatment:** Clean glass panel, method icons, animated control glyphs. Interactive demo area with placeholder for gesture demos (visual-only enhancement; gameplay unaffected).
- **Navigation:** Back → Main Menu; tab switching.
- **Primary CTA:** "Start Racing" (jumps to Track Select) if exists.
- **Secondary actions:** Search/filter, previous/next step.
- **States:** Tab active/inactive; demo playing/paused (visual placeholder).
- **Motion:** Tab switch cross-fade (200ms), step content stagger (40ms).
- **Micro-interactions:** Demo glyph pulse when step references it; tab indicator slide.
- **Responsive:** Desktop grid; mobile stacked tabs → vertical list.
- **Accessibility:** Keyboard nav through tabs + steps; demo content `aria-hidden` if decorative; text alternatives for gestures.
- **Performance:** No heavy assets; no autoplay video.
- **MUST remain intact:** All control-method content and data.
- **Priority:** P2.

**MUST HAVE:** Tabs per method, step content, back nav. **SHOULD HAVE:** control glyphs, search, "Start Racing" CTA. **OPTIONAL:** interactive demo animations, gesture visualizer.

---

## 10. SETTINGS

- **Purpose:** Full control over graphics, audio, controls, accessibility, gameplay.
- **Primary user goal:** Adjust settings; see effect instantly.
- **Information hierarchy:** Group tabs (1) → grouped panels (2) → rows (3) → live preview (4).
- **Layout:** Left tab bar (Graphics / Audio / Controls / Accessibility / Gameplay) + right glass panel. Mobile: accordion tabs.
- **Main visual treatment:** Glass panels with grouped rows; live preview panel (Three.js quality changes apply immediately); instant-apply toggles.
- **Navigation:** Back → Main Menu; tab switching.
- **Primary CTA:** None (instant apply) — or "Apply" only for complex settings.
- **Secondary actions:** Reset to defaults (confirm modal), colorblind/high-contrast/large-HUD/reduced-motion toggles.
- **States:** Rows with toggles/sliders/dropdowns; unsaved-changes indicator if applicable; reset confirm modal.
- **Motion:** Panel cross-fade (200ms), slider thumb ease-out, toggle knob slide (120ms).
- **Micro-interactions:** Toggle on = accent-primary; slider value pop; live preview updates.
- **Responsive:** Desktop 2-col (tabs + panel); mobile accordion.
- **Accessibility:** All toggles `<button aria-pressed>` or real checkbox; sliders `role="slider"` + arrow-key support; labels for all; high-contrast mode affects this screen itself.
- **Performance:** Settings apply without re-mounting game; debounced sliders.
- **MUST remain intact:** All settings storage (SaveManager), quality tier system, audio system, input remap if exists, ThemeManager integration.
- **Priority:** P2.

**MUST HAVE:** Grouped tabs, all existing settings preserved, instant apply, reset confirm. **SHOULD HAVE:** live preview, high-contrast/colorblind/large-HUD toggles. **OPTIONAL:** per-setting tooltips, accessibility quick-actions.

---

## 11. MATCHMAKING / MULTIPLAYER

- **Purpose:** Enter multiplayer (PeerJS/WebRTC) with clear state.
- **Primary user goal:** Join/create a session; understand connection state.
- **Information hierarchy:** Status card (1) → room/ID (2) → peers (3) → start.
- **Layout:** Centered status card: "Searching…" spinner → "Connected" → peer list → Start Race. Glass card + ambient bg.
- **Main visual treatment:** Connection state ring (searching = cyan pulse, connected = green, error = red), peer avatars, room code.
- **Navigation:** Back → Mode Select; Cancel at any state.
- **Primary CTA:** **Start Race** (enabled when peers ready) or **Create Room** / **Join Room**.
- **Secondary actions:** Copy room code, cancel matchmaking, toggle ready.
- **States:** Idle, searching, connecting, connected, ready, error/disconnected (retry).
- **Motion:** State ring transitions (280ms), peer join pop (spring), ready state pulse.
- **Micro-interactions:** Copy-code toast; avatar hover.
- **Responsive:** Desktop centered card; mobile full-width with safe-area.
- **Accessibility:** Status changes via `aria-live`; cancel always reachable (keyboard); room code announced.
- **Performance:** No extra rendering; state-driven UI only.
- **MUST remain intact:** PeerJS connection lifecycle, host/guest roles, room code generation, race start gating (host authority), disconnect handling, RaceResultGate.
- **Priority:** P2 (only restyle; functionality exists and must not change).

**MUST HAVE:** State card, create/join/copy/cancel, start gating, error/retry. **SHOULD HAVE:** state ring animation, ready toggles, peer avatars. **OPTIONAL:** matchmaking timer, queue estimate.

---

## 12. RACE HUD

- **Purpose:** Glanceable, edge-anchored critical data during race.
- **Primary user goal:** Know position, speed, lap, time, boost, combo at a glance without occluding the track.
- **Information hierarchy (priority order):** Speed (1) → Race position (2) → RPM/gear/shift lights (3) → throttle/brake (4) → lap timer + lap info (5) → boost/combo/AI (6).
- **Layout:** Edge clusters — Position top-left, Time/Score top-right, Speed bottom-right (above accel on touch), Gear + shift near speed, AI HUD rail right, touch controls left/bottom. **Critical focus area (diamond around horizon + car) never occluded.**
- **Main visual treatment:** Light-on-dark strips (7:1+), tabular numerals, color-coded states (green gain / red loss / cyan draft / magenta dirty air), minimal footprint, no boxes over world.
- **Navigation:** None in-race; pause → settings/resume/quit.
- **Primary CTA:** None (read-only). Pause accessible via Escape/button.
- **Secondary actions:** Pause, restart (if exists), change view (if exists).
- **States:** Speed color tiers (boost-ready = color shift + pulse), boost ready pulse, lap complete flash gold, rank gain/loss pop, combo max ring gold, AI draft/dirty pulses, collision red flash, near-miss cyan flash.
- **Motion:** Micro only: progress fills, rank pulses, boost flash, draft fills. **NO decorative animation in HUD.**
- **Micro-interactions:** Shift-ready flash; draft fill pulse; combo counter pop.
- **Responsive:** Landscape race (force orientation), portrait fallback repositions clusters (AI rail right, touch left/bottom, speed above accel). Safe areas respected.
- **Accessibility:** `aria-live="polite"` announcer for rank/lap/boost changes; HUD numeric 10:1 via glow + dark outline; tabular numerals; large-HUD scale 1.5×.
- **Performance:** rAF-driven updates only; no layout thrash; numbers updated via textContent; no re-render.
- **MUST remain intact:** ALL HUD data sources, update frequencies, InputManager wiring, touch controls (GAS/AUTO lifecycle), AI HUD, existing events (draft, combo, near-miss, collision).
- **Priority:** **P0 (visual polish only — do not touch data/logic).**

**MUST HAVE:** Keep all existing HUD elements + data + behavior; tabular numerals; ensure no occlusion. **SHOULD HAVE:** boost-ready color shift, rank gain/loss pop, lap flash, draft/dirty pulses. **OPTIONAL:** speed-glow tiers, gear shift flash, combo max ring.

---

## 13. COUNTDOWN

- **Purpose:** Race-start anticipation with clear go-signal.
- **Primary user goal:** Know exactly when the race starts; be ready.
- **Information hierarchy:** Numbers (1) → "GO!" (2) → (optional) drivers/stage.
- **Layout:** Centered large Orbitron/Chakra Petch numerals, fullscreen. Ambient track visible behind.
- **Main visual treatment:** 3-2-1-GO with Chakra Petch/Oxanium numerals, scale-pop per tick, GO = fullscreen white radial flash (450ms) + sound.
- **Navigation:** None (modal to race).
- **Primary CTA:** None.
- **States:** 3 → 2 → 1 → GO → race active.
- **Motion:** Number scale-pop (spring, ~400ms each), GO flash (450ms ease-out). Reduced motion: numerals still shown (state communication — allowed), flash reduced.
- **Micro-interactions:** Tick pulse; GO flash.
- **Responsive:** Centered, clamp() scaled, works portrait+landscape.
- **Accessibility:** Numerals visible (not animation-dependent); announced via live region; flash kept below 3Hz / optional.
- **Performance:** CSS transform animations only.
- **MUST remain intact:** Countdown timing logic (P2.1/P2.2), race-start authority, sound hooks.
- **Priority:** P2 (polish).

**MUST HAVE:** Numerals + GO signal, timing intact. **SHOULD HAVE:** scale-pop per tick, GO flash, sound. **OPTIONAL:** driver/stage intro card.

---

## 14. VICTORY CEREMONY

- **Purpose:** Make winning feel earned and memorable.
- **Primary user goal:** Celebrate result; see rewards; continue quickly.
- **Information hierarchy:** Position/placement (1) → crown/medal (2) → rewards (XP/coins/unlocks) (3) → stats (4) → continue.
- **Layout:** Centered podium/card: rank number + medal, rewards row, stat grid, Continue button.
- **Main visual treatment:** Gold crown + rank pop (spring), level-up pulse border, XP arc draw sync, stat grid stagger scale-in, total count-up.
- **Navigation:** Continue → Results. Escape → Results.
- **Primary CTA:** **Continue** (to Results).
- **Secondary actions:** Skip, (optional) replay.
- **States:** Crown drop, rank pop, level-up (if XP crossed threshold), rewards tick-up.
- **Motion:** Crown drop + rank pop (spring 900ms), XP arc draw (600ms), stat stagger (60ms), total count-up (1000ms). Reduced motion: state only.
- **Micro-interactions:** Reward coin/XP tick-up; unlock badge pop.
- **Responsive:** Centered card scaled; mobile single column.
- **Accessibility:** Position + rewards announced; crown/medal not color-only; continue keyboard-accessible.
- **Performance:** CSS/JS rAF only; no Three.js.
- **MUST remain intact:** RaceResultGate integration, XP/coin rewards logic, level-up detection, unlock logic, replay-zero-progression rule.
- **Priority:** P2 (polish).

**MUST HAVE:** Rank + rewards + continue, all logic intact. **SHOULD HAVE:** crown drop, XP arc sync, stat stagger, count-up. **OPTIONAL:** confetti particles (≤30, desktop only, reduced-motion off).

---

## 15. RESULTS

- **Purpose:** Full race recap + shareable outcome.
- **Primary user goal:** See placement, time, score, breakdown, record deltas.
- **Information hierarchy:** Placement (1) → score/time (2) → breakdown (3) → records delta (4) → actions (5).
- **Layout:** Centered summary card + breakdown grid (laps, speed, combos, near-misses) + actions row.
- **Main visual treatment:** Slide-up entrance + crown drop (300ms spring), ghost racing line overlay showing path, record deltas green/red.
- **Navigation:** Continue → Main Menu. Replay → Replay screen.
- **Primary CTA:** **Continue** (to Menu) or **Replay** if preferred.
- **Secondary actions:** Replay, Share (visual-only), View Records.
- **States:** Entrance animation, record delta highlight (NEW RECORD gold), layout stable.
- **Motion:** Slide-up (300ms spring), stat count-up (1000ms), record delta flash.
- **Micro-interactions:** Row hover; replay button ripple.
- **Responsive:** Centered; mobile stacked.
- **Accessibility:** Placement + deltas announced; not color-only; keyboard nav.
- **Performance:** No heavy assets.
- **MUST remain intact:** Results data computation, RaceResultGate flow, replay store hooks, record comparisons.
- **Priority:** P2.

**MUST HAVE:** Placement, time/score, breakdown, continue, all logic. **SHOULD HAVE:** count-up, record deltas, crown drop. **OPTIONAL:** ghost line replay, share card.

---

## 16. REPLAY

- **Purpose:** Review the race from saved inputs.
- **Primary user goal:** Watch the race, change view, compare lines.
- **Information hierarchy:** Player (1) → timer/position (2) → controls (3).
- **Layout:** Race view + minimal controls (play/pause/seek/speed/view). HUD stripped to position/time.
- **Main visual treatment:** Same Three.js race view; subtle film-grain/letterbox optional (visual-only); controls as glass pills.
- **Navigation:** Back → Results/Menu. Controls: play/pause, seek, speed (0.5–2×), camera view.
- **Primary CTA:** Play/Pause.
- **Secondary actions:** Seek, speed, camera switch, exit.
- **States:** Playing, paused, scrubbing, speed changed.
- **Motion:** Control pill press (120ms); scrubber thumb.
- **Micro-interactions:** Speed button cycles with pop.
- **Responsive:** Landscape race; portrait fallback.
- **Accessibility:** Controls keyboard-accessible; seek bar `role="slider"`; time readout announced.
- **Performance:** Reuse replay pipeline; no extra post-processing mobile.
- **MUST remain intact:** ReplayInputSource, deterministic replay, seek/speed logic, camera views, zero-progression rule.
- **Priority:** P2.

**MUST HAVE:** Play/pause/seek/speed/view, replay correctness, zero-progression. **SHOULD HAVE:** glass control pills, speed pop. **OPTIONAL:** film grain, ghost-line comparison.

---

## 17. PHOTO MODE (visual-only)

- **Purpose:** Portfolio-worthy screenshots of the car/race.
- **Primary user goal:** Capture a cool frame; save/share (visual-only).
- **Information hierarchy:** Capture view (1) → controls (2).
- **Layout:** Fullscreen race/car view + minimal overlay (camera angle, filters if any, capture, close).
- **Main visual treatment:** Current render + optional filter overlays (CSS only); capture button.
- **Navigation:** Close → previous screen.
- **Primary CTA:** **Capture**.
- **Secondary actions:** Close, (optional) toggle UI overlay.
- **States:** Capturing (flash), saved toast.
- **Motion:** Capture flash (200ms), toast slide-in.
- **Micro-interactions:** Capture button pulse.
- **Responsive:** Fullscreen both orientations.
- **Accessibility:** Controls labeled; capture result announced.
- **Performance:** Single render capture; no continuous processing.
- **MUST remain intact:** Existing photo-mode functionality if present; if not present, mark as visual-only enhancement — do NOT invent a photo-mode engine.
- **Priority:** P3 (OPTIONAL — only if a capture mechanism already exists).

**MUST HAVE:** (only if exists) close + capture + current view. **SHOULD HAVE:** toast confirm. **OPTIONAL:** CSS filters, UI-toggle.

---

## 18. OVERLAYS / MODALS

- **Purpose:** Confirmations, toasts, tooltips, settings-overlay, pause.
- **Primary user goal:** Complete a blocking action or receive non-blocking feedback without losing context.
- **Components:**
  - **Modal/Dialog:** Backdrop blur + scale-in (280ms ease-out), focus trap, Escape closes, `role="dialog"` + `aria-modal="true"`.
  - **Toast:** Slide-in-right, stack with 80ms stagger, auto-dismiss (3–4s), `role="status"`, close button. Success=primary, error=red, info=cyan.
  - **Tooltip:** 120ms delay, 8px offset, light text on elevated surface, appears on hover/focus, keyboard-accessible, disabled in reduced-motion.
  - **Confirm:** Destructive actions require confirm ("Reset profile?", "Quit race?"). Cancel always available.
  - **Pause overlay:** Resume / Restart / Quit / Settings; Escape toggles.
- **Accessibility:** Focus trap + return focus; `aria-live` for toasts; confirm buttons labeled.
- **Performance:** Single modal layer at a time; toasts capped (max 3 visible).
- **MUST remain intact:** All existing modal flows, confirm logic, pause behavior.
- **Priority:** P1 (shared component layer — build once, use everywhere).

---

## 19. MOBILE-SPECIFIC UI

- **Purpose:** Portrait menus, landscape race, touch-first.
- **Key rules:**
  - Touch targets ≥ 48px (56px primary).
  - Bottom tab bar (56px, ≤5 items) for primary nav on menu screens.
  - Thumb-reach zone: bottom 60%, center-bottom for primary.
  - Safe areas: `env(safe-area-inset-*)` top/bottom/left/right.
  - No horizontal overflow: `overscroll-behavior: contain`, `touch-action: manipulation`, `viewport-fit=cover`.
  - Horizontal rails with peek (113px) for track/mode.
  - Accordion/collapsible for Profile/Settings.
  - `@media (pointer: coarse)` — faster press transitions (50ms), larger active states.
  - **Never hide HUD data on mobile** — reposition, don't remove.
- **MUST remain intact:** Touch controls (GAS/AUTO), coarse-pointer media queries, 380px breakpoint, existing responsive collapse logic.
- **Priority:** P1 (in parallel with screen work; enforce in every screen).

---

## PRIORITY SUMMARY

| Priority | Screens                                                                         |
| -------- | ------------------------------------------------------------------------------- |
| **P0**   | Main Menu, Track Select, Mode Select, Race HUD (polish only)                    |
| **P1**   | Garage, Profile, Leaderboard, Achievements, Overlays/Modals, Mobile rules       |
| **P2**   | Splash, How To Play, Settings, Matchmaking, Countdown, Victory, Results, Replay |
| **P3**   | Photo Mode (only if capture exists)                                             |
