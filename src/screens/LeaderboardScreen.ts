import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import { SaveManager } from '../managers/SaveManager';
import { ReplayStore } from '../replay/store';
import { GAME_MODES } from '../game/GameModeConfig';
import { formatCurrency } from '../progression/ProgressionView';
import { Icon } from '../ui/components/Icon';

/**
 * LeaderboardScreen — local high-score leaderboards.
 *
 * Data sources (all local, no cloud):
 * - SaveManager.highScores: global high-score table (all tracks/modes)
 * - ReplayStore.bestScore: per-track+mode best replay scores
 *
 * Tabs: Global / Track / Mode — filtered views of the same data.
 * No cloud/server leaderboards; clearly labeled LOCAL.
 */

interface LeaderboardEntry {
  rank: number;
  score: number;
  track: string;
  mode: string;
  date: number;
}

export class LeaderboardScreen extends Screen {
  onBack: (() => void) | null = null;
  private saveManager = new SaveManager();
  private replayStore = new ReplayStore();
  private activeTab: 'global' | 'track' | 'mode' = 'global';
  private activeTrack = 'cyber-city';
  private activeMode = 'survival';

  constructor() {
    super('leaderboard');
  }

  protected transition(): TransitionKind {
    return 'slide-left';
  }

  protected build(): void {
    const wrap = document.createElement('div');
    wrap.className = 'screen-inner screen-scrollable';

    const header = document.createElement('div');
    header.className = 'screen-header';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'screen-eyebrow';
    eyebrow.textContent = 'Rankings';
    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = 'Leaderboards';
    const backBtn = new Button('Back', { variant: 'ghost', size: 'sm' });
    backBtn.el.addEventListener('click', () => this.onBack?.());
    header.append(eyebrow, title, backBtn.el);
    wrap.appendChild(header);

    // Local notice
    const notice = document.createElement('div');
    notice.className = 'leaderboard-notice';
    notice.innerHTML = `
      <span class="notice-icon"></span>
      <span>LOCAL LEADERBOARDS — Scores stored on this device only</span>
    `;
    wrap.appendChild(notice);

    // Main tabs
    const mainTabs = [
      { id: 'global', label: 'Global' },
      { id: 'track', label: 'By Track' },
      { id: 'mode', label: 'By Mode' },
    ];
    const tabBar = document.createElement('div');
    tabBar.className = 'tab-bar';
    for (const tab of mainTabs) {
      const btn = document.createElement('button');
      btn.className = `tab${tab.id === this.activeTab ? ' is-active' : ''}`;
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        this.activeTab = tab.id as 'global' | 'track' | 'mode';
        tabBar.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t === btn));
        this.renderContent();
      });
      tabBar.appendChild(btn);
    }
    wrap.appendChild(tabBar);

    // Sub-filters for track/mode tabs
    this.filterContainer = document.createElement('div');
    this.filterContainer.className = 'filter-bar';
    wrap.appendChild(this.filterContainer);

    this.tableContainer = document.createElement('div');
    this.tableContainer.className = 'leaderboard-table-wrap';
    wrap.appendChild(this.tableContainer);

    const footer = document.createElement('div');
    footer.className = 'screen-footer';
    const backBtn2 = new Button('Done', { variant: 'primary' });
    backBtn2.el.addEventListener('click', () => this.onBack?.());
    footer.appendChild(backBtn2.el);
    wrap.appendChild(footer);

    this.el.appendChild(wrap);
    this.renderContent();
    void AnimationSystem.play(header, 'fade-in');
    void AnimationSystem.play(notice, 'fade-in', { delay: 100 });
    void AnimationSystem.play(tabBar, 'slide-in-up', { delay: 150 });
  }

  private filterContainer!: HTMLElement;
  private tableContainer!: HTMLElement;

  private renderContent(): void {
    // Render sub-filters
    this.filterContainer.innerHTML = '';
    if (this.activeTab === 'track') {
      const tracks = ['cyber-city', 'mountain-highway', 'space-highway'];
      const trackLabels: Record<string, string> = {
        'cyber-city': 'Cyber City',
        'mountain-highway': 'Mountain Highway',
        'space-highway': 'Space Highway',
      };
      const select = document.createElement('select');
      select.className = 'slider';
      select.style.width = 'auto';
      select.style.height = '34px';
      select.style.padding = '0 10px';
      for (const track of tracks) {
        const opt = document.createElement('option');
        opt.value = track;
        opt.textContent = trackLabels[track];
        opt.selected = track === this.activeTrack;
        select.appendChild(opt);
      }
      select.addEventListener('change', () => {
        this.activeTrack = select.value as 'cyber-city' | 'mountain-highway' | 'space-highway';
        this.renderTable();
      });
      const label = document.createElement('span');
      label.style.fontSize = '13px';
      label.style.color = 'var(--text2)';
      label.textContent = 'Track: ';
      this.filterContainer.append(label, select);
    } else if (this.activeTab === 'mode') {
      const modes: Array<{ id: string; label: string }> = [
        { id: 'survival', label: 'Endless Survival' },
        { id: 'ai-race', label: 'AI Race' },
        { id: 'versus', label: 'You vs You' },
        { id: 'multiplayer', label: 'Multiplayer' },
      ];
      const select = document.createElement('select');
      select.className = 'slider';
      select.style.width = 'auto';
      select.style.height = '34px';
      select.style.padding = '0 10px';
      for (const mode of modes) {
        const opt = document.createElement('option');
        opt.value = mode.id;
        opt.textContent = mode.label;
        opt.selected = mode.id === this.activeMode;
        select.appendChild(opt);
      }
      select.addEventListener('change', () => {
        this.activeMode = select.value as 'survival' | 'ai-race' | 'versus' | 'multiplayer';
        this.renderTable();
      });
      const label = document.createElement('span');
      label.style.fontSize = '13px';
      label.style.color = 'var(--text2)';
      label.textContent = 'Mode: ';
      this.filterContainer.append(label, select);
    }

    this.renderTable();
  }

  private renderTable(): void {
    const entries = this.getEntries();
    this.tableContainer.innerHTML = '';

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'leaderboard-empty';
      empty.innerHTML = `
        <div class="empty-icon"></div>
        <div class="empty-title">No Scores Yet</div>
        <div class="empty-desc">Race in this category to set a record!</div>
      `;
      this.tableContainer.appendChild(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>RANK</th>
          <th>${this.activeTab === 'track' ? 'MODE' : this.activeTab === 'mode' ? 'TRACK' : 'TRACK / MODE'}</th>
          <th>SCORE</th>
          <th>DATE</th>
        </tr>
      </thead>
      <tbody>
        ${entries
          .map(
            (e, i) => `
            <tr${i < 3 ? ' class="top-three"' : ''}>
              <td class="rank-col">${this.formatRank(i + 1)}</td>
              <td>${this.activeTab === 'track' ? this.formatModeName(e.mode) : this.activeTab === 'mode' ? this.formatTrackName(e.track) : `${this.formatTrackName(e.track)} / ${this.formatModeName(e.mode)}`}</td>
              <td class="score-col">${formatCurrency(e.score)}</td>
              <td>${new Date(e.date).toLocaleDateString()}</td>
            </tr>
          `
          )
          .join('')}
      </tbody>
    `;
    this.tableContainer.appendChild(table);
  }

  private getEntries(): LeaderboardEntry[] {
    const allScores = this.saveManager.getAllHighScores();
    let entries: LeaderboardEntry[] = allScores.map((s, i) => ({
      rank: i + 1,
      score: s.score,
      track: s.track,
      mode: s.mode,
      date: s.timestamp,
    }));

    if (this.activeTab === 'track') {
      entries = entries.filter((e) => e.track === this.activeTrack);
    } else if (this.activeTab === 'mode') {
      entries = entries.filter((e) => e.mode === this.activeMode);
    }

    // Also include ReplayStore best scores (which may not be in highScores)
    const tracks = ['cyber-city', 'mountain-highway', 'space-highway'];
    const modes: Array<'survival' | 'ai-race' | 'versus' | 'multiplayer'> = [
      'survival',
      'ai-race',
      'versus',
      'multiplayer',
    ];

    for (const track of tracks) {
      for (const mode of modes) {
        if (!GAME_MODES[mode]) continue;
        const best = this.replayStore.bestScore(track, mode);
        if (best !== null) {
          // Check if already in entries
          const exists = entries.some((e) => e.track === track && e.mode === mode && e.score === best);
          if (!exists) {
            entries.push({
              rank: 0,
              score: best,
              track,
              mode,
              date: Date.now(),
            });
          }
        }
      }
    }

    // Re-filter after adding replay scores
    if (this.activeTab === 'track') {
      entries = entries.filter((e) => e.track === this.activeTrack);
    } else if (this.activeTab === 'mode') {
      entries = entries.filter((e) => e.mode === this.activeMode);
    }

    // Sort and re-rank
    entries.sort((a, b) => b.score - a.score);
    return entries.map((e, i) => ({ ...e, rank: i + 1 }));
  }

  private formatRank(rank: number): string {
    if (rank <= 3) {
      const svg = Icon.getSVG('medal', 18) ?? '';
      return `${svg} ${rank}`;
    }
    return `#${rank}`;
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
