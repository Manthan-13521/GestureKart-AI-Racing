VIRTUAL STEERING — MIMO V2.5 MASTER EXECUTION PROMPT
You are Mimo v2.5 acting as a senior frontend engineer, game UI engineer, game UX designer, visual design systems engineer, Three.js UI integrator, accessibility engineer, performance engineer, and QA engineer.
You are operating on an existing production-ready browser racing game called:

VIRTUAL STEERING
Your mission is to transform the existing game's player-facing UI/UX into a cohesive, premium, modern racing-game experience using the four supplied P15 design documents as the primary design authority.
This is NOT a greenfield project.

This is NOT an instruction to rewrite the game.

This is NOT an instruction to replace working architecture.

This is NOT an instruction to invent new gameplay.

Your job is:

AUDIT → UNDERSTAND → PLAN → IMPLEMENT → TEST → VISUALLY INSPECT → FIX → REGRESS → VERIFY PRODUCTION → REPORT → STOP
Do not stop after making the UI "look better".
The final result must make a real player think:

"This feels like a proper racing game, not a browser project." 0. SOURCE OF TRUTH
The repository contains the actual implementation.
You have also been provided these four design documents:

01-DESIGN-DIRECTION.md
02-SCREEN-BY-SCREEN-UX.md
03-DESIGN-SYSTEM-IMPLEMENTATION.md
04-ASSETS-AND-IMPLEMENTATION-ROADMAP.md
Read all four files completely before implementation.
Treat them as the current P15 design research and specification baseline.

Do NOT blindly apply every sentence.

You must reconcile every recommendation with:

the existing source code
actual component structure
existing navigation
actual data availability
actual gameplay lifecycle
current persistence
existing accessibility systems
current performance architecture
current tests
current browser behavior
When the documentation and repository disagree:
inspect the code;
determine the actual behavior;
preserve working architecture;
adapt the visual implementation around it;
never silently invent missing functionality.

1. PRIMARY DESIGN OBJECTIVE
   Transform Virtual Steering into a distinctive racing product with:
   premium visual hierarchy
   strong racing identity
   immediate player attraction
   fast navigation
   clear information
   excellent game feel
   responsive interaction
   coherent motion
   strong mobile presentation
   accessibility preserved
   performance preserved
   architecture preserved
   The visual direction is:
   NEON VELOCITY
   Dark cyber-track atmosphere.
   Precision telemetry.

Razor-thin luminous racing lines.

Controlled neon.

High-adrenaline precision.

GARAGE PRESTIGE
Showroom presentation.
Carbon-fiber material language.

Controlled metallic/gold accents.

Premium vehicle presentation.

Tactile contrast.

MASTER VISUAL METAPHOR
THE RACING LINE
The Racing Line is the visual grammar of the entire product.
It should connect:

splash
main menu
track select
mode select
garage
profile
results
victory
replay
photo mode
appropriate overlays
Do NOT implement unrelated visual styles screen by screen.
The entire game must feel like one design system.

2. ABSOLUTE ARCHITECTURE PRESERVATION
   DO NOT rewrite or replace working game systems unless repository inspection proves the current implementation is genuinely broken.
   These authorities remain authoritative:

RaceResultGate
ProfileManager
SaveManager
ContentCatalog
RaceDirector
NavigationSystem
InputManager
ReplayInputSource
ReplayRuntime
ReplayStore
TournamentManager
NetworkManager
deterministic AI systems
persistence systems
existing lifecycle systems
Do NOT create shadow versions of these systems.
Do NOT introduce competing state authorities.

Do NOT move gameplay state into UI components simply because it is easier.

UI reads state.

UI presents state.

UI emits user intent.

Existing game systems remain responsible for gameplay behavior and persistence.

