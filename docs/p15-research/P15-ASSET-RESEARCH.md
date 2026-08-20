# P15 Asset Research — Verified Licenses for Commercial Use

**Project Type:** Commercial portfolio game (GitHub + Vercel deployment)  
**Policy:** ONLY CC0, MIT, ISC, Apache-2.0, OFL, Public Domain. Unclear/NC/SA = DO NOT USE.

---

## 1. Fonts (Google Fonts — OFL 1.1 Verified)

| Font                | Role                | Google Fonts URL                                  | Weights      | Subset     | Self-Host?    |
| ------------------- | ------------------- | ------------------------------------------------- | ------------ | ---------- | ------------- |
| **Orbitron**        | Display/Logo        | https://fonts.google.com/specimen/Orbitron        | 400–900 + VF | Latin      | Yes (preload) |
| **Rajdhani**        | Headings/HUD        | https://fonts.google.com/specimen/Rajdhani        | 300–700 + VF | Latin      | Yes (preload) |
| **Chakra Petch**    | Countdowns/Flags    | https://fonts.google.com/specimen/Chakra+Petch    | 300–700 + VF | Latin+Thai | Optional      |
| **Oxanium**         | Numeric/Stat HUD    | https://fonts.google.com/specimen/Oxanium         | 200–800 + VF | Latin      | Optional      |
| **Saira Condensed** | Motorsport headings | https://fonts.google.com/specimen/Saira+Condensed | 100–900 + VF | Latin      | Optional      |
| **Inter**           | Body text           | https://fonts.google.com/specimen/Inter           | 100–900 + VF | Latin      | Yes (preload) |
| **Share Tech Mono** | Timers/Leaderboards | https://fonts.google.com/specimen/Share+Tech+Mono | 400, 700     | Latin      | Optional      |
| **JetBrains Mono**  | Data/Code           | https://fonts.google.com/specimen/JetBrains+Mono  | 100–800 + VF | Latin      | Optional      |

**OFL Compliance:** If self-hosting, include each font's `OFL.txt` in `THIRD_PARTY_NOTICES.md`. No in-game attribution required for use.

---

## 2. Icons (MIT/ISC/Apache-2.0)

| Library              | License    | Racing Icons                                                                     | Delivery       | Size     |
| -------------------- | ---------- | -------------------------------------------------------------------------------- | -------------- | -------- |
| **Phosphor**         | MIT        | car, steering-wheel, trophy, joystick, engine, gear, ranking, speedometer, timer | SVG/Font/React | 300+     |
| **Tabler**           | MIT        | 6,184 icons; car, steering-wheel, trophy, settings, joystick, speedometer        | SVG/Font/React | Large    |
| **Lucide**           | ISC        | car, gauge, settings, trophy, medal, ranking, gamepad-2, flag, timer             | SVG/React      | Light    |
| **Material Symbols** | Apache-2.0 | settings, trophy, sports/esports, speed, leaderboard, steering                   | Variable Font  | Variable |

**Recommendation:** **Phosphor** (best thematic match, MIT, tree-shakeable SVG). Keep MIT license notice in `THIRD_PARTY_NOTICES.md`.

---

## 3. 3D Models (CC0 glTF for Three.js)

| Source                                 | Assets                                          | License     | Format        | Notes                                                    |
| -------------------------------------- | ----------------------------------------------- | ----------- | ------------- | -------------------------------------------------------- |
| **Kenney Car Kit**                     | 45+ low-poly vehicles (sedan, van, truck, kart) | CC0 1.0     | glTF/FBX/OBJ  | Ideal for hero car + garage preview                      |
| **Kenney Racing Kit**                  | Additional racing assets                        | CC0 1.0     | glTF          | On Kenney's car tag page                                 |
| **Kenney Toy Car Kit**                 | Stylized/kart-style cars                        | CC0 1.0     | glTF          | Alternative aesthetic                                    |
| **Kenney Starter-Kit-Racing** (GitHub) | Godot template with `.glb` cars + sounds        | CC0 1.0     | glTF          | `.glb` loads straight into `GLTFLoader`                  |
| **Poly Haven 3D**                      | Photoscanned env props (barriers, buildings)    | CC0 1.0     | glTF          | No cars, but trackside objects                           |
| **Sketchfab CC0 Filter**               | ~2,000+ models                                  | CC0 / CC-BY | glTF/GLB/USDZ | **Verify each model's license badge** — skip CC-BY-NC/SA |

**Hero Car Choice:** Kenney "Sports Car" or "Supercar" from Car Kit — low-poly (< 5k tris), loads fast, CC0.

---

## 4. Textures / HDRIs (CC0)

