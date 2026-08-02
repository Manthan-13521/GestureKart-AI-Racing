// ─── Kart Racing — Main Game Loop ──────────────────────────────────
// Handles race initialization, physics, rendering, and game state.

let raceCanvas, raceCtx;
let raceState = 'idle'; // idle | countdown | racing | finished
let raceCars = [];
let playerIndex = 0;
let trackPts = [];
let checkpoints = [];
let raceTime = 0;
let playerLapProgress = {}; // per-lap checkpoint tracking
let lastTimestamp = 0;
let raceAnimFrame = null;
let raceFinishTimeout = null;

// Player car state (initialized in startRace with car stats)
let player = {};

// ─── Start Race ────────────────────────────────────────────────────

function startRace() {
  // Clear any pending finish timeout from previous race
  if (raceFinishTimeout) {
    clearTimeout(raceFinishTimeout);
    raceFinishTimeout = null;
  }
  raceCanvas = document.getElementById('race-canvas');
  raceCtx = raceCanvas.getContext('2d');
  resizeRaceCanvas();

  const track = getSelectedTrack();
  trackPts = getSmoothPath(track.waypoints, 300);
  checkpoints = generateCheckpoints(track, 12);

  // Player start position (beginning of track)
  const startPt = trackPts[0];
  const startPt2 = trackPts[1];
  const startAngle = Math.atan2(startPt2.y - startPt.y, startPt2.x - startPt.x);

  // Calculate the perpendicular to place cars side by side on the grid
  const perpX = -Math.sin(startAngle);
  const perpY = Math.cos(startAngle);

  raceCars = [];

  // Player car
  const playerCar = getSelectedCar();
  const s = playerCar.stats;
  player = {
    x: startPt.x + perpX * 0,
    y: startPt.y + perpY * 0,
    angle: startAngle,
    speed: 0,
    maxSpeed: 1.5 + (s.speed / 100) * 3.5,
    accel: 0.008 + (s.accel / 100) * 0.032,
    brakeForce: 0.03,
    friction: 0.985,
    handling: 1.5 + (s.handling / 100) * 4.0,
    boostPower: 1.0 + (s.boost / 100) * 0.5,
    wheelAngle: 0,
    lap: 0,
    progress: 0,
    finished: false,
    finishTime: 0,
    currentLapTime: 0,
    lapStartTime: 0,
    bestLapTime: 0,
    totalRaceTime: 0,
    checkpointHits: {},
    gripModifier: 1.0,
    spinTimer: 0,
    boostTimer: 0,
    zoneCooldown: 0,
    carData: playerCar,
    isPlayer: true,
  };
  raceCars.push(player);

  // AI cars
  const aiCarIndices = [1, 2, 3, 4].filter((i) => i !== selectedCarIndex);
  for (let i = 0; i < 3; i++) {
    const ci = aiCarIndices[i % aiCarIndices.length];
    const carData = ALL_CARS[ci];
    const ai = createAICar(ci, carData);
    // Position AI on grid behind and to the side
    const offset = (i + 1) * 20;
    ai.x = startPt.x + perpX * ((i % 2 === 0 ? 1 : -1) * (30 + Math.floor(i / 2) * 30));
    ai.y = startPt.y + perpY * ((i % 2 === 0 ? 1 : -1) * (30 + Math.floor(i / 2) * 30)) - offset;
    ai.angle = startAngle;
    ai.speed = 0;
    ai.isPlayer = false;
    ai.carData = carData;
    raceCars.push(ai);
  }

  playerIndex = 0;
  raceTime = 0;
  raceState = 'countdown';

  // Reset overlays
  document.getElementById('race-countdown').classList.remove('active');
  document.getElementById('race-finish').classList.remove('active');

  showScreen('race');

  // Resize canvas after screen is visible (display: flex)
  resizeRaceCanvas();

  // Start countdown
  startCountdownRace();
}

function resizeRaceCanvas() {
  if (!raceCanvas) return;
  raceCanvas.width = raceCanvas.clientWidth;
  raceCanvas.height = raceCanvas.clientHeight;
  raceCtx = raceCanvas.getContext('2d');
}