3. DO NOT BREAK GAMEPLAY
   Do NOT change:
   race physics
   car handling
   collision logic
   AI behavior
   deterministic simulation
   replay determinism
   replay recording
   replay playback
   race completion authority
   reward authority
   progression rules
   XP logic
   level logic
   coin economy
   title logic
   achievement logic
   cosmetic ownership
   multiplayer lifecycle
   tournament lifecycle
   control systems
   gyro logic
   hand-tracking logic
   touch logic
   keyboard logic
   one-hand mode behavior
   Unless a change is absolutely necessary to repair an actual bug discovered during implementation.
   Presentation must adapt to gameplay.

Gameplay must not be rewritten to support presentation.

4. EXISTING PLAYER FLOW
   Preserve and improve the full flow:
   SPLASH
   ↓
   LOADING
   ↓
   MAIN MENU
   ↓
   TRACK SELECT
   ↓
   MODE SELECT
   ↓
   RACE STAGING / INTRO
   ↓
   COUNTDOWN
   ↓
   RACING
   ↓
   GAME OVER / FINISH
   ↓
   VICTORY CEREMONY
   ↓
   RESULTS
   ↓
   REPLAY / PHOTO MODE / CONTINUE
   ↓
   MAIN MENU / NEXT RACE
   Secondary navigation:
   MAIN MENU
   ├── GARAGE
   ├── PROFILE
   ├── LEADERBOARD
   ├── ACHIEVEMENTS
   ├── HOW TO PLAY
   ├── SETTINGS
   ├── MULTIPLAYER
   └── TOURNAMENT
   Every transition should feel intentional and coherent.
   No broken routes.

No dead-end screens.

No visual transition that bypasses NavigationSystem.

5. EXISTING PRODUCT CAPABILITIES
   Assume the product already supports many of the following:
   single-player racing
   AI opponents
   survival
   versus
   multiplayer
   tournament
   keyboard controls
   touch controls
   gyro / phone steering
   hand steering
   deterministic AI
   deterministic replay
   replay viewer
   photo mode
   free camera
   chase camera
   orbit camera
   cinematic camera
   slow motion
   depth of field
   screenshot capture
   progression
   XP
   levels
   coins
   titles
   achievements
   garage
   cosmetics
   accessibility
   quality tiers
   dynamic resolution
   audio
   VFX
   victory presentation
   Confirm all of this by inspecting the repository.
   Do not assume documentation is more accurate than source code.

6. FIRST ACTION — REPOSITORY AUDIT
   Before editing any file, inspect the repository.
   At minimum locate and understand:

src/
src/ui/
src/ui/components/
src/ui/core/
src/screens/
tests/
public/
package.json
vite config
TypeScript configuration
CSS architecture
entry points
navigation implementation
game lifecycle
replay lifecycle
profile/persistence
input systems
multiplayer systems
audio/VFX systems
Identify the actual implementation locations for:
Main Menu
Track Select
Mode Select
Garage
Profile
Leaderboard
Achievements
How To Play
Settings
Splash
Loading
Race HUD
Countdown
Victory
Results
Replay
Photo Mode
Multiplayer
Tournament
overlays
dialogs
toast system
theme manager
navigation
transitions
racing line
hero car
ambient background
design tokens
animation system
Do NOT infer filenames.
Inspect them.

Create a mental map of:

screen
→ component
→ data source
→ state authority
→ navigation authority
→ persistence authority
→ tests 7. BASELINE VALIDATION
Before implementation:
Run the repository's existing validation commands.

At minimum determine the actual current result of:

npm run typecheck
npm run lint
npx prettier --check .
npx vitest run
npm run build
npx playwright test
Also inspect package scripts and use the project's own preferred commands if they differ.
Record:

failures
skipped tests
warnings
build size
major bundle chunks
CSS size
font size
existing hero model size
console errors
browser errors
Do NOT "fix" baseline issues before understanding them.
Create a baseline diagnosis internally before implementation.

