// ─── Car Definitions ───────────────────────────────────────────────
// All draw functions expect ctx to already be positioned and rotated.
// Car center is at (0,0). Caller handles ctx.save/translate/rotate/restore.

const ALL_CARS = [
  {
    id: 'shark',
    name: 'Shark Racer',
    desc: 'High speed, low handling — a straight-line predator.',
    stats: { speed: 85, accel: 60, handling: 40, boost: 70 },
    colors: { body: '#1a6aff', accent: '#ff4444', trim: '#ffffff' },
    draw: function (ctx, w, h, angle, frame) {
      const bw = w * 0.7,
        bh = h * 0.5;

      ctx.save();
      ctx.rotate(angle);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(2, 4, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main body
      ctx.fillStyle = this.colors.body;
      ctx.beginPath();
      ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shark fin (rear spoiler)
      ctx.fillStyle = this.colors.accent;
      ctx.beginPath();
      ctx.moveTo(bw * 0.15, -bh * 0.3);
      ctx.lineTo(bw * 0.15, -bh * 0.9);
      ctx.lineTo(-bw * 0.15, -bh * 0.3);
      ctx.closePath();
      ctx.fill();

      // Teeth on front grille
      ctx.fillStyle = '#fff';
      for (let i = -3; i <= 3; i++) {
        ctx.fillRect(bw * 0.35, i * 5 - 2.5, 8, 5);
      }

      // Windshield
      ctx.fillStyle = 'rgba(100,200,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(bw * 0.1, 0, bw * 0.22, bh * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#222';
      for (const wx of [-bw * 0.4, bw * 0.4]) {
        for (const wy of [-bh * 0.45, bh * 0.45]) {
          ctx.beginPath();
          ctx.ellipse(wx, wy, 5, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Eye (shark theme)
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(bw * 0.25, -bh * 0.15, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(bw * 0.27, -bh * 0.15, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
  },
  {
    id: 'inferno',
    name: 'Inferno Racer',
    desc: 'Blazing boost with a fiery exhaust trail.',
    stats: { speed: 65, accel: 70, handling: 55, boost: 90 },
    colors: { body: '#8b2fc0', accent: '#ff6600', trim: '#ffcc00' },
    draw: function (ctx, w, h, angle, frame) {
      const bw = w * 0.7,
        bh = h * 0.5;

      ctx.save();
      ctx.rotate(angle);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(2, 4, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (purple-orange gradient)
      const grad = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
      grad.addColorStop(0, this.colors.accent);
      grad.addColorStop(0.5, this.colors.body);
      grad.addColorStop(1, '#440066');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flame decals
      for (let i = 0; i < 5; i++) {
        const fx = -bw * 0.2 + i * bw * 0.15;
        const fy = Math.sin(i * 2.5 + frame * 0.1) * 6;
        ctx.fillStyle = `rgba(255, ${150 - i * 20}, 0, 0.6)`;
        ctx.beginPath();
        ctx.moveTo(fx - 4, -bh * 0.2 + fy);
        ctx.quadraticCurveTo(fx, -bh * 0.5 + fy + Math.sin(frame * 0.15 + i) * 4, fx + 4, -bh * 0.2 + fy);
        ctx.fill();
      }

      // Fire trail particles (exhaust)
      for (let i = 0; i < 8; i++) {
        const px = -bw * 0.4 - i * 6 - ((frame * 2) % 20);
        const py = Math.sin(i + frame * 0.2) * 8;
        const size = 4 - i * 0.4;
        if (size > 0) {
          ctx.fillStyle = `rgba(255, ${200 - i * 20}, 0, ${1 - i * 0.1})`;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0, size), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Windshield
      ctx.fillStyle = 'rgba(255,150,50,0.4)';
      ctx.beginPath();
      ctx.ellipse(bw * 0.1, 0, bw * 0.2, bh * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#222';
      for (const wx of [-bw * 0.4, bw * 0.4]) {
        for (const wy of [-bh * 0.45, bh * 0.45]) {
          ctx.beginPath();
          ctx.ellipse(wx, wy, 5, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    },
  },
  {
    id: 'pink-paw',
    name: 'Pink Paw Racer',
    desc: 'Superb handling with a sleek, low profile.',
    stats: { speed: 55, accel: 65, handling: 90, boost: 40 },
    colors: { body: '#ff69b4', accent: '#ffffff', trim: '#ff1493' },
    draw: function (ctx, w, h, angle, frame) {
      const bw = w * 0.65,
        bh = h * 0.45;

      ctx.save();
      ctx.rotate(angle);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(2, 4, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = this.colors.body;
      ctx.beginPath();
      ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Paw print livery
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(bw * 0.05, 0, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      for (const px of [-bw * 0.12, -bw * 0.05, bw * 0.15, bw * 0.22]) {
        ctx.beginPath();
        ctx.ellipse(px, -bh * 0.15, 4, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px, bh * 0.15, 4, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Windshield
      ctx.fillStyle = 'rgba(255,150,200,0.5)';
      ctx.beginPath();
      ctx.ellipse(bw * 0.12, 0, bw * 0.2, bh * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = this.colors.trim;
      for (const wx of [-bw * 0.4, bw * 0.4]) {
        for (const wy of [-bh * 0.45, bh * 0.45]) {
          ctx.beginPath();
          ctx.ellipse(wx, wy, 4, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    },
  },
  {
    id: 'camo-tank',
    name: 'Camo Tank Racer',
    desc: 'Armored and durable, shrugs off hazards.',
    stats: { speed: 40, accel: 35, handling: 30, boost: 50 },
    colors: { body: '#4a5a3a', accent: '#6b7b5a', trim: '#2a3a1a' },
    draw: function (ctx, w, h, angle, frame) {
      const bw = w * 0.8,
        bh = h * 0.6;

      ctx.save();
      ctx.rotate(angle);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(3, 5, bw / 2 + 4, bh / 2 + 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Armored body (boxy)
      ctx.fillStyle = this.colors.body;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);

      // Camo patches
      ctx.fillStyle = 'rgba(90,110,70,0.5)';
      ctx.beginPath();
      ctx.ellipse(-bw * 0.15, -bh * 0.1, 12, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(50,60,30,0.5)';
      ctx.beginPath();
      ctx.ellipse(bw * 0.1, bh * 0.1, 10, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(110,130,90,0.4)';
      ctx.beginPath();
      ctx.ellipse(bw * 0.2, -bh * 0.15, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tank treads
      ctx.fillStyle = this.colors.trim;
      for (const sx of [-1, 1]) {
        ctx.fillRect(sx * (bw / 2 + 2), -bh * 0.4, 6, bh * 0.8);
        ctx.strokeStyle = '#3a4a2a';
        ctx.lineWidth = 1;
        for (let ty = -bh * 0.35; ty < bh * 0.35; ty += 5) {
          ctx.beginPath();
          ctx.moveTo(sx * (bw / 2 + 1), ty);
          ctx.lineTo(sx * (bw / 2 + 6), ty + 2.5);
          ctx.stroke();
        }
      }

      // Armor plates
      ctx.fillStyle = '#5a6a4a';
      ctx.fillRect(-bw * 0.35, -bh * 0.55, bw * 0.7, 6);
      ctx.fillRect(-bw * 0.35, bh * 0.5, bw * 0.7, 6);

      // Driver slit
      ctx.fillStyle = 'rgba(100,150,200,0.4)';
      ctx.fillRect(-bw * 0.08, -bh * 0.12, bw * 0.16, bh * 0.24);

      // Wheels (tank-style)
      ctx.fillStyle = '#333';
      for (const sx of [-1, 1]) {
        for (let wy = -bh * 0.3; wy <= bh * 0.3; wy += bh * 0.2) {
          ctx.beginPath();
          ctx.arc(sx * (bw / 2 - 2), wy, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    },
  },
  {
    id: 'astro',
    name: 'Astro Racer',
    desc: 'Balanced stats with a space-suited driver.',
    stats: { speed: 65, accel: 65, handling: 65, boost: 65 },
    colors: { body: '#00ced1', accent: '#ffffff', trim: '#ff69b4' },
    draw: function (ctx, w, h, angle, frame) {
      const bw = w * 0.68,
        bh = h * 0.48;

      ctx.save();
      ctx.rotate(angle);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(2, 4, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (teal/cyan)
      ctx.fillStyle = this.colors.body;
      ctx.beginPath();
      ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Polka dots (space suit style)
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      for (const dot of [
        [-bw * 0.2, -bh * 0.2, 5],
        [bw * 0.1, -bh * 0.15, 4],
        [-bw * 0.1, bh * 0.2, 6],
        [bw * 0.2, bh * 0.1, 4],
      ]) {
        ctx.beginPath();
        ctx.arc(dot[0], dot[1], dot[2], 0, Math.PI * 2);
        ctx.fill();
      }

      // Astronaut bubble helmet
      ctx.fillStyle = 'rgba(180,230,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(bw * 0.12, 0, bw * 0.18, bh * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Helmet visor glare
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(bw * 0.18, -bh * 0.05, 6, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Space suit details (white trims)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-bw * 0.2, -bh * 0.35);
      ctx.lineTo(bw * 0.25, -bh * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-bw * 0.2, bh * 0.35);
      ctx.lineTo(bw * 0.25, bh * 0.35);
      ctx.stroke();

      // Wheels
      ctx.fillStyle = '#333';
      for (const wx of [-bw * 0.4, bw * 0.4]) {
        for (const wy of [-bh * 0.45, bh * 0.45]) {
          ctx.beginPath();
          ctx.ellipse(wx, wy, 4, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    },
  },
];

let selectedCarIndex = 0;
let selectedTrackIndex = 0;

function getSelectedCar() {
  return ALL_CARS[selectedCarIndex];
}
function getSelectedTrack() {
  return ALL_TRACKS[selectedTrackIndex];
}
function prevCar() {
  selectedCarIndex = (selectedCarIndex - 1 + ALL_CARS.length) % ALL_CARS.length;
  updateCarPreview();
}
function nextCar() {
  selectedCarIndex = (selectedCarIndex + 1) % ALL_CARS.length;
  updateCarPreview();
}

function updateCarPreview() {
  const car = getSelectedCar();
  document.getElementById('car-name').textContent = car.name;
  document.getElementById('car-desc').textContent = car.desc;
  document.getElementById('car-counter').textContent = `${selectedCarIndex + 1} / ${ALL_CARS.length}`;

  const statNames = ['speed', 'accel', 'handling', 'boost'];
  const statBars = document.getElementById('car-stats');
  statBars.innerHTML = statNames
    .map(
      (s) => `
    <div class="stat-row">
      <span>${s.toUpperCase()}</span>
      <div class="stat-bar"><div class="stat-fill ${s}" style="width:${car.stats[s]}%"></div></div>
    </div>
  `
    )
    .join('');

  const canvas = document.getElementById('car-preview');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#11141c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid effect
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw car at center, facing right
  ctx.save();
  ctx.translate(200, 150);
  car.draw(ctx, 200, 150, 0, 0);
  ctx.restore();
}