window.addEventListener('resize', resizeRaceCanvas);

// ─── Countdown ─────────────────────────────────────────────────────

function startCountdownRace() {
  let step = 3;
  const overlay = document.getElementById('race-countdown');
  const numEl = document.getElementById('countdown-num');

  function showStep() {
    if (step > 0) {
      overlay.classList.add('active');
      numEl.textContent = '' + step;
      numEl.className = 'countdown-num';
      // Re-trigger animation
      numEl.style.animation = 'none';
      void numEl.offsetHeight;
      numEl.style.animation = '';
      step--;
      setTimeout(showStep, 800);
    } else if (step === 0) {
      numEl.textContent = 'GO';
      numEl.className = 'countdown-num go';
      numEl.style.animation = 'none';
      void numEl.offsetHeight;
      numEl.style.animation = '';
      step--;
      setTimeout(showStep, 700);
    } else {
      overlay.classList.remove('active');
      raceState = 'racing';
      raceTime = 0;
      lastTimestamp = performance.now();
      if (raceAnimFrame) cancelAnimationFrame(raceAnimFrame);
      raceLoop();
    }
  }

  showStep();
}

// ─── Main Race Loop ────────────────────────────────────────────────

function raceLoop() {
  const now = performance.now();
  const rawDt = (now - lastTimestamp) / 1000;
  lastTimestamp = now;

  if (isPaused) {
    raceAnimFrame = requestAnimationFrame(raceLoop);
    return;
  }

  const dt = Math.min(rawDt, 0.05);
  const track = getSelectedTrack();

  if (raceState === 'racing') {
    raceTime += dt;

    // ---- Update Player ----
    updatePlayer(dt, trackPts);

    // ---- Update AI ----
    const playerProgress = player.progress + player.lap * trackPts.length;
    for (let i = 1; i < raceCars.length; i++) {
      updateAI(raceCars[i], dt, raceTime, playerProgress, player.lap, raceCars, trackPts);
    }

    // ---- Check finish ----
    if (player.finished) {
      raceState = 'finished';
      const finPos = getPlayerPosition();
      document.getElementById('race-finish').classList.add('active');
      document.getElementById('finish-pos').textContent = formatPosition(finPos);
      document.getElementById('finish-time').textContent = formatTime(player.finishTime);
      raceFinishTimeout = setTimeout(() => {
        showResults(raceCars, playerIndex, raceTime);
        raceFinishTimeout = null;
      }, 2000);
    }
  }

  // ---- Render ----
  renderRace(track);

  // ---- HUD & Minimap ----
  if (raceState === 'racing' || raceState === 'finished') {
    updateHUD({
      playerPosition: getPlayerPosition(),
      playerLap: player.lap,
      playerSpeed: player.speed,
      raceTime: raceTime,
    });
    updateMinimap(raceCars, playerIndex, trackPts, track);
  }

  // ---- Countdown HUD update ----
  if (raceState === 'countdown') {
    updateHUD({
      playerPosition: 1,
      playerLap: 0,
      playerSpeed: 0,
      raceTime: 0,
    });
  }

  raceAnimFrame = requestAnimationFrame(raceLoop);
}

// ─── Player Update ─────────────────────────────────────────────────