8. READ THE FOUR DESIGN DOCUMENTS COMPLETELY
   Extract and reconcile:
   Visual
   Neon Velocity
   Garage Prestige
   Racing Line visual grammar
   dark surfaces
   semantic accents
   glass language
   carbon texture restraint
   hierarchy
   Typography
   Orbitron
   Rajdhani
   Inter
   Share Tech Mono
   tabular numerals
   Component language
   buttons
   cards
   tabs
   chips
   badges
   progress bars
   progress arcs
   stat blocks
   modals
   toasts
   skeletons
   empty states
   error states
   leaderboard rows
   track cards
   mode cards
   achievement cards
   racing line
   Motion
   responsive transitions
   microinteractions
   racing-line transitions
   staggered entrance
   controlled glow
   state celebration
   reduced-motion behavior
   Mobile
   portrait menus
   landscape race
   safe areas
   thumb zones
   minimum target sizes
   no horizontal overflow
   Accessibility
   focus-visible
   semantic HTML
   colorblind redundancy
   reduced motion
   high contrast
   scaling
   live regions
   Performance
   lazy loading
   render gating
   blur limits
   particle limits
   DOM limits
   font limits
   model limits
   mobile reduction
9. VISUAL DESIGN LAWS — NON-NEGOTIABLE
   These rules are mandatory unless repository evidence shows a specific rule is technically incompatible.
   COLOR
   Use semantic colors only.
   Primary:

#00ff66
Meaning:
GO / PRIMARY CTA / SPEED / SUCCESS
Gold:
#ffd700
Meaning:
1ST / PREMIUM / BEST / MASTERY
Cyan:
#00e5ff
Meaning:
INFO / TECH / DRAFT / SLIPSTREAM / COMBO
Red:
#e10600
Meaning:
DANGER / ERROR / LOSS / COLLISION
Magenta:
#ff2d95
Meaning:
WARNING / DIRTY AIR / NEAR MISS
Do not use these colors as random decoration.
Color must communicate.

Never rely on color alone to communicate state.

10. TYPOGRAPHY LAWS
    Use the defined typography roles.
    Orbitron
    → logo
    → display
    → major headings
    → primary buttons
    → countdown

Rajdhani
→ HUD
→ headings
→ labels
→ telemetry

Inter
→ body
→ descriptions
→ settings
→ help
→ tooltips

Share Tech Mono
→ timers
→ leaderboards
→ precision numeric data
Mandatory:
font-variant-numeric: tabular-nums;
for:
speed
position
lap
timer
score
combo
rank
leaderboard columns
countdown data
Do not use Orbitron for paragraph/body content.
Do not arbitrarily introduce additional display fonts.

11. SPATIAL HIERARCHY
    Every screen must have:
    primary action/information
    secondary action/information
    tertiary metadata
    Do not make everything loud.
    Premium means restraint.

Avoid:

excessive glow
excessive particles
excessive glass
oversized headings everywhere
permanent notification badges
unnecessary dashboards
decorative neon everywhere
The center of the race viewport is sacred. 12. RACE HUD CRITICAL FOCUS AREA
Protect the player’s visual focus around:
horizon
player car
immediate track
immediate competitors
No major UI element should obstruct this critical focus area.
Use edge-first HUD composition.

Prioritize:

speed
position
lap
race status
next important event
Secondary:
timer
gap
boost
draft
warnings
minimap
Peripheral:
secondary telemetry
contextual info
non-critical notifications
Do not turn the race HUD into a dashboard. 13. MOTION RULES
Default easing:
cubic-bezier(0.22, 1, 0.36, 1)
User interactions should feel immediate.
Target visible response:

<120ms
Default screen transitions:
≤280ms
Hero cinematic animation may be longer only where justified.
Stagger:

~60ms
maximum 8 staggered items
Exit duration should generally be shorter than entrance.
Animate:

transform
opacity
safe composited properties
Do NOT animate:
backdrop-filter
width
height
top
left
layout dimensions
expensive layout properties
Do not introduce animation simply because you can.
Every animation must have one of these purposes:

