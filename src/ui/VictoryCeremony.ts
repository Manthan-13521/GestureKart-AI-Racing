/**
 * VictoryCeremony — Renders post-race results, statistics, division promotion,
 * points, coins, XP progression, and runs full confetti/fireworks canvas animations.
 */
import { AnimationSystem } from './core/AnimationSystem';
import { SoundHooks } from './core/SoundHooks';
import { Icon } from './components/Icon';

export interface CeremonyData {
  position: number;
  pointsAwarded: number;
  coinsAwarded: number;
  xpAwarded: number;
  promoted: boolean;
  finishedChampionship: boolean;
  averageFinish: number;
  division: string;
  nextTrackName: string | null;
  // P8.4: progression presentation — consumed straight from the
  // RaceResultGate outcome (never recalculated here).
  totalXp?: number;
  totalCoins?: number;
  levelBefore?: number;
  levelAfter?: number;
  levelsGained?: number;
  title?: string | null;
  unlocked?: string[];
}

export class VictoryCeremony {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotSpeed: number;
    kind: 'confetti' | 'spark';
    life: number;
    maxLife: number;
  }> = [];
  private animationFrameId: number | null = null;
  /** Fireworks bursts spawn a cluster of radial sparks (GDD §13). */
  private fireworkTimer = 0;

  constructor() {}

  public show(container: HTMLElement, data: CeremonyData): void {
    SoundHooks.confirm();

    // ─── reskin the results modal content dynamically ─────────────────
    const ordinal = this.getOrdinal(data.position);
    const divisionLabel = data.division.toUpperCase();

    let promoBadge = '';
    if (data.finishedChampionship) {
      if (data.promoted) {
        promoBadge = `<div class="ceremony-badge ceremony-badge--success">PROMOTED TO ${divisionLabel}!</div>`;
      } else {
        promoBadge = `<div class="ceremony-badge ceremony-badge--fail">FAILED PROMOTION (AVG: ${data.averageFinish.toFixed(1)})</div>`;
      }
    }

    // P8.4: level-up presentation (event-driven from the gate outcome).
    const levelsGained = data.levelsGained ?? 0;
    let levelUpBlock = '';
    if (levelsGained > 0) {
      levelUpBlock = `
        <div class="ceremony-levelup" role="status">
          <div class="ceremony-levelup-title">LEVEL UP!</div>
          <div class="ceremony-levelup-text">LEVEL ${data.levelBefore} → LEVEL ${data.levelAfter}</div>
        </div>
      `;
    }
    const unlocked = (data.unlocked ?? []).filter(Boolean);
    const titleUnlockBlock =
      unlocked.length > 0
        ? `<div class="ceremony-unlock">NEW TITLE: ${unlocked.map((t) => t.toUpperCase()).join(' · ')}</div>`
        : '';

    // P8.4: resulting totals row (separate classes — the 3-stat grid
    // contract stays untouched).
    const totalsBlock = `
      <div class="ceremony-totals">
        <div class="ceremony-total">
          <div class="ceremony-total-val">${data.totalXp ?? data.xpAwarded}</div>
          <div class="ceremony-total-lbl">TOTAL XP</div>
        </div>
        <div class="ceremony-total">
          <div class="ceremony-total-val">${data.totalCoins ?? data.coinsAwarded}</div>
          <div class="ceremony-total-lbl">COIN BALANCE</div>
        </div>
        ${data.title ? `<div class="ceremony-total"><div class="ceremony-total-val">${data.title.toUpperCase()}</div><div class="ceremony-total-lbl">TITLE</div></div>` : ''}
      </div>
    `;

    container.innerHTML = `
      <div class="results-crown">${Icon.getSVG('trophy', 64) ?? ''}</div>
      <div class="results-title">VICTORY CEREMONY</div>
      
      <div class="ceremony-rank">
        <span class="ceremony-rank-num">${data.position}</span><span class="ceremony-rank-suffix">${ordinal}</span>
        <div class="ceremony-rank-label">FINISH POSITION</div>
      </div>

      ${promoBadge}

      <div class="ceremony-grid">
        <div class="ceremony-stat">
          <div class="ceremony-stat-val">+${data.pointsAwarded}</div>
          <div class="ceremony-stat-lbl">PTS</div>
        </div>
        <div class="ceremony-stat">
          <div class="ceremony-stat-val">+${data.coinsAwarded}</div>
          <div class="ceremony-stat-lbl">COINS</div>
        </div>
        <div class="ceremony-stat">
          <div class="ceremony-stat-val">+${data.xpAwarded}</div>
          <div class="ceremony-stat-lbl">XP</div>
        </div>
      </div>

      ${levelUpBlock}
      ${titleUnlockBlock}
      ${totalsBlock}
    `;

    // Confetti Canvas setup
    const oldCanvas = document.getElementById('ceremony-canvas');
    if (oldCanvas) oldCanvas.remove();

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'ceremony-canvas';
    this.canvas.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:90;';
    document.body.appendChild(this.canvas);

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');

    this.spawnConfetti();
    this.animate();

    // Animate stats
    const stats = container.querySelectorAll('.ceremony-stat');
    stats.forEach((stat, idx) => {
      void AnimationSystem.play(stat as HTMLElement, 'blur-in', { delay: idx * 100 });
    });
  }

  private getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  private spawnConfetti(): void {
    if (!this.canvas) return;
    const colors = ['#00d4ff', '#ff2d95', '#00ff41', '#ffd700', '#ff5500'];
    for (let i = 0; i < 150; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * -this.canvas.height - 20,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 6,
        speedY: Math.random() * 4 + 5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1,
        kind: 'confetti',
        life: 6,
        maxLife: 6,
      });
    }
  }

  /** Burst of radial sparks from a random point — victory fireworks. */
  private spawnFirework(): void {
    if (!this.canvas) return;
    const x = this.canvas.width * (0.2 + Math.random() * 0.6);
    const y = this.canvas.height * (0.15 + Math.random() * 0.35);
    const color = ['#ffd700', '#00d4ff', '#ff2d95', '#00ff41'][Math.floor(Math.random() * 4)];
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        size: Math.random() * 3 + 1.5,
        color,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        rotation: 0,
        rotSpeed: 0,
        kind: 'spark',
        life: 1,
        maxLife: 1,
      });
    }
  }

  private animate = (): void => {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fireworks bursts throughout the ceremony (≈1 per 0.6s).
    this.fireworkTimer += 1 / 60;
    if (this.fireworkTimer > 0.6) {
      this.fireworkTimer = 0;
      this.spawnFirework();
    }

    let active = false;
    // Prune dead particles so the array cannot grow unbounded during long
    // ceremonies (P12 release hardening: memory).
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.kind === 'confetti' && p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.kind === 'spark' && p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
    }

    for (const p of this.particles) {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;
      p.life -= 1 / 60;
      if (p.kind === 'spark') {
        p.speedY += 0.12; // gravity
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = p.kind === 'spark' ? Math.max(0, p.life / p.maxLife) : 1;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();

      if (p.kind === 'confetti' || p.life > 0) {
        active = true;
      }
    }

    this.ctx.globalAlpha = 1;
    if (active) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  };

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.particles = [];
    this.fireworkTimer = 0;
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
  }
}
export const victoryCeremony = new VictoryCeremony();