function updatePlayer(dt, trackPts) {
  if (player.finished) {
    player.totalRaceTime += dt;
    return;
  }

  player.totalRaceTime += dt;
  player.currentLapTime += dt;

  // Keyboard input
  const keys = window.keysDown || {};
  let accel = false,
    brake = false,
    left = false,
    right = false;

  if (keys['ArrowUp'] || keys['w'] || keys['W']) accel = true;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) brake = true;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) left = true;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) right = true;

  // Accelerate / Brake
  if (accel) {
    player.speed = Math.min(player.maxSpeed, player.speed + player.accel * dt * 60);
  } else if (brake) {
    player.speed = Math.max(0, player.speed - player.brakeForce * dt * 60);
  } else {
    player.speed *= player.friction;
    if (player.speed < 0.01) player.speed = 0;
  }

  // Steering (gripModifier = 1.0 normally, <1.0 on ice)
  const grip = player.gripModifier || 1.0;
  const steerSpeed = player.handling * grip * (player.speed / player.maxSpeed + 0.3);
  if (left) {
    player.wheelAngle = Math.max(-1, player.wheelAngle - 0.1 * dt * 60);
  } else if (right) {
    player.wheelAngle = Math.min(1, player.wheelAngle + 0.1 * dt * 60);
  } else {
    player.wheelAngle *= 0.85;
  }

  player.angle += player.wheelAngle * steerSpeed * 0.04 * dt * 60;

  // Move
  player.x += Math.cos(player.angle) * player.speed * dt * 60;
  player.y += Math.sin(player.angle) * player.speed * dt * 60;

  // Find closest track point for progress tracking
  let minDist = Infinity;
  let closestIdx = player.progress;
  const searchRange = 40;
  for (let i = -searchRange; i <= searchRange; i++) {
    const idx = (player.progress + i + trackPts.length) % trackPts.length;
    const px = trackPts[idx].x - player.x;
    const py = trackPts[idx].y - player.y;
    const dist = px * px + py * py;
    if (dist < minDist) {
      minDist = dist;
      closestIdx = idx;
    }
  }

  // Update progress (only forward)
  if (closestIdx > player.progress || (closestIdx < player.progress && closestIdx < 20)) {
    player.progress = closestIdx;
  }

  // Checkpoint detection
  for (const cp of checkpoints) {
    const cpIdx = Math.round((cp.index / cp.total) * trackPts.length);
    if (Math.abs(closestIdx - cpIdx) < 5 && player.progress > cpIdx) {
      if (!player.checkpointHits[cp.index]) {
        player.checkpointHits[cp.index] = true;
      }
    }
  }

  // Lap completion: player passes through start/finish (checkpoint 0)
  // after having hit all or most checkpoints
  if (closestIdx < 10 && player.progress > 10 && player.lap < 3) {
    const hitCount = Object.keys(player.checkpointHits).length;
    if (hitCount >= checkpoints.length * 0.5) {
      player.lap++;
      if (player.lap >= 3) {
        player.finished = true;
        player.finishTime = player.totalRaceTime;
      }
      player.checkpointHits = {};
      player.currentLapTime = 0;
      player.lapStartTime = player.totalRaceTime;
    }
  }

  // ── Zone effects (hazards, boosts, ice, spins) ──
  if (player.zoneCooldown > 0) player.zoneCooldown -= dt;
  if (player.spinTimer > 0) player.spinTimer -= dt;
  if (player.boostTimer > 0) player.boostTimer -= dt;
  player.gripModifier = 1.0;

  const track = getSelectedTrack();
  if (track.zones && player.zoneCooldown <= 0) {
    for (const zone of track.zones) {
      if (Math.abs(player.x - zone.x) < zone.w && Math.abs(player.y - zone.y) < zone.h) {
        // Check if player car is Camo Tank (high durability)
        let effectMult = 1.0;
        if (
          player.carData &&
          player.carData.id === 'camo-tank' &&
          (zone.type === 'hazard' || zone.type === 'spin')
        ) {
          effectMult = 0.3;
        }

        if (zone.type === 'hazard') {
          player.speed *= 1 - zone.strength * 0.25 * effectMult;
          player.zoneCooldown = 1.5;
        } else if (zone.type === 'boost') {
          player.speed = Math.min(player.maxSpeed * 1.4, player.speed + zone.strength * effectMult * 1.2);
          player.boostTimer = 0.6;
          player.zoneCooldown = 0.8;
        } else if (zone.type === 'spin') {
          if (effectMult > 0.3) {
            player.spinTimer = zone.strength * 0.4 * effectMult;
            player.speed *= 0.6;
            player.zoneCooldown = 2.5;
          }
        } else if (zone.type === 'ice') {
          player.gripModifier = 1.0 - zone.strength * 0.35;
        }
        break;
      }
    }
  }

  // Apply spin-out (temporary loss of control)
  if (player.spinTimer > 0) {
    player.angle += player.spinTimer * 0.15;
  }

  // Apply grip modifier to steering (ice)
  const effectiveHandling = player.handling * player.gripModifier;

  // Keep player on track - pull toward center if off road
  const closestPt = trackPts[closestIdx];
  const offX = player.x - closestPt.x;
  const offY = player.y - closestPt.y;
  const offDist = Math.sqrt(offX * offX + offY * offY);
  if (offDist > 60) {
    const pull = 0.025;
    player.x -= offX * pull;
    player.y -= offY * pull;
    player.speed *= 0.92;
  }
}