feedback
orientation
state change
hierarchy
delight 14. REDUCED MOTION
Respect:
@media (prefers-reduced-motion: reduce)
and the project's existing JavaScript motion gate.
When reduced motion is enabled:

REMOVE:

decorative staggers
decorative parallax
decorative particles
unnecessary camera movement
unnecessary shimmer
PRESERVE only motion required to communicate state when appropriate. 15. MOBILE RULES
Portrait:
menus
navigation
garage browsing
settings
profile
results
Landscape:
gameplay/racing
Respect:
env(safe-area-inset-top)
env(safe-area-inset-right)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
Minimum touch target:
48 × 48 px
Primary CTA:
56 px minimum height
Do NOT simply compress desktop layouts.
Create responsive compositions.

Mobile must feel intentionally designed.

No horizontal overflow.

No clipped buttons.

No unreachable controls.

No HUD collision with touch controls.

16. PERFORMANCE RULES
    Preserve the existing quality-tier and dynamic-resolution architecture.
    Target constraints from the P15 design:

Desktop glass blur ≤12px
Mobile glass blur ≤8px
Desktop ambient particles ≤60
Mobile ambient particles ≤20
Menu hero GLTF preferably <100KB
Fonts preferably <150KB total
Menu DOM preferably <2000 nodes
Do not blindly enforce these numbers if the actual existing project uses another measured configuration.
Measure first.

Do not create:

unnecessary Three.js canvases
duplicated 3D models
duplicated render loops
unbounded particle systems
heavyweight animation libraries
oversized textures
unnecessary post-processing
giant UI bundles
Use:
code splitting
lazy loading
conditional initialization
asset reuse
resource disposal
existing quality tiers 17. ASSET LICENSING
Only use assets with clear permission.
Preferred:

CC0
MIT
ISC
Apache-2.0
OFL
Public Domain
The P15 asset research identifies resources such as:
Orbitron
Rajdhani
Inter
Share Tech Mono
Phosphor
Kenney Car Kit
Kenney Racing assets
Poly Haven
ambientCG
But before adding an asset:
verify its actual license;
verify commercial-use status;
verify modification/redistribution rights;
add required notices;
keep THIRD_PARTY_NOTICES.md accurate.
Never rip assets from:
Forza
Need for Speed
Gran Turismo
Cyberpunk
F1
commercial games
copyrighted websites
Those are inspiration references, not shipping assets.
If a procedural CSS/SVG/Three.js solution is better, prefer procedural.

18. DESIGN SYSTEM IMPLEMENTATION
    Centralize the design system.
    Inspect and extend existing token architecture.

Use CSS custom properties and the project's token mirror.

Preserve or establish consistent tokens for:

colors
typography
spacing
sizing
radii
borders
blur
shadows
glows
opacity
z-index
motion
easing
Do not create arbitrary one-off CSS values on every screen.
Prefer:

token
→ component
→ screen
rather than:
screen
→ random CSS 19. CORE COMPONENTS
Reuse or improve shared components.
Expected categories include:

Button
GlassCard
TabBar
Chip
Badge
ProgressBar
ProgressArc
StatBlock
Modal
Toast
Tooltip
Toggle
Slider
Dropdown
LoadingState
Skeleton
EmptyState
ErrorState
TrackCard
ModeCard
AchievementCard
LeaderboardRow
RacingLine
Before creating a new component:
search existing components;
determine if an existing component can be extended;
avoid duplicated implementations.
Shared components must have predictable selectors and APIs so tests remain stable. 20. SCREEN IMPLEMENTATION
Implement against the actual repository structure.
SPLASH
Goal:
Immediate brand identity.

Visual:

clean logo
racing-line language
controlled ambient atmosphere
minimal loading indicator
Do not make the splash block gameplay unnecessarily.
MAIN MENU
This is one of the highest-impact screens.
Composition:

LEFT:
hero vehicle
showroom lighting
controlled motion