| Source                       | Assets                                                      | License         | Use Case                                  |
| ---------------------------- | ----------------------------------------------------------- | --------------- | ----------------------------------------- |
| **ambientCG**                | Seamless PBR to 8K: Asphalt, Concrete, Metal, Noise, Ground | CC0 1.0         | Track surfaces, kerbs, barriers, env maps |
| **Poly Haven**               | Textures (PBR, ≥8K), HDRIs (env lighting)                   | CC0 1.0         | Showroom HDRI lighting, track textures    |
| **OpenGameArt (CC0 filter)** | Mixed                                                       | CC0 (per asset) | Neon/noise overlays — filter strictly     |

**Note:** Poly Haven live API requires "Powered by Poly Haven" credit — **self-host downloaded assets** to avoid.

---

## 5. UI Sounds (CC0)

| Source                                     | Assets                                         | License         | Notes                          |
| ------------------------------------------ | ---------------------------------------------- | --------------- | ------------------------------ |
| **Kenney Interface Sounds**                | ~100 clicks, snaps, confirmations, minimizes   | CC0 1.0         | Button clicks, UI feedback     |
| **Kenney UI Audio**                        | ~50 button/switch/generic click SFX            | CC0 1.0         | Alternative set                |
| **Kenney Sci-fi / Impact / Digital Audio** | Engine whooshes, boosts, impacts, glitch beeps | CC0 1.0         | Race feedback, HUD sounds      |
| **freesound.org (CC0 filter)**             | Race/engine/crowd SFX                          | CC0 (per sound) | Screenshot license at download |

**All Kenney audio packs confirmed CC0 on kenney.nl.**

---

## 6. CSS/Design Resources (MIT — Code Only)

| Resource     | URL                                    | License | What You Get                                            |
| ------------ | -------------------------------------- | ------- | ------------------------------------------------------- |
| **GlassKit** | https://github.com/JUNGHERZ/GlassKit   | MIT     | 24 pure-CSS glass components, dark/light, tokens        |
| **Glin UI**  | https://github.com/glincker/glinui     | MIT     | Aurora backgrounds, glow borders, prism borders         |
| **liqgui**   | https://github.com/bymehul/liqgui      | MIT     | 15 glass web components, spring physics, 3D tilt        |
| **farvist**  | https://github.com/FloKuersten/farvist | MIT     | Sass glassmorphism, neon/gradient utilities, bg library |
| **arc-ui**   | https://github.com/arc-language/arc-ui | MIT     | CSS-first liquid-glass, ~3KB, zero deps                 |

**Usage:** Reference for patterns — copy code inherits MIT. Keep notices in `THIRD_PARTY_NOTICES.md`.

---

## 7. Do-Not-Use / Caution List

| Asset                                                               | Reason                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| Sketchfab models marked **CC-BY-NC** or **CC-BY-SA**                | NC = no commercial; SA = forces derivative open-source |
| freesound / OpenGameArt items **CC-BY-NC**                          | Commercial use forbidden                               |
| OpenGameArt **GPL 2.0/3.0**                                         | Copyleft contamination for closed-source game          |
| Any asset with "personal use only", "no redistribution", no license | Unclear/restrictive — DO NOT USE per policy            |
| Poly Haven **live API** (not assets)                                | ToS requires attribution; self-host assets instead     |
| Lucide npm (ISC) vs repo (ISC + MIT Feather)                        | Both permissive; keep LICENSE text when redistributing |

---

## 8. Attribution Checklist for Shipping

1. **CC0 (Kenney, ambientCG, Poly Haven, CC0 Sketchfab, CC0 freesound):** No credit required; optional courtesy
2. **CC-BY (most free Sketchfab, some OpenGameArt/freesound):** Credits screen with title, author, source URL, license link
3. **MIT/ISC/Apache code + icons (Phosphor, Tabler, Lucide, Feather, Material Symbols, GlassKit, etc.):** `THIRD_PARTY_NOTICES.md` with copyright/license texts
4. **OFL fonts:** If self-hosting font files, include each font's `OFL.txt` in notices

---

## 9. Recommended Asset Package for P15

| Asset                                           | File                                                | Size          | Purpose                         |
| ----------------------------------------------- | --------------------------------------------------- | ------------- | ------------------------------- |
| Kenney Sports Car                               | `car-sports.glb`                                    | ~50 KB        | Main menu hero + garage preview |
| Kenney UI Sounds                                | `click.ogg`, `confirm.ogg`, `back.ogg`              | ~5 KB each    | Button/navigation feedback      |
| Poly Haven HDRI                                 | `showroom_4k.hdr`                                   | ~2 MB         | Garage/showroom lighting        |
| Phosphor Icons (SVG)                            | `car.svg`, `trophy.svg`, `steering-wheel.svg`, etc. | ~1 KB each    | UI icons                        |
| Orbitron/Rajdhani/Inter/Share Tech Mono (WOFF2) | Subset Latin                                        | ~150 KB total | Typography                      |

**Total added asset weight:** ~2.5 MB (acceptable for browser game)

---

## File: docs/p15-research/P15-ASSET-RESEARCH.md