// ─── Get Player Position ───────────────────────────────────────────

function getPlayerPosition() {
  const playerProgress = player.lap * trackPts.length + player.progress;
  let pos = 1;
  for (let i = 1; i < raceCars.length; i++) {
    const car = raceCars[i];
    const carProgress = car.lap * trackPts.length + car.progress;
    if (carProgress > playerProgress) pos++;
  }
  return pos;
}

// ─── Render Race ───────────────────────────────────────────────────

function renderRace(track) {
  const canvas = raceCanvas;
  const ctx = raceCtx;
  if (!ctx) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  // Camera follows player
  const camX = player.x;
  const camY = player.y;
  const zoom = 0.6;

  // Background
  ctx.fillStyle = track.bgColor || '#0a0c12';
  ctx.fillRect(0, 0, w, h);

  // ---- Draw scenery (behind road) ----
  if (track.renderScenery) {
    track.renderScenery(ctx, camX, camY, zoom, raceTime * 60);
  }

  // ---- Draw road ----
  renderRoad(ctx, trackPts, track, camX, camY, zoom);

  // ---- Draw checkpoints ----
  renderCheckpoints(ctx, camX, camY, zoom);

  // ---- Draw cars ----
  // Sort by Y for depth ordering
  const sortedCars = [...raceCars].sort((a, b) => {
    const ay = (a.y - camY) * zoom;
    const by = (b.y - camY) * zoom;
    return ay - by;
  });

  for (const car of sortedCars) {
    const sx = (car.x - camX) * zoom + w / 2;
    const sy = (car.y - camY) * zoom + h / 2;
    const carW = 60 * zoom;
    const carH = 30 * zoom;

    if (car.carData && car.carData.draw) {
      ctx.save();
      ctx.translate(sx, sy);
      car.carData.draw(ctx, carW, carH, car.angle, raceTime * 60);
      ctx.restore();
    } else {
      // Fallback car drawing
      const oldTrans = ctx.getTransform();
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(car.angle);
      ctx.fillStyle = car.isPlayer ? '#00ff41' : '#ff4444';
      ctx.beginPath();
      ctx.ellipse(0, 0, carW / 2, carH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---- Draw car labels above player ----
  if (raceState === 'racing' || raceState === 'countdown') {
    const px = (player.x - camX) * zoom + w / 2;
    const py = (player.y - camY) * zoom + h / 2 - 25 * zoom;
    ctx.fillStyle = 'rgba(0, 255, 65, 0.4)';
    ctx.font = `${10 * zoom}px Orbitron, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('▼', px, py);
  }
}

// ─── Road Rendering ────────────────────────────────────────────────

function renderRoad(ctx, pts, track, camX, camY, zoom) {
  const w = ctx.canvas.clientWidth;
  const h = ctx.canvas.clientHeight;
  const roadWidth = 50;
  const halfW = roadWidth;

  // Draw offroad background for the whole track area
  ctx.fillStyle = track.offroadColor || '#1a1a1a';
  ctx.beginPath();
  // Draw a thick path underneath the road
  pts.forEach((p, i) => {
    const sx = (p.x - camX) * zoom + w / 2;
    const sy = (p.y - camY) * zoom + h / 2;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.lineWidth = roadWidth * 2 * zoom;
  ctx.strokeStyle = track.offroadColor || '#1a1a1a';
  ctx.stroke();

  // Road surface
  ctx.strokeStyle = track.roadColor || '#333';
  ctx.lineWidth = roadWidth * zoom;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => {
    const sx = (p.x - camX) * zoom + w / 2;
    const sy = (p.y - camY) * zoom + h / 2;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.stroke();

  // Road edge lines
  ctx.strokeStyle = track.roadEdgeColor || '#fff';
  ctx.lineWidth = 2 * zoom;
  ctx.setLineDash([]);
  ctx.beginPath();
  pts.forEach((p, i) => {
    const sx = (p.x - camX) * zoom + w / 2;
    const sy = (p.y - camY) * zoom + h / 2;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.stroke();

  // Dashed center line
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.5 * zoom;
  ctx.setLineDash([6 * zoom, 8 * zoom]);
  ctx.beginPath();
  pts.forEach((p, i) => {
    const sx = (p.x - camX) * zoom + w / 2;
    const sy = (p.y - camY) * zoom + h / 2;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // Start/finish line
  const startPt = pts[0];
  const startPt2 = pts[1];
  const sdx = startPt2.x - startPt.x;
  const sdy = startPt2.y - startPt.y;
  const slen = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
  const spx = (-sdy / slen) * roadWidth * zoom;
  const spy = (sdx / slen) * roadWidth * zoom;

  const ssx = (startPt.x - camX) * zoom + w / 2;
  const ssy = (startPt.y - camY) * zoom + h / 2;

  // Checkerboard start/finish
  ctx.fillStyle = '#fff';
  ctx.fillRect(ssx + spx, ssy + spy, 4 * zoom, -spy * 2);
  ctx.fillStyle = '#000';
  for (let i = 0; i < 8; i++) {
    const frac = i / 8;
    const fx = ssx + spx * (1 - frac * 2);
    const fy = ssy + spy * (1 - frac * 2);
    ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000';
    ctx.fillRect(fx, fy, 4 * zoom, -spy / 4);
  }
}

// ─── Render Checkpoints ────────────────────────────────────────────

function renderCheckpoints(ctx, camX, camY, zoom) {
  // Visual checkpoint indicators (subtle)
  for (let i = 0; i < checkpoints.length; i++) {
    const cp = checkpoints[i];
    const sx = (cp.x - camX) * zoom + ctx.canvas.clientWidth / 2;
    const sy = (cp.y - camY) * zoom + ctx.canvas.clientHeight / 2;

    // Only render if close to camera
    if (sx < -50 || sx > ctx.canvas.clientWidth + 50) continue;
    if (sy < -50 || sy > ctx.canvas.clientHeight + 50) continue;

    const hit = player.checkpointHits[cp.index];
    ctx.fillStyle = hit ? 'rgba(0,255,65,0.15)' : 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = hit ? 'rgba(0,255,65,0.3)' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.fillRect(sx - 3, sy - 15, 6, 30);
    ctx.strokeRect(sx - 3, sy - 15, 6, 30);
  }
}

// ─── Keyboard handling ─────────────────────────────────────────────

let isPaused = false;

window.keysDown = {};
window.addEventListener('keydown', (e) => {
  window.keysDown[e.key] = true;
  if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (raceState === 'racing' || raceState === 'countdown') {
      togglePause();
    }
  }
});
window.addEventListener('keyup', (e) => {
  window.keysDown[e.key] = false;
});

// ─── Pause / Quit ──────────────────────────────────────────────────

function togglePause() {
  if (raceState !== 'racing' && raceState !== 'countdown') return;
  isPaused = !isPaused;
  document.getElementById('race-paused').classList.toggle('active', isPaused);
  if (!isPaused && raceState === 'racing') {
    lastTimestamp = performance.now();
  }
}

function quitRace() {
  isPaused = false;
  raceState = 'idle';
  document.getElementById('race-paused').classList.remove('active');
  document.getElementById('race-finish').classList.remove('active');
  if (raceAnimFrame) {
    cancelAnimationFrame(raceAnimFrame);
    raceAnimFrame = null;
  }
  if (raceFinishTimeout) {
    clearTimeout(raceFinishTimeout);
    raceFinishTimeout = null;
  }
  showScreen('menu');
}
