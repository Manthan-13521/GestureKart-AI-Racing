# Accessibility

Racing games sit at an unusually high-stress intersection of fast reaction times, color-coded information, and precise input — which means accessibility gaps here don't just inconvenience players, they actively exclude them from playing at all. This isn't a settings-menu checklist to bolt on at the end; build the redundancy into the components themselves from the start, per the SKILL.md non-negotiables.

## Contents

- Contrast and legibility
- Color-blind-safe design
- HUD customization
- Input and control accessibility
- Motion and photosensitivity
- Audio-dependent information
- Pre-ship checklist

## Contrast and legibility

Use these as concrete minimums, not aspirational targets — they're the same contrast ratios used across platform accessibility guidelines (Xbox, PlayStation) and general Web accessibility standards (WCAG AA):

- **Standard-size text and any HUD element carrying important information:** at least **4.5:1** contrast against its background.
- **Large-scale text (roughly 18pt+/24px+ or bold 14pt+/19px+) and large visual elements:** at least **3:1**.
- Since HUD elements sit over a constantly changing background (the track, the world), test contrast against the _worst-case_ background, not just a convenient dark frame — a light-colored HUD element that reads fine over asphalt can disappear entirely over a bright sky or snow. A translucent dark panel or a text outline/drop-shadow behind HUD text is a common, effective fix.
- Support a **text-size increase** (a meaningful step, not a token one — aim for the option to scale up to roughly 200% of default) for both HUD and menu text.
- Offer a **high-contrast mode** as a real option, not just "increase brightness" — a mode that pushes toward pure, maximally-differentiated colors and stronger element outlines, for players with low vision.

## Color-blind-safe design

**Never let color be the only signal for a distinction that matters.** This is the single most common accessibility failure in racing HUDs specifically, because so much racing UI leans on color coding (red = damaged, green = boost ready, your-color vs. rival-color on the minimap). Every one of those needs a second, non-color cue — an icon, a shape, a position, a pattern, or text — so the information survives even if color is imperceptible.

- Provide distinct filter/palette modes for the three common types of color-vision deficiency: **deuteranopia** (red-green, the most common form), **protanopia** (also red-green), and **tritanopia** (blue-yellow, less common but real). A single generic "colorblind mode" toggle that doesn't distinguish between these is a weaker version of the same feature — the correction that helps one type can do nothing for, or even worsen, another.
- If choosing a single "safe" accent pairing for a default palette that needs to stay legible without any filter active, **blue and orange** are distinguishable across all three common CVD types and are a reliable starting point for a primary/danger or self/rival pairing.
- Test the actual shipping palette through a colorblindness simulator (widely available as free tools and as built-in features in Unity and Unreal) as a normal part of finishing any screen, not a separate accessibility-only pass done once at the end.
- Redundant coding costs little once it's a habit: pair a damage state with a cracking-glass icon or a distinct shape change, not just a shift from green to red; pair "your car" vs. "rival" on a minimap with a distinct marker shape, not just a distinct dot color.

## HUD customization

The strongest pattern here, borrowed from both sim racers and time-trial games: let players configure the HUD rather than shipping one fixed version tuned for an assumed-average player.

- **Per-element visibility toggles** — let players turn off any individual HUD piece (minimap, lap counter, tachometer, damage indicator) independently, not just an all-or-nothing HUD on/off switch.
- **Opacity, scale, and position controls** for HUD elements as a group, so a player who needs larger text or a repositioned element (to avoid a device notch, a physical bezel, or simply personal preference) isn't stuck with the default layout.
- **A visible focus/selection indicator** at all times in every menu for gamepad/keyboard navigation, since there's no cursor to imply selection state the way a mouse provides.

## Input and control accessibility

- **Full control remapping**, not just a couple of alternate presets — different players have different physical needs and different muscle memory from other games.
- **Assist options as first-class, non-punished choices:** steering assist, braking assist, traction/stability assist, and rewind/undo-a-crash are common, valuable accessibility features as much as difficulty features. Present them as legitimate ways to play, not a lesser "easy mode" that's hidden away or narratively shamed.
- The **simplified-vs-manual control split** common in mobile racers (see `genre-playbook.md`) is worth offering as an accessibility option on any platform, for players who have difficulty with precise simultaneous steering-plus-throttle-plus-brake input regardless of the reason.
- Make sure every menu and every HUD interaction is reachable through **every supported input method** — a setting that's only reachable by precise mouse-click, with no gamepad/keyboard equivalent, is an accessibility gap even if it wasn't designed as one.

## Motion and photosensitivity

- Offer a way to **reduce or disable screen shake**, camera FOV-pull effects, and full-screen motion blur — these are exactly the effects covered in the "sense of speed" section of `hud-design.md`, and the same intensity that reads as thrilling to one player can trigger motion sickness or discomfort in another.
- **Avoid rapid flashing or strobing effects** (a boost activation, a crash impact, a UI alert) above roughly three flashes per second, and avoid large-area, high-contrast flashes — this is a photosensitive-epilepsy safety concern, not just a taste preference, and applies to any celebratory or impact effect touched on in `visual-language.md`.
- Where a dramatic camera or screen effect is core to the game's identity (a big crash sequence, a boost activation), keep a reduced-intensity version available rather than removing the moment's feedback entirely — the goal is a safer version of the same feedback, not silence.

## Audio-dependent information

Any information conveyed only through audio — engine pitch signaling speed, a co-driver's pace-note callouts in a rally game, an audio cue for an incoming item in a kart racer — needs a visual equivalent for deaf and hard-of-hearing players, and for anyone playing without sound. The rally pace-note visual strip mentioned in `genre-playbook.md` is a direct example of this principle applied to a genre where it's especially load-bearing. Subtitle and caption support for any spoken dialogue or narrated tutorial content follows the same logic.

## Pre-ship checklist

Run this against any screen before treating it as finished, not just at a project-wide accessibility pass:

- [ ] Does every color-coded distinction survive with color removed (icon, shape, or position also carries it)?
- [ ] Does HUD text pass 4.5:1 (or 3:1 for large elements) against its _worst-case_ background, not just a convenient one?
- [ ] Can every menu be completed with a gamepad/keyboard alone, with visible focus at every step?
- [ ] Can the player turn off or reduce screen shake, FOV-pull, and motion blur individually?
- [ ] Does any flashing/strobing effect stay under roughly three flashes per second?
- [ ] Is there a text-size increase option, and does the layout survive it without overlapping or clipping?
- [ ] Is any audio-only information (engine cues, pace notes, alerts) also available visually?
- [ ] Are HUD elements individually toggleable, or at minimum is there a "simplified HUD" state?
