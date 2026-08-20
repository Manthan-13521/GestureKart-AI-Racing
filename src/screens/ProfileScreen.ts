import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import { profileManager } from '../managers/ProfileManager';
import { TITLE_TIERS, titleForLevel } from '../progression/ContentCatalog';
import { xpProgress, formatCurrency } from '../progression/ProgressionView';
import { ReplayStore } from '../replay/store';
import { GAME_MODES } from '../game/GameModeConfig';
import { Icon } from '../ui/components/Icon';

/**
 * ProfileScreen — dedicated player profile view.
 *
 * Separates the driver profile from the Garage (cosmetics) screen.
 * Shows comprehensive progression stats, recent activity, and best records.
 * Read-only; no mutations. All data from ProfileManager + ReplayStore.
 */

interface BestRecord {
  track: string;
  mode: string;
  score: number;
  date: number;
}

export class ProfileScreen extends Screen {
  onBack: (() => void) | null = null;
  private replayStore = new ReplayStore();

  constructor() {
    super('profile');
  }

  protected transition(): TransitionKind {
    return 'slide-left';
  }

  protected build(): void {
    const state = profileManager.currentState;
    const progress = xpProgress(state.xp);
    const driverTitle = titleForLevel(state.level);

    const wrap = document.createElement('div');
    wrap.className = 'screen-inner screen-scrollable';

    const header = document.createElement('div');
    header.className = 'screen-header';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'screen-eyebrow';
    eyebrow.textContent = 'Driver';
    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = 'Profile';
    const backBtn = new Button('Back', { variant: 'ghost', size: 'sm' });
    backBtn.el.addEventListener('click', () => this.onBack?.());
    header.append(eyebrow, title, backBtn.el);
    wrap.appendChild(header);

    // ─── Hero: Level, Title, XP Bar ────────────────────────────────────
    const hero = document.createElement('div');
    hero.className = 'settings-group profile-hero';
    hero.innerHTML = `
      <div class="profile-hero-main">
        <div class="profile-hero-level">LEVEL ${state.level}</div>
        ${driverTitle ? `<div class="profile-hero-title">${driverTitle.toUpperCase()}</div>` : ''}
        <div class="profile-hero-xpbar" role="progressbar" aria-valuenow="${progress.into}" aria-valuemin="0" aria-valuemax="1000" aria-label="XP progress">
          <div class="profile-hero-xpfill" style="width: ${progress.pct}%"></div>
        </div>
        <div class="profile-hero-xptext">${progress.into} / ${progress.needed} XP · ${progress.xp} TOTAL · LEVEL ${progress.level + 1} NEXT</div>
      </div>
      <div class="profile-hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-val" style="color: gold;">${formatCurrency(state.coins)}</div>
          <div class="hero-stat-lbl">COINS</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-val">${state.lifetimeStats.racesFinished}</div>
          <div class="hero-stat-lbl">RACES</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-val">${state.unlockedSkins.length}</div>
          <div class="hero-stat-lbl">SKINS</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-val">${state.unlockedNeons.length}</div>
          <div class="hero-stat-lbl">NEONS</div>
        </div>
      </div>
    `;
    wrap.appendChild(hero);

    // ─── Title Progression ─────────────────────────────────────────────
    const titleSection = document.createElement('div');
    titleSection.className = 'settings-group';
    const nextTitleTier = TITLE_TIERS.find((t) => t.level > state.level);
    const currentTitleTier = [...TITLE_TIERS].reverse().find((t) => t.level <= state.level);
    titleSection.innerHTML = `
      <h3>Title Progression</h3>
      <div class="title-progression">
        ${TITLE_TIERS.map(
          (tier) => `
          <div class="title-tier${tier.level <= state.level ? ' unlocked' : ' locked'}${tier === currentTitleTier ? ' current' : ''}" data-level="${tier.level}">
            <span class="tier-icon">${tier.level <= state.level ? (Icon.getSVG('medal', 20) ?? '') : (Icon.getSVG('lock', 20) ?? '')}</span>
            <span class="tier-name">${tier.title.toUpperCase()}</span>
            <span class="tier-level">LEVEL ${tier.level}</span>
            ${tier.level <= state.level ? '<span class="tier-status">UNLOCKED</span>' : ''}
          </div>
        `
        ).join('')}
      </div>
      ${
        nextTitleTier
          ? `<div class="next-title-hint">Next: <strong>${nextTitleTier.title.toUpperCase()}</strong> at Level ${nextTitleTier.level} (${nextTitleTier.level - state.level} levels to go)</div>`
          : '<div class="next-title-hint"><strong>MAX TITLE REACHED</strong> — Champion!</div>'
      }
    `;
    wrap.appendChild(titleSection);

    // ─── Best Records (from ReplayStore) ───────────────────────────────
    const records = this.getBestRecords();
    if (records.length > 0) {
      const recordsSection = document.createElement('div');
      recordsSection.className = 'settings-group';
      recordsSection.innerHTML = `
        <h3>Best Records</h3>
        <div class="records-table-wrap">
          <table class="records-table">
            <thead>
              <tr><th>TRACK</th><th>MODE</th><th>SCORE</th><th>DATE</th></tr>
            </thead>
            <tbody>
              ${records
                .map(
                  (r) => `
                  <tr>
                    <td>${this.formatTrackName(r.track)}</td>
                    <td>${this.formatModeName(r.mode)}</td>
                    <td>${formatCurrency(r.score)}</td>
                    <td>${new Date(r.date).toLocaleDateString()}</td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
      wrap.appendChild(recordsSection);
    } else {
      const noRecords = document.createElement('div');
      noRecords.className = 'settings-group';
      noRecords.innerHTML = `
        <h3>Best Records</h3>
        <p style="color: var(--text2);">No race records yet. Complete a race to see your best times here.</p>
      `;
      wrap.appendChild(noRecords);
    }

    // ─── Completion Tokens (recent races) ──────────────────────────────
    const recentRaces = state.completedRaces.slice(-5).reverse();
    if (recentRaces.length > 0) {
      const recentSection = document.createElement('div');
      recentSection.className = 'settings-group';
      recentSection.innerHTML = `
        <h3>Recent Completions</h3>
        <div class="recent-races">
          ${recentRaces
            .map(
              (id) => `
              <div class="recent-race">
                <span class="recent-race-id">${id.slice(0, 16)}…</span>
                <span class="recent-race-label">Race Completed</span>
              </div>
            `
            )
            .join('')}
        </div>
      `;
      wrap.appendChild(recentSection);
    }

    const footer = document.createElement('div');
    footer.className = 'screen-footer';
    const backBtn2 = new Button('Done', { variant: 'primary' });
    backBtn2.el.addEventListener('click', () => this.onBack?.());
    footer.appendChild(backBtn2.el);
    wrap.appendChild(footer);

    this.el.appendChild(wrap);

    void AnimationSystem.play(header, 'fade-in');
    void AnimationSystem.play(hero, 'slide-in-up', { delay: 100 });
    void AnimationSystem.play(titleSection, 'fade-in', { delay: 200 });
  }

  private getBestRecords(): BestRecord[] {
    const records: BestRecord[] = [];
    const tracks: string[] = ['cyber-city', 'mountain-highway', 'space-highway'];
    const modes: Array<'survival' | 'ai-race' | 'versus' | 'multiplayer'> = [
      'survival',
      'ai-race',
      'versus',
      'multiplayer',
    ];

    for (const track of tracks) {
      for (const mode of modes) {
        if (!GAME_MODES[mode]) continue;
        const score = this.replayStore.bestScore(track, mode);
        if (score !== null) {
          records.push({ track, mode, score, date: Date.now() });
        }
      }
    }

    return records.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  private formatTrackName(track: string): string {
    const names: Record<string, string> = {
      'cyber-city': 'Cyber City',
      'mountain-highway': 'Mountain Highway',
      'space-highway': 'Space Highway',
    };
    return names[track] ?? track;
  }

  private formatModeName(mode: string): string {
    const names: Record<string, string> = {
      survival: 'Endless Survival',
      'ai-race': 'AI Race',
      versus: 'You vs You',
      multiplayer: 'Multiplayer',
    };
    return names[mode] ?? mode;
  }
}
