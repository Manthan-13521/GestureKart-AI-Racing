/**
 * VictoryCeremony — Renders post-race results, statistics, division promotion,
 * points, coins, XP progression, and runs full confetti/fireworks canvas animations.
 */
import { AnimationSystem } from './core/AnimationSystem';
import { SoundHooks } from './core/SoundHooks';

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
  }> = [];
  private animationFrameId: number | null = null;

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

    container.innerHTML = `
      <div class="results-crown">🏆</div>
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
      });
    }
  }

  private animate = (): void => {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let active = false;
    for (const p of this.particles) {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();

      if (p.y < this.canvas.height + 20) {
        active = true;
      }
    }

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
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
  }
}
export const victoryCeremony = new VictoryCeremony();
