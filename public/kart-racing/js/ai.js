// ─── AI Opponent Logic ─────────────────────────────────────────────
// Each AI follows waypoints with rubber-banding speed adjustment.

function createAICar(carIndex, carData) {
  const track = getSelectedTrack();
  const pts = getSmoothPath(track.waypoints, 200);

  // Random starting position offset along the track
  const startOffset = Math.floor(pts.length * (0.1 + Math.random() * 0.3));
  const baseX = 30 + Math.random() * 30 - 15;
  const baseY = 30 + Math.random() * 30 - 15;

  const s = carData.stats;
  return {
    carIndex: carIndex,
    carData: carData,
    x: pts[startOffset % pts.length].x + baseX,
    y: pts[startOffset % pts.length].y + baseY,
    angle: 0,
    speed: 0,
    maxSpeed: (1.2 + (s.speed / 100) * 2.5) * (0.8 + Math.random() * 0.15),
    accel: (0.006 + (s.accel / 100) * 0.02) * (0.8 + Math.random() * 0.15),
    handling: (1.0 + (s.handling / 100) * 3.0) * (0.8 + Math.random() * 0.15),
    boostPower: 1.0 + (s.boost / 100) * 0.4,
    progress: startOffset,
    lap: 0,
    finished: false,
    finishTime: 0,
    bestLapTime: 0,
    currentLapTime: 0,
    lapStartTime: 0,
    totalRaceTime: 0,
    personality: {
      aggression: Math.random() * 0.6,
      consistency: 0.5 + Math.random() * 0.5,
      braking: 0.3 + Math.random() * 0.4,
    },
  };
}

function updateAI(ai, dt, raceTime, playerProgress, playerLap, allCars, trackPts) {
  if (ai.finished) {
    ai.totalRaceTime += dt;
    return;
  }

  ai.totalRaceTime += dt;
  ai.currentLapTime += dt;

  // Rubber-banding: adjust target speed based on distance to player
  // Player progress is the benchmark
  const progressDiff = playerProgress - ai.progress + (playerLap - ai.lap) * trackPts.length;

  let speedMod = 1.0;
  if (progressDiff > 80) {
    speedMod = 1.0 + Math.min(0.3, (progressDiff - 80) / 300);
  } else if (progressDiff < -80) {
    speedMod = 1.0 - Math.min(0.25, Math.abs(progressDiff + 80) / 300);
  }

  // Apply personality consistency (random variation)
  const randomVar = (Math.random() - 0.5) * 0.3 * (1 - ai.personality.consistency);

  // Target speed
  const targetSpeed = ai.maxSpeed * speedMod + randomVar;

  // Accelerate or brake
  if (ai.speed < targetSpeed) {
    ai.speed = Math.min(targetSpeed, ai.speed + ai.accel * dt * 60);
  } else {
    ai.speed = Math.max(targetSpeed, ai.speed - ai.accel * 0.5 * dt * 60);
  }
  ai.speed = Math.max(0, ai.speed);

  // Move along track: find the closest point on the track path
  const lookAhead = Math.floor(ai.speed * 3);
  const nextIdx = (ai.progress + lookAhead) % trackPts.length;
  const target = trackPts[nextIdx];

  // Steer toward the target point
  const dx = target.x - ai.x;
  const dy = target.y - ai.y;
  const targetAngle = Math.atan2(dy, dx);
  let angleDiff = targetAngle - ai.angle;

  // Normalize angle difference
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  const steerAmount = angleDiff * ai.handling * 0.05 * dt * 60;
  ai.angle += steerAmount;

  // Move
  ai.x += Math.cos(ai.angle) * ai.speed * dt * 60;
  ai.y += Math.sin(ai.angle) * ai.speed * dt * 60;

  // Update progress along track: find closest path point
  let minDist = Infinity;
  let closestIdx = ai.progress;
  const searchRange = 30;
  for (let i = -searchRange; i <= searchRange; i++) {
    const idx = (ai.progress + i + trackPts.length) % trackPts.length;
    const px = trackPts[idx].x - ai.x;
    const py = trackPts[idx].y - ai.y;
    const dist = px * px + py * py;
    if (dist < minDist) {
      minDist = dist;
      closestIdx = idx;
    }
  }

  // Update progress (only go forward)
  if (closestIdx > ai.progress || (closestIdx < ai.progress && closestIdx < 10)) {
    ai.progress = closestIdx;
  }

  // Check if AI completed a lap (progress wraps around)
  if (ai.progress < 10 && ai.lap >= 0) {
    ai.lap++;
    if (ai.lap >= 3) {
      ai.finished = true;
      ai.finishTime = ai.totalRaceTime;
    }
  }

  // Keep AI on the road by pulling toward track center if too far off
  const closest = trackPts[closestIdx];
  const offX = ai.x - closest.x;
  const offY = ai.y - closest.y;
  const offDist = Math.sqrt(offX * offX + offY * offY);
  if (offDist > 40) {
    const pull = 0.02;
    ai.x -= offX * pull;
    ai.y -= offY * pull;
  }
}

// Get AI lap+progress for position tracking
function getAIProgress(ai, trackLength) {
  return ai.lap * trackLength + ai.progress;
}