RIGHT:
Race
Garage
Profile
Leaderboard
Achievements
Settings
How To Play
other existing actions
The Race button must be the strongest CTA.
Display useful profile context:

level
title
XP
coins
Do not invent profile data.
Use actual ProfileManager data.

Hero car must be lazy-loaded and reused where possible.

TRACK SELECT
Make every track recognizable immediately.
Use:

SVG track silhouette/map
track name
best time
difficulty
actual available metadata
unlock state
medals only where backed by actual data
Do not invent weather/time systems if they do not exist.
Use the rail/grid behavior specified by the design docs where compatible with actual content.

MODE SELECT
Group real game modes by intent.
Example categories:

Solo
Multiplayer
Training
Only show categories/modes that actually exist.
Each card should expose:

mode name
icon
short description
difficulty
player count
available control methods
Availability should come from actual game logic.
Do not create fake mode descriptions.

GARAGE
Highest visual emphasis:
vehicle
Secondary:
cosmetics
Tertiary:
specification / state
Preserve:
cosmetic ownership
equip state
persistence
camera controls
existing cosmetic logic
Do not introduce gameplay upgrades.
PROFILE
Turn progression into a game profile.
Use actual:

XP
level
title
stats
records
achievements
Avoid making it look like a CRUD analytics dashboard.
LEADERBOARD
Use a timing-tower visual language.
Show real available records.

Use:

position
player
score/time
gap where available
current player highlight
local-only indicator if the architecture is local-only
Do not imply a global online leaderboard if the game does not actually have one.
ACHIEVEMENTS
Use collectible presentation.
Clear states:

locked
unlocked
mastery
newly unlocked
Rarity visuals must be data-driven.
Do not make all achievements glow equally.

HOW TO PLAY
Make it fast to understand.
Use visual instruction modules for actual controls:

keyboard
touch
gyro
hand steering
boost
braking
other real gameplay mechanics
Do not create instructions for nonexistent mechanics.
Respect one-hand mode.

SETTINGS
Treat settings as a real game settings screen.
Organize by actual settings categories.

Likely:

Controls
Video
Audio
Accessibility
Gameplay
But use actual existing settings.
Preserve all existing persisted settings.

21. RACE HUD
    The race HUD must be radically more polished without adding clutter.
    Priorities:

POSITION
SPEED
LAP
TIME
Secondary:
GAP
BOOST
DRAFT
MINIMAP
WARNINGS
Use semantic colors.
Use tabular numeric typography.

Protect the central focus area.

Keep controls separate from HUD.

Do not obstruct the vehicle.

Do not introduce a giant floating dashboard.

22. COUNTDOWN
    Countdown should feel like racing.
    Use:

strong typography
hierarchy
controlled pulse
appropriate audio/VFX integration
minimal but impactful motion
Do not introduce long blocking cinematic delays. 23. VICTORY CEREMONY
Victory should be emotional and share-worthy.
Use actual:

position
time
reward
XP
coins
new record
achievement unlocks
Do not invent reward events.
Create hierarchy:

1. victory
2. result
3. reward
4. progression
5. next action
   Primary actions:
   Continue
   Replay
   Retry
   where supported by actual flow.
   Do not make the player fight the UI after a race.

6. RESULTS
   Results must make the player immediately understand:
   how they performed
   what they earned
   whether they improved
   what to do next
   Use progressive disclosure for secondary information.
7. REPLAY + PHOTO MODE
   Do not redesign replay architecture.
   Redesign the presentation around:

camera controls
playback controls
timeline
speed
DoF
visual settings
filters
screenshot
hide UI
Preserve actual camera modes.
Preserve deterministic replay.

Preserve screenshot/download/share behavior.

Do not change replay progression rules.

Replay must remain zero-progression.

26. MULTIPLAYER / TOURNAMENT
    Inspect the actual implementation.
    Do not fake online functionality.

