// ─── Track Definitions ─────────────────────────────────────────────
// Each track is a closed loop defined by waypoints.
// The renderTrack function draws the road, checkpoints, and scenery.

const ALL_TRACKS = [
  {
    id: 'volcanic',
    name: 'Volcanic Bone Canyon',
    desc: 'Cracked lava ground through dinosaur bone arches.',
    color: '#ff6b35',
    bgColor: '#1a0a00',
    roadColor: '#3a2a1a',
    roadEdgeColor: '#ff4400',
    offroadColor: '#2a1a0a',
    // Waypoints form a closed circuit
    waypoints: [
      { x: 400, y: 100 }, // top
      { x: 700, y: 200 }, // top-right
      { x: 750, y: 500 }, // right
      { x: 600, y: 700 }, // bottom-right
      { x: 300, y: 750 }, // bottom
      { x: 100, y: 600 }, // bottom-left
      { x: 50, y: 350 }, // left
      { x: 150, y: 200 }, // top-left
    ],
    checkpoints: null, // auto-generated
    zones: [
      // Hazard pads (slowdown)
      { x: 340, y: 320, w: 20, h: 12, type: 'hazard', strength: 0.5 },
      { x: 420, y: 380, w: 20, h: 12, type: 'hazard', strength: 0.5 },
      { x: 500, y: 440, w: 20, h: 12, type: 'hazard', strength: 0.6 },
      { x: 400, y: 560, w: 20, h: 12, type: 'hazard', strength: 0.5 },
      { x: 280, y: 520, w: 20, h: 12, type: 'hazard', strength: 0.5 },
      { x: 180, y: 400, w: 20, h: 12, type: 'hazard', strength: 0.6 },
    ],
    renderScenery: function (ctx, camX, camY, zoom, frame) {
      // Lava flows along track edges
      for (let i = 0; i < 12; i++) {
        const lx = 100 + i * 60 + Math.sin(i * 1.3 + frame * 0.02) * 20;
        const ly = 200 + i * 45 + Math.cos(i * 1.7 + frame * 0.015) * 15;
        const sx = (lx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (ly - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -50 || sx > ctx.canvas.width + 50 || sy < -50 || sy > ctx.canvas.height + 50) continue;
        ctx.fillStyle = `rgba(255, ${100 + Math.sin(frame * 0.05 + i) * 50}, 0, 0.6)`;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 15 * zoom, 6 * zoom, i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Volcanoes in background
      for (let i = 0; i < 3; i++) {
        const vx = 200 + i * 200;
        const vy = 50;
        const sx = (vx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (vy - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -80 || sx > ctx.canvas.width + 80) continue;
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.moveTo(sx - 40 * zoom, sy + 40 * zoom);
        ctx.lineTo(sx, sy - 30 * zoom);
        ctx.lineTo(sx + 40 * zoom, sy + 40 * zoom);
        ctx.closePath();
        ctx.fill();
        const glow = 0.4 + Math.sin(frame * 0.04 + i * 2) * 0.3;
        ctx.fillStyle = `rgba(255, 100, 0, ${glow})`;
        ctx.beginPath();
        ctx.arc(sx, sy - 20 * zoom, 10 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dinosaur skeleton arches
      for (let i = 0; i < 4; i++) {
        const ax = 250 + i * 130;
        const ay = 400 + (i % 2 === 0 ? 80 : -60);
        const sx = (ax - camX) * zoom + ctx.canvas.width / 2;
        const sy = (ay - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -40 || sx > ctx.canvas.width + 40) continue;
        ctx.strokeStyle = 'rgba(200,180,150,0.3)';
        ctx.lineWidth = 3 * zoom;
        ctx.beginPath();
        ctx.arc(sx, sy, 25 * zoom, Math.PI, 0);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(200,180,150,0.15)';
        ctx.lineWidth = 1.5 * zoom;
        for (let r = -20; r <= 20; r += 8) {
          ctx.beginPath();
          ctx.moveTo(sx + r * zoom, sy);
          ctx.lineTo(sx + (r - 5) * zoom, sy + 20 * zoom);
          ctx.stroke();
        }
      }

      // Yellow hazard pads on road
      for (let i = 0; i < 6; i++) {
        const hx = 300 + i * 80 + Math.sin(i * 2) * 15;
        const hy = 300 + i * 60 + Math.cos(i * 3) * 12;
        const sx = (hx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (hy - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -20 || sx > ctx.canvas.width + 20) continue;
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(sx - 8 * zoom, sy - 4 * zoom, 16 * zoom, 8 * zoom);
        ctx.fillStyle = '#ff0000';
        ctx.font = `${10 * zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('⚠', sx, sy + 3 * zoom);
      }
    },
  },
  {
    id: 'candy',
    name: 'Candy Cane Glacier',
    desc: 'Icy road with candy cane rails and a donut arch.',
    color: '#ff6b9d',
    bgColor: '#1a2a3a',
    roadColor: '#c8e0f0',
    roadEdgeColor: '#ff4488',
    offroadColor: '#d8e8f8',
    waypoints: [
      { x: 400, y: 80 },
      { x: 680, y: 180 },
      { x: 780, y: 420 },
      { x: 680, y: 680 },
      { x: 400, y: 780 },
      { x: 120, y: 680 },
      { x: 20, y: 420 },
      { x: 120, y: 180 },
    ],
    checkpoints: null,
    zones: [
      { x: 400, y: 150, w: 40, h: 16, type: 'ice', strength: 0.5 },
      { x: 680, y: 350, w: 40, h: 16, type: 'ice', strength: 0.6 },
      { x: 520, y: 680, w: 40, h: 16, type: 'ice', strength: 0.5 },
      { x: 200, y: 520, w: 40, h: 16, type: 'ice', strength: 0.6 },
      { x: 100, y: 300, w: 40, h: 16, type: 'ice', strength: 0.5 },
    ],
    renderScenery: function (ctx, camX, camY, zoom, frame) {
      // Snowy mountains in bg
      for (let i = 0; i < 4; i++) {
        const mx = 100 + i * 200;
        const my = 60;
        const sx = (mx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (my - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -60 || sx > ctx.canvas.width + 60) continue;
        ctx.fillStyle = '#4a6a8a';
        ctx.beginPath();
        ctx.moveTo(sx - 50 * zoom, sy + 30 * zoom);
        ctx.lineTo(sx, sy - 40 * zoom);
        ctx.lineTo(sx + 50 * zoom, sy + 30 * zoom);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(sx - 10 * zoom, sy - 5 * zoom);
        ctx.lineTo(sx, sy - 40 * zoom);
        ctx.lineTo(sx + 10 * zoom, sy - 5 * zoom);
        ctx.closePath();
        ctx.fill();
      }

      // Candy cane guardrails
      for (let i = 0; i < 30; i++) {
        const cx = 100 + i * 25;
        const cy = 150 + Math.sin(i * 0.8) * 60;
        const sx = (cx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (cy - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -20 || sx > ctx.canvas.width + 20) continue;
        const color = i % 2 === 0 ? '#ff2244' : '#ffffff';
        ctx.fillStyle = color;
        ctx.fillRect(sx - 2 * zoom, sy, 4 * zoom, 12 * zoom);
      }

      // Gingerbread men
      for (let i = 0; i < 5; i++) {
        const gx = 200 + i * 140;
        const gy = 500 + Math.sin(i * 1.5) * 40;
        const sx = (gx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (gy - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -15 || sx > ctx.canvas.width + 15) continue;
        ctx.fillStyle = '#c4883c';
        ctx.beginPath();
        ctx.arc(sx, sy - 8 * zoom, 6 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(sx - 4 * zoom, sy - 3 * zoom, 8 * zoom, 10 * zoom);
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx - 2 * zoom, sy - 8 * zoom, 2 * zoom, 2 * zoom);
        ctx.fillRect(sx + 1 * zoom, sy - 8 * zoom, 2 * zoom, 2 * zoom);
      }

      // Giant chocolate donut arch
      const dx = 400,
        dy = 400;
      const dsx = (dx - camX) * zoom + ctx.canvas.width / 2;
      const dsy = (dy - camY) * zoom + ctx.canvas.height / 2;
      const donutR = 50 * zoom;
      ctx.strokeStyle = '#6b3a1a';
      ctx.lineWidth = 20 * zoom;
      ctx.beginPath();
      ctx.arc(dsx, dsy, donutR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ff69b4';
      ctx.lineWidth = 4 * zoom;
      ctx.beginPath();
      ctx.arc(dsx, dsy, donutR, 0, Math.PI * 2);
      ctx.stroke();

      // Pastel clouds
      for (let i = 0; i < 6; i++) {
        const cx2 = 100 + i * 120 + Math.sin(i) * 30;
        const cy2 = 30 + Math.cos(i * 2) * 10;
        const sxc = (cx2 - camX) * zoom + ctx.canvas.width / 2;
        const syc = (cy2 - camY) * zoom + ctx.canvas.height / 2;
        ctx.fillStyle = `rgba(255, 200, 220, 0.2)`;
        ctx.beginPath();
        ctx.arc(sxc, syc, 30 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: 'neon-city',
    name: 'Neon Rocket City',
    desc: 'Futuristic night city with neon glow and boost pads.',
    color: '#ff00ff',
    bgColor: '#0a001a',
    roadColor: '#1a0a2a',
    roadEdgeColor: '#ff00ff',
    offroadColor: '#0a0020',
    waypoints: [
      { x: 400, y: 70 },
      { x: 700, y: 150 },
      { x: 780, y: 400 },
      { x: 700, y: 650 },
      { x: 400, y: 780 },
      { x: 100, y: 650 },
      { x: 20, y: 400 },
      { x: 100, y: 150 },
    ],
    checkpoints: null,
    zones: [
      { x: 250, y: 260, w: 24, h: 14, type: 'boost', strength: 1.5 },
      { x: 550, y: 250, w: 24, h: 14, type: 'boost', strength: 1.5 },
      { x: 700, y: 450, w: 24, h: 14, type: 'boost', strength: 1.5 },
      { x: 600, y: 700, w: 24, h: 14, type: 'boost', strength: 1.5 },
      { x: 250, y: 660, w: 24, h: 14, type: 'boost', strength: 1.5 },
      { x: 70, y: 400, w: 24, h: 14, type: 'boost', strength: 1.5 },
    ],
    renderScenery: function (ctx, camX, camY, zoom, frame) {
      // Night skyline buildings
      const neonColors = ['#ff00ff', '#00ffff', '#ff4488', '#44ff88', '#ffff00'];
      for (let i = 0; i < 10; i++) {
        const bx = 80 + i * 80 + Math.sin(i * 3) * 20;
        const by = 50 + Math.cos(i * 2) * 15;
        const sx = (bx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (by - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -30 || sx > ctx.canvas.width + 30) continue;
        const bw2 = 20 * zoom,
          bh2 = 30 * zoom + Math.sin(i * 4) * 10 * zoom;
        ctx.fillStyle = '#0a0020';
        ctx.fillRect(sx - bw2 / 2, sy - bh2, bw2, bh2);
        // Neon windows
        const wColor = neonColors[i % neonColors.length];
        for (let wy = 0; wy < bh2 - 8; wy += 8 * zoom) {
          const glow = 0.3 + Math.sin(frame * 0.03 + i + wy) * 0.2;
          ctx.fillStyle = wColor;
          ctx.globalAlpha = Math.max(0, glow);
          ctx.fillRect(sx - bw2 / 4, sy - bh2 + wy + 4 * zoom, bw2 / 8, 4 * zoom);
          ctx.fillRect(sx + bw2 / 8, sy - bh2 + wy + 4 * zoom, bw2 / 8, 4 * zoom);
          ctx.globalAlpha = 1;
        }
      }

      // Billboards
      const billboards = [
        { x: 160, y: 250, text: 'TURBO-SWAN', color: '#ff00ff' },
        { x: 640, y: 250, text: 'ROCKET', color: '#00ffff' },
        { x: 400, y: 600, text: 'TIRES', color: '#ffff00' },
      ];
      for (const bb of billboards) {
        const sx = (bb.x - camX) * zoom + ctx.canvas.width / 2;
        const sy = (bb.y - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -50 || sx > ctx.canvas.width + 50) continue;
        ctx.fillStyle = '#000';
        ctx.fillRect(sx - 35 * zoom, sy - 15 * zoom, 70 * zoom, 22 * zoom);
        ctx.strokeStyle = bb.color;
        ctx.lineWidth = 2 * zoom;
        ctx.strokeRect(sx - 35 * zoom, sy - 15 * zoom, 70 * zoom, 22 * zoom);
        ctx.fillStyle = bb.color;
        ctx.font = `bold ${8 * zoom}px Orbitron, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(bb.text, sx, sy + 3 * zoom);
        ctx.shadowColor = bb.color;
        ctx.shadowBlur = 10 * zoom;
        ctx.fillText(bb.text, sx, sy + 3 * zoom);
        ctx.shadowBlur = 0;
      }

      // Neon lane lines (in addition to road color)
      // Already handled in road rendering

      // Boost pads (rocket and shield icons)
      for (let i = 0; i < 8; i++) {
        const px = 150 + i * 80 + Math.sin(i * 2) * 10;
        const py = 300 + i * 50 + Math.cos(i * 3) * 8;
        const sx = (px - camX) * zoom + ctx.canvas.width / 2;
        const sy = (py - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -15 || sx > ctx.canvas.width + 15) continue;
        const glow2 = 0.5 + Math.sin(frame * 0.05 + i) * 0.3;
        ctx.fillStyle = `rgba(0, 255, 255, ${glow2 * 0.3})`;
        ctx.fillRect(sx - 12 * zoom, sy - 6 * zoom, 24 * zoom, 12 * zoom);
        ctx.fillStyle = '#00ffff';
        ctx.font = `${8 * zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(i % 2 === 0 ? '🚀' : '🛡', sx, sy + 3 * zoom);
      }
    },
  },
  {
    id: 'jungle',
    name: 'Ancient Jungle Ruins',
    desc: 'Dense jungle with tiki totems and alligator hazards.',
    color: '#44cc44',
    bgColor: '#0a1a0a',
    roadColor: '#3a2a1a',
    roadEdgeColor: '#44aa44',
    offroadColor: '#1a3a1a',
    waypoints: [
      { x: 400, y: 90 },
      { x: 670, y: 160 },
      { x: 760, y: 420 },
      { x: 670, y: 670 },
      { x: 400, y: 760 },
      { x: 130, y: 670 },
      { x: 40, y: 420 },
      { x: 130, y: 160 },
    ],
    checkpoints: null,
    zones: [
      // Alligator spin-out hazards near track edges
      { x: 300, y: 200, w: 30, h: 16, type: 'spin', strength: 1.0 },
      { x: 600, y: 320, w: 30, h: 16, type: 'spin', strength: 1.0 },
      { x: 720, y: 500, w: 30, h: 16, type: 'spin', strength: 1.0 },
      { x: 500, y: 650, w: 30, h: 16, type: 'spin', strength: 1.0 },
      { x: 300, y: 600, w: 30, h: 16, type: 'spin', strength: 1.0 },
    ],
    renderScenery: function (ctx, camX, camY, zoom, frame) {
      // Dense jungle foliage
      for (let i = 0; i < 40; i++) {
        const fx = 50 + i * 20 + Math.sin(i * 7) * 15;
        const fy = 50 + Math.cos(i * 5) * 200 + i * 5;
        const sx = (fx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (fy - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -20 || sx > ctx.canvas.width + 20) continue;
        const shade = 0.3 + Math.sin(i * 3) * 0.1;
        ctx.fillStyle = `rgba(20, ${80 + i * 2}, 20, ${shade})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 10 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tiki totem faces
      for (let i = 0; i < 4; i++) {
        const tx = 200 + i * 120;
        const ty = 500 + (i % 2 === 0 ? 80 : -60);
        const sx = (tx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (ty - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -25 || sx > ctx.canvas.width + 25) continue;
        // Post
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(sx - 8 * zoom, sy - 20 * zoom, 16 * zoom, 40 * zoom);
        // Face
        ctx.fillStyle = '#6a4a2a';
        ctx.beginPath();
        ctx.arc(sx, sy - 15 * zoom, 14 * zoom, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sx - 5 * zoom, sy - 18 * zoom, 3 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + 5 * zoom, sy - 18 * zoom, 3 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(sx - 5 * zoom, sy - 18 * zoom, 1.5 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + 5 * zoom, sy - 18 * zoom, 1.5 * zoom, 0, Math.PI * 2);
        ctx.fill();
        // Mouth
        ctx.fillStyle = '#8a2a1a';
        ctx.fillRect(sx - 6 * zoom, sy - 8 * zoom, 12 * zoom, 3 * zoom);
      }

      // Moss-covered stone ruins
      for (let i = 0; i < 5; i++) {
        const rx = 100 + i * 160;
        const ry = 200 + Math.sin(i * 2) * 50;
        const sx = (rx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (ry - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -30 || sx > ctx.canvas.width + 30) continue;
        ctx.fillStyle = '#5a5a4a';
        ctx.fillRect(sx - 20 * zoom, sy - 15 * zoom, 40 * zoom, 30 * zoom);
        ctx.fillStyle = '#3a5a3a';
        for (let m = 0; m < 6; m++) {
          ctx.beginPath();
          ctx.arc(
            sx - 10 * zoom + m * 7 * zoom,
            sy - 5 * zoom + (m % 3) * 5 * zoom,
            4 * zoom,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Alligators near path
      for (let i = 0; i < 3; i++) {
        const gx = 300 + i * 150;
        const gy = 350 + (i % 2 === 0 ? 100 : -80);
        const sx = (gx - camX) * zoom + ctx.canvas.width / 2;
        const sy = (gy - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -30 || sx > ctx.canvas.width + 30) continue;
        ctx.fillStyle = '#4a6a3a';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 20 * zoom, 6 * zoom, 0, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.fillStyle = '#5a7a4a';
        ctx.beginPath();
        ctx.ellipse(sx + 20 * zoom, sy, 8 * zoom, 4 * zoom, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eye
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(sx + 5 * zoom, sy - 5 * zoom, 2 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cave tunnel entrance
      const cvx = 400,
        cvy = 160;
      const csx = (cvx - camX) * zoom + ctx.canvas.width / 2;
      const csy = (cvy - camY) * zoom + ctx.canvas.height / 2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(csx, csy, 25 * zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a4a3a';
      ctx.lineWidth = 3 * zoom;
      ctx.beginPath();
      ctx.arc(csx, csy, 25 * zoom, 0, Math.PI * 2);
      ctx.stroke();

      // Warning triangles
      for (let i = 0; i < 3; i++) {
        const wx2 = 250 + i * 180;
        const wy2 = 600 + (i % 2 === 0 ? -40 : 40);
        const sx2 = (wx2 - camX) * zoom + ctx.canvas.width / 2;
        const sy2 = (wy2 - camY) * zoom + ctx.canvas.height / 2;
        if (sx2 < -15 || sx2 > ctx.canvas.width + 15) continue;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(sx2, sy2 - 10 * zoom);
        ctx.lineTo(sx2 - 8 * zoom, sy2 + 8 * zoom);
        ctx.lineTo(sx2 + 8 * zoom, sy2 + 8 * zoom);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.font = `${6 * zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('!', sx2, sy2 + 4 * zoom);
      }
    },
  },
  {
    id: 'sky-islands',
    name: 'Rainbow Sky Islands',
    desc: 'Floating islands connected by glass tubes.',
    color: '#44ddff',
    bgColor: '#002244',
    roadColor: '#8899aa',
    roadEdgeColor: '#4488ff',
    offroadColor: '#44aa44',
    waypoints: [
      { x: 400, y: 100 },
      { x: 690, y: 190 },
      { x: 760, y: 430 },
      { x: 690, y: 690 },
      { x: 400, y: 770 },
      { x: 110, y: 690 },
      { x: 40, y: 430 },
      { x: 110, y: 190 },
    ],
    checkpoints: null,
    zones: [
      // Speed boost on rainbow road sections
      { x: 480, y: 200, w: 24, h: 14, type: 'boost', strength: 1.3 },
      { x: 700, y: 440, w: 24, h: 14, type: 'boost', strength: 1.3 },
      { x: 400, y: 700, w: 24, h: 14, type: 'boost', strength: 1.3 },
      { x: 90, y: 440, w: 24, h: 14, type: 'boost', strength: 1.3 },
    ],
    renderScenery: function (ctx, camX, camY, zoom, frame) {
      // Bright blue sky with clouds
      for (let i = 0; i < 8; i++) {
        const cx2 = 50 + i * 100 + Math.sin(i * 5) * 30;
        const cy2 = 30 + Math.cos(i * 3) * 15;
        const sx = (cx2 - camX) * zoom + ctx.canvas.width / 2;
        const sy = (cy2 - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -40 || sx > ctx.canvas.width + 40) continue;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 35 * zoom, 12 * zoom, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sx + 20 * zoom, sy + 3 * zoom, 25 * zoom, 10 * zoom, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating islands
      for (let i = 0; i < 5; i++) {
        const ix = 150 + i * 130 + Math.sin(i * 4) * 20;
        const iy = 80 + Math.cos(i * 3) * 60;
        const sx = (ix - camX) * zoom + ctx.canvas.width / 2;
        const sy = (iy - camY) * zoom + ctx.canvas.height / 2;
        if (sx < -40 || sx > ctx.canvas.width + 40) continue;
        // Grassy top
        ctx.fillStyle = '#44aa44';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 35 * zoom, 10 * zoom, 0, 0, Math.PI * 2);
        ctx.fill();
        // Rocky bottom
        ctx.fillStyle = '#8a7a5a';
        ctx.beginPath();
        ctx.moveTo(sx - 30 * zoom, sy);
        ctx.lineTo(sx - 20 * zoom, sy + 15 * zoom);
        ctx.lineTo(sx + 20 * zoom, sy + 15 * zoom);
        ctx.lineTo(sx + 30 * zoom, sy);
        ctx.closePath();
        ctx.fill();
      }

      // Glass/metal tube tunnels between islands
      for (let i = 0; i < 4; i++) {
        const t1x = 150 + i * 130 + Math.sin(i * 4) * 20;
        const t1y = 80 + Math.cos(i * 3) * 60;
        const t2x = 150 + (i + 1) * 130 + Math.sin((i + 1) * 4) * 20;
        const t2y = 80 + Math.cos((i + 1) * 3) * 60;
        const s1x = (t1x - camX) * zoom + ctx.canvas.width / 2;
        const s1y = (t1y - camY) * zoom + ctx.canvas.height / 2;
        const s2x = (t2x - camX) * zoom + ctx.canvas.width / 2;
        const s2y = (t2y - camY) * zoom + ctx.canvas.height / 2;
        ctx.strokeStyle = 'rgba(100,200,255,0.2)';
        ctx.lineWidth = 8 * zoom;
        ctx.beginPath();
        ctx.moveTo(s1x, s1y);
        ctx.lineTo(s2x, s2y);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(200,255,255,0.3)';
        ctx.lineWidth = 2 * zoom;
        ctx.beginPath();
        ctx.moveTo(s1x, s1y);
        ctx.lineTo(s2x, s2y);
        ctx.stroke();
      }

      // Giant rainbow ring
      const rx = 400,
        ry = 430;
      const rsx = (rx - camX) * zoom + ctx.canvas.width / 2;
      const rsy = (ry - camY) * zoom + ctx.canvas.height / 2;
      const rainbowColors = ['#ff0000', '#ff8800', '#ffff00', '#44ff44', '#4488ff', '#8844ff'];
      for (let i = 0; i < rainbowColors.length; i++) {
        ctx.strokeStyle = rainbowColors[i];
        ctx.lineWidth = 6 * zoom;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(rsx, rsy, 40 * zoom + i * 5 * zoom, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Distant village
      const vx = 600,
        vy = 80;
      const vsx = (vx - camX) * zoom + ctx.canvas.width / 2;
      const vsy = (vy - camY) * zoom + ctx.canvas.height / 2;
      ctx.fillStyle = 'rgba(150,100,50,0.4)';
      ctx.fillRect(vsx - 15 * zoom, vsy - 10 * zoom, 10 * zoom, 15 * zoom);
      ctx.fillRect(vsx + 5 * zoom, vsy - 12 * zoom, 10 * zoom, 17 * zoom);
      ctx.fillStyle = 'rgba(200,100,50,0.4)';
      ctx.beginPath();
      ctx.moveTo(vsx - 15 * zoom, vsy - 10 * zoom);
      ctx.lineTo(vsx - 10 * zoom, vsy - 18 * zoom);
      ctx.lineTo(vsx - 5 * zoom, vsy - 10 * zoom);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(vsx + 5 * zoom, vsy - 12 * zoom);
      ctx.lineTo(vsx + 10 * zoom, vsy - 20 * zoom);
      ctx.lineTo(vsx + 15 * zoom, vsy - 12 * zoom);
      ctx.fill();
    },
  },
];

// Generate checkpoints for each track
function generateCheckpoints(track, numCheckpoints) {
  const pts = getSmoothPath(track.waypoints, 200);
  const checkpoints = [];
  const step = Math.floor(pts.length / numCheckpoints);
  for (let i = 0; i < numCheckpoints; i++) {
    const idx = (i * step) % pts.length;
    const p = pts[idx];
    const pNext = pts[(idx + 1) % pts.length];
    // Perpendicular direction
    const dx = pNext.x - p.x;
    const dy = pNext.y - p.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    const roadW = 60;
    checkpoints.push({
      x: p.x,
      y: p.y,
      startX: p.x + px * roadW,
      startY: p.y + py * roadW,
      endX: p.x - px * roadW,
      endY: p.y - py * roadW,
      index: i,
      total: numCheckpoints,
    });
  }
  return checkpoints;
}

// Get smooth path from waypoints using Catmull-Rom interpolation
function getSmoothPath(waypoints, numSamples) {
  const n = waypoints.length;
  const pts = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const p = t * n;
    const p0 = waypoints[Math.floor(p) % n];
    const p1 = waypoints[Math.ceil(p) % n];
    const frac = p - Math.floor(p);
    // Linear interpolation is good enough for this
    pts.push({
      x: p0.x + (p1.x - p0.x) * frac,
      y: p0.y + (p1.y - p0.y) * frac,
    });
  }
  return pts;
}
