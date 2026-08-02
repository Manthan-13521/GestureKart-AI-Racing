// ─── UI Management ─────────────────────────────────────────────────
// Screen switching, HUD updates, minimap, car/track select, controls, pause

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(`screen-${screenId}`).classList.add('active');

  if (screenId === 'track-select') {
    renderTrackGrid();
  }
}

function showControls() {
  document.getElementById('controls-overlay').classList.add('active');
}
function hideControls() {
  document.getElementById('controls-overlay').classList.remove('active');
}

function renderTrackGrid() {
  const grid = document.getElementById('track-grid');
  grid.innerHTML = ALL_TRACKS.map(
    (track, i) => `
    <div class="track-card ${i === selectedTrackIndex ? 'selected' : ''}" onclick="selectTrack(${i})">
      <div class="track-thumb" style="background:${track.bgColor}">
        <canvas id="track-thumb-${i}" width="320" height="180"></canvas>
      </div>
      <div class="track-card-name">${track.name}</div>
      <div class="track-card-desc">${track.desc}</div>
    </div>
  `
  ).join('');

  // Draw track thumbnails on canvases
  ALL_TRACKS.forEach((track, i) => {
    const canvas = document.getElementById(`track-thumb-${i}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width,
      h = canvas.height;

    ctx.fillStyle = track.bgColor;
    ctx.fillRect(0, 0, w, h);

    const pts = track.waypoints;
    ctx.strokeStyle = track.roadEdgeColor;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const pad = 20;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const scaleX = (w - pad * 2) / (maxX - minX || 1);
    const scaleY = (h - pad * 2) / (maxY - minY || 1);
    const sc = Math.min(scaleX, scaleY);
    const ox = (w - (maxX - minX) * sc) / 2 - minX * sc;
    const oy = (h - (maxY - minY) * sc) / 2 - minY * sc;

    pts.forEach((p, i) => {
      const x = p.x * sc + ox;
      const y = p.y * sc + oy;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = track.roadColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = p.x * sc + ox;
      const y = p.y * sc + oy;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });
}

function selectTrack(index) {
  selectedTrackIndex = index;
  document.querySelectorAll('.track-card').forEach((card, i) => {
    card.classList.toggle('selected', i === index);
  });
}

// ─── Race HUD ──────────────────────────────────────────────────────

function updateHUD(state) {
  document.getElementById('hud-pos').textContent = formatPosition(state.playerPosition);
  document.getElementById('hud-lap').textContent = `LAP ${Math.min(state.playerLap + 1, 3)}/3`;
  document.getElementById('hud-speed').querySelector('.speed-val').textContent = Math.floor(
    state.playerSpeed * 100
  );
  document.getElementById('hud-time').textContent = formatTime(state.raceTime);
}

function formatPosition(pos) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = pos % 100;
  return pos + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
}

// ─── Minimap ───────────────────────────────────────────────────────

function updateMinimap(cars, playerIndex, trackPts, track) {
  const canvas = document.getElementById('minimap-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
  ctx.fillRect(0, 0, w, h);

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of trackPts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const pad = 10;
  const scaleX = (w - pad * 2) / (maxX - minX || 1);
  const scaleY = (h - pad * 2) / (maxY - minY || 1);
  const sc = Math.min(scaleX, scaleY);
  const ox = (w - (maxX - minX) * sc) / 2 - minX * sc;
  const oy = (h - (maxY - minY) * sc) / 2 - minY * sc;

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  trackPts.forEach((p, i) => {
    const x = p.x * sc + ox;
    const y = p.y * sc + oy;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();

  cars.forEach((car, i) => {
    const x = car.x * sc + ox;
    const y = car.y * sc + oy;
    const isPlayer = i === playerIndex;
    if (isPlayer) {
      ctx.fillStyle = '#00ff41';
      ctx.shadowColor = '#00ff41';
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 4;
    }
    ctx.beginPath();
    ctx.arc(x, y, isPlayer ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

// ─── Results Screen ────────────────────────────────────────────────

function showResults(cars, playerIndex, raceTime) {
  const sorted = [...cars].sort((a, b) => {
    if (a.finished && !b.finished) return -1;
    if (!a.finished && b.finished) return 1;
    if (a.lap !== b.lap) return b.lap - a.lap;
    return b.progress - a.progress;
  });

  const podium = document.getElementById('results-podium');
  podium.innerHTML = sorted
    .slice(0, 4)
    .map((car, i) => {
      const pos = i + 1;
      const carName = car.carData ? car.carData.name : `Racer ${pos}`;
      const finishTime = car.finished
        ? formatTime(car.finishTime)
        : car.lap >= 3
          ? formatTime(car.totalRaceTime)
          : `LAP ${car.lap}`;
      return `
      <div class="podium-item">
        <div class="podium-place p${pos}">${pos}${pos === 1 ? 'ST' : pos === 2 ? 'ND' : pos === 3 ? 'RD' : 'TH'}</div>
        <div class="podium-bar p${pos}"></div>
        <div class="podium-name">${carName}</div>
        <div class="podium-time">${finishTime}</div>
      </div>
    `;
    })
    .join('');

  const table = document.getElementById('results-table');
  table.innerHTML = `
    <tr><th>POS</th><th>DRIVER</th><th>LAPS</th><th>TIME</th></tr>
    ${sorted
      .map((car, i) => {
        const pos = i + 1;
        const isPlayer = car === cars[playerIndex];
        const carName = car.carData ? car.carData.name : `Racer ${pos}`;
        const finishTime = car.finished
          ? formatTime(car.finishTime)
          : car.lap >= 3
            ? formatTime(car.totalRaceTime)
            : `LAP ${car.lap}`;
        return `<tr class="${isPlayer ? 'player-row' : ''}"><td>${pos}</td><td>${isPlayer ? '★ ' : ''}${carName}</td><td>${Math.min(car.lap + 1, 3)}/3</td><td>${finishTime}</td></tr>`;
      })
      .join('')}
  `;

  showScreen('results');
}

// ─── Init ──────────────────────────────────────────────────────────

let raceStartTime = 0;

function initUI() {
  updateCarPreview();
}