Make the UI feel consistent with the rest of Virtual Steering.

Respect:

network lifecycle
player states
lobby behavior
tournament rules
match flow
No new networking architecture just for visuals. 27. EMPTY / LOADING / ERROR STATES
Every major screen needs intentional states.
Implement or reuse:

LoadingState
Skeleton
EmptyState
ErrorState
Retry
Examples:
no leaderboard times
unavailable multiplayer
locked content
loading assets
profile reset confirmation
replay unavailable
missing local data
These states must look like part of the game. 28. DATA INTEGRITY RULE
When UI requires data:
First inspect whether it exists.

Priority:

real existing data
↓
derived presentation from real data
↓
safe static metadata already defined in project
↓
defer feature
NEVER:
fabricate player stats
fabricate tracks
fabricate achievements
fabricate weather
fabricate global multiplayer data
fabricate rewards
fabricate economy
fabricate network states 29. NAVIGATION RULES
Preserve NavigationSystem.
Typical behavior:

Back
Escape
Enter
Space
Arrow keys
Tab
Gamepad
Touch
must remain coherent.
Every screen must have an obvious way out.

Escape should follow existing project conventions.

Do not create modal navigation traps.

30. ACCESSIBILITY VALIDATION
    Verify:
    keyboard-only navigation
    visible focus
    logical tab order
    semantic buttons
    labels
    progress semantics
    live regions where needed
    reduced motion
    colorblind presets
    high contrast
    one-hand mode
    target sizes
    readable contrast
    screen-reader meaningful labels
    Never use:

<div onclick="">
when a real button is appropriate.
Never remove existing focus indicators.

Never communicate a state by color alone.

31. VISUAL QA IS MANDATORY
    Do not consider the implementation complete because tests pass.
    Perform actual visual QA in browser.

Inspect every major screen at:

Desktop
Test reasonable desktop widths.
Mobile
Test Pixel 5 or equivalent mobile viewport.
Check:

hierarchy
alignment
typography
spacing
visual rhythm
glow restraint
racing identity
readability
responsiveness
touch targets
overflow
clipping
z-index
focus
modal behavior
transitions
loading state
empty state
error state
race HUD focus area
The visual QA question is:
"Would an experienced gamer find this attractive and intentional?"
not merely:
"Does the page render?" 32. BROWSER VERIFICATION
Verify at minimum:
Splash
Main Menu
Track Select
Mode Select
Race Staging
Countdown
Race HUD
Finish
Victory
Results
Garage
Profile
Leaderboard
Achievements
How To Play
Settings
Replay
Photo Mode
Multiplayer
Tournament
Check:
navigation
back behavior
keyboard
touch
responsive layout
console errors
page errors
race initialization
race completion
result progression
replay entry
replay exit
persistence
settings persistence 33. TEST PRESERVATION
Current project validation is the target baseline.
The repository documentation describes a fully green production-quality state.

Do not weaken this standard.

Rules:

never delete tests to make them pass
never skip new failures
never weaken assertions without strong justification
update selectors if the UI contract changes legitimately
preserve behavioral test intent
add tests for genuinely new behavior
keep test selectors stable and intentional
Run:
focused unit tests
↓
focused screen tests
↓
full unit suite
↓
E2E
↓
build
↓
production browser validation 34. IMPLEMENTATION ORDER
Use this order unless repository evidence proves another order is safer.
PHASE 0 — AUDIT
No modifications.
Understand the project.

PHASE 1 — BASELINE
Record all current tests/build/browser status.
PHASE 2 — DESIGN SYSTEM
Stabilize:
tokens
typography
components
motion
transitions
racing line
theme
accessibility primitives
PHASE 3 — CORE FLOW
Prioritize:
Splash
Main Menu
Track Select
Mode Select
PHASE 4 — PLAYER IDENTITY
Implement/improve:
Garage
Profile
Achievements
Leaderboard
PHASE 5 — RACE EXPERIENCE
Implement/improve:
Staging
Countdown
HUD
Victory
Results
PHASE 6 — SECONDARY EXPERIENCE
Implement/improve:
How To Play
Settings
Loading
Error
Empty states
PHASE 7 — REPLAY
Implement/improve:
Replay
Photo Mode
PHASE 8 — MULTIPLAYER
Only visual/UX changes around actual multiplayer architecture.
PHASE 9 — MOBILE
Verify and refine all mobile behavior.
PHASE 10 — VISUAL POLISH
Only after functionality is stable.
Refine:

spacing
lighting
glow
transitions
microinteraction
hierarchy
typography
animation 35. BEFORE EACH PHASE
Before changing files:
identify actual files;
identify dependencies;
identify state/data sources;
identify tests;
identify navigation;
identify performance implications;
identify accessibility implications.
Then implement the smallest coherent change.
Do not perform uncontrolled mass rewrites.

36. AFTER EACH PHASE
    Run targeted validation.
    At minimum:

typecheck where relevant
unit tests related to modified area
lint
prettier
browser verification where appropriate
Then continue.
If a regression appears:

STOP advancing.

Fix it before expanding the change surface.

37. CODE QUALITY RULES
    Prefer:
    existing architecture
    existing abstractions
    existing utilities
    existing state authorities
    shared components
    tokens
    semantic HTML
    readable TypeScript
    small targeted changes
    Avoid:
    duplicate utilities
    duplicate state
    massive screen components
    hard-coded magic values
    undocumented CSS
    one-off animation systems
    unnecessary libraries
    unnecessary dependencies
    dead code
    temporary debug code
38. THREE.JS RULE
    Three.js should handle:
    3D depth
    hero car
    showroom lighting
    game visuals
    DOM/CSS should handle:
    semantic UI
    layout
    accessibility
    menus
    text
    controls
    panels
    navigation
    Do not turn every UI element into a Three.js object.
    Do not render HUD text through WebGL unless the existing system explicitly requires it.

39. RACING LINE IMPLEMENTATION
    The Racing Line should be a real reusable shared visual system.
    Prefer SVG/DOM overlay when possible.

It should support:

screen entry
screen exit
contextual transition
selected-state emphasis
connection between related UI
Keep it:
thin
precise
restrained
semantic
It must never interfere with input.
It must not reduce readability.

40. DESIGN QUALITY BAR
    The final interface must NOT look like:
    generic SaaS
    admin dashboard
    Tailwind template
    random glassmorphism
    generic cyberpunk
    "neon everything"
    student portfolio UI
    cluttered game dashboard
    It should look:
    premium
    confident
    intentional
    fast
    readable
    racing-specific
    cohesive
    modern
    responsive
    technically polished
41. DO NOT ADD THESE WITHOUT STRONG JUSTIFICATION
    Do not add:
    new authentication
    cloud persistence
    new economy
    gameplay upgrades
    arbitrary statistics
    fake global leaderboards
    unnecessary social systems
    unnecessary multiplayer features
    new gameplay modes
    large animation libraries
    heavy UI frameworks
    unnecessary external APIs
    You are improving the product that exists.
42. ASSET STRATEGY
    Before importing any external resource:
    Check:

source
license
commercial permission
modification permission
redistribution permission
file type
size
runtime cost
Prefer:
procedural SVG
CSS
existing assets
CC0
permissive libraries
Keep third-party notices accurate.
Never bring unverified copyrighted assets into the repository.

43. FINAL VALIDATION MATRIX
    Before declaring completion, validate:
    FUNCTIONAL
    all screens reachable
    all expected routes work
    no broken navigation
    race starts
    race completes
    rewards remain correct
    replay remains correct
    persistence remains correct
    VISUAL
    cohesive design language
    consistent components
    racing-line grammar
    semantic colors
    correct typography
    consistent spacing
    controlled glow
    premium hierarchy
    MOBILE
    no horizontal overflow
    touch targets >=48px
    primary CTA >=56px
    race controls and HUD do not overlap
    safe areas respected
    portrait menus
    landscape gameplay
    ACCESSIBILITY
    keyboard
    focus
    reduced motion
    colorblind
    high contrast
    semantic labels
    screen-reader semantics
    non-color state encoding
    PERFORMANCE
    no new render loops
    no duplicate canvases
    assets reused
    lazy loading preserved
    mobile effects constrained
    no obvious frame drops
    bundle remains reasonable
    QUALITY
    no debug UI
    no console errors
    no temporary probes
    no dead files
    no commented-out abandoned implementation
    formatting clean
44. REQUIRED FINAL REPORT
    Create:
    REPORT-37-FINAL-UIUX-TRANSFORMATION.md
    It must document:
    objective
    repository baseline
    design documents consumed
    final visual direction
    final design-system decisions
    screen-by-screen changes
    architecture preserved
    files modified
    files created
    assets added
    licenses
    accessibility changes
    mobile changes
    performance changes
    test changes
    unit-test results
    E2E results
    production-build results
    browser validation
    bugs discovered
    bugs fixed
    remaining limitations
    visual QA findings
    final verdict
    Include exact commands/results where useful.
    Do not claim a test passed if it was not actually run.

Do not claim a screen was verified if it was not actually inspected.

45. REQUIRED FINAL OUTPUT TO ME
    When everything is complete, return a concise implementation summary containing:
    STATUS
    WHAT CHANGED
    KEY SCREENS IMPROVED
    DESIGN SYSTEM CHANGES
    ASSETS
    TEST RESULTS
    E2E RESULTS
    PRODUCTION VALIDATION
    ACCESSIBILITY
    PERFORMANCE
    REMAINING LIMITATIONS
    FINAL VERDICT
    Also provide the path to:
    REPORT-37-FINAL-UIUX-TRANSFORMATION.md
46. STOP CONDITION
    You MUST stop after:
    implementation is complete
    regression is complete
    browser verification is complete
    production verification is complete
    temporary artifacts are removed
    final report is written
    Do NOT continue into unrelated feature development.
    Do NOT start another redesign cycle.

Do NOT add unrelated gameplay features.

Do NOT refactor unrelated architecture.

Do NOT "improve" systems outside this mission.

47. MOST IMPORTANT BEHAVIORAL INSTRUCTION FOR MIMO V2.5
    Do not blindly execute the design documents.
    Think like a senior engineer.

When you encounter a recommendation:

DOCUMENT
↓
CHECK REPOSITORY
↓
CHECK REAL DATA
↓
CHECK ARCHITECTURE
↓
CHECK PERFORMANCE
↓
CHECK ACCESSIBILITY
↓
IMPLEMENT
If an idea conflicts with the existing game:
prefer the smallest safe adaptation.

If a feature requires nonexistent data:

do not invent it.

If an asset is legally unclear:

do not ship it.

If a visual effect hurts performance:

simplify it.

If a redesign breaks gameplay:

reject the redesign.

If a test fails:

investigate the failure.

If visual QA exposes a problem:

fix it.

Do not rationalize defects.

48. FINAL SUCCESS DEFINITION
    Virtual Steering succeeds only when all of these are simultaneously true:
    PREMIUM VISUAL DESIGN

-

RACING AUTHENTICITY +
FAST UX +
STRONG GAME FEEL +
MOBILE QUALITY +
ACCESSIBILITY +
PERFORMANCE +
ARCHITECTURE SAFETY +
TEST STABILITY
The final product should feel like:
A deliberately designed racing game that happens to run in a browser.
Not:
A website with a racing game attached.
Begin with the repository audit.
Do not skip directly to implementation.
Do not modify gameplay architecture merely to achieve visual results.
AUDIT → PLAN → IMPLEMENT → VERIFY → FIX → REGRESS → REPORT → STOP.
