import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import { profileManager } from '../managers/ProfileManager';
import { titleForLevel } from '../progression/ContentCatalog';
import { Icon } from '../ui/components/Icon';

/**
 * AchievementsScreen — player-facing achievement grid.
 *
 * Achievements are sourced from existing progression data:
 * - Title tiers (Rookie → Champion) granted by level thresholds
 * - Cosmetic collections (skins, neons) tracked by ProfileManager
 * - Race completion milestones from lifetime stats
 *
 * This screen is read-only; no new persistence is introduced.
 * All data comes from the existing ProfileManager authority.
 */

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'progression' | 'collection' | 'mastery';
  unlocked: boolean;
  progress?: { current: number; target: number };
}

export class AchievementsScreen extends Screen {
  onBack: (() => void) | null = null;
  private achievements: Achievement[] = [];

  constructor() {
    super('achievements');
  }

  protected transition(): TransitionKind {
    return 'slide-left';
  }

  protected build(): void {
    this.rebuildAchievements();

    const wrap = document.createElement('div');
    wrap.className = 'screen-inner screen-scrollable';

    const header = document.createElement('div');
    header.className = 'screen-header';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'screen-eyebrow';
    eyebrow.textContent = 'Progress';
    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = 'Achievements';
    const backBtn = new Button('Back', { variant: 'ghost', size: 'sm' });
    backBtn.el.addEventListener('click', () => this.onBack?.());
    header.append(eyebrow, title, backBtn.el);
    wrap.appendChild(header);

    // Summary stats
    const unlockedCount = this.achievements.filter((a) => a.unlocked).length;
    const totalCount = this.achievements.length;
    const summary = document.createElement('div');
    summary.className = 'settings-group';
    summary.innerHTML = `
      <div class="achievements-summary">
        <div class="summary-stat">
          <div class="summary-val">${unlockedCount}</div>
          <div class="summary-lbl">UNLOCKED</div>
        </div>
        <div class="summary-stat">
          <div class="summary-val">${totalCount}</div>
          <div class="summary-lbl">TOTAL</div>
        </div>
        <div class="summary-stat">
          <div class="summary-val">${Math.round((unlockedCount / totalCount) * 100)}%</div>
          <div class="summary-lbl">COMPLETION</div>
        </div>
      </div>
    `;
    wrap.appendChild(summary);

    // Category tabs
    const categories: Array<{ id: Achievement['category']; label: string }> = [
      { id: 'progression', label: 'Progression' },
      { id: 'collection', label: 'Collection' },
      { id: 'mastery', label: 'Mastery' },
    ];
    let activeCategory: Achievement['category'] = 'progression';

    const tabBar = document.createElement('div');
    tabBar.className = 'tab-bar';
    for (const cat of categories) {
      const btn = document.createElement('button');
      btn.className = `tab${cat.id === activeCategory ? ' is-active' : ''}`;
      btn.textContent = cat.label;
      btn.addEventListener('click', () => {
        activeCategory = cat.id;
        tabBar.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t === btn));
        renderGrid();
      });
      tabBar.appendChild(btn);
    }
    wrap.appendChild(tabBar);

    const gridContainer = document.createElement('div');
    gridContainer.className = 'achievements-grid';
    wrap.appendChild(gridContainer);

    const footer = document.createElement('div');
    footer.className = 'screen-footer';
    const backBtn2 = new Button('Done', { variant: 'primary' });
    backBtn2.el.addEventListener('click', () => this.onBack?.());
    footer.appendChild(backBtn2.el);
    wrap.appendChild(footer);

    this.el.appendChild(wrap);

    const renderGrid = (): void => {
      gridContainer.innerHTML = '';
      const filtered = this.achievements.filter((a) => a.category === activeCategory);
      for (const ach of filtered) {
        gridContainer.appendChild(this.buildAchievementCard(ach));
      }
      void AnimationSystem.play(gridContainer, 'fade-in', { duration: 220 });
    };

    renderGrid();
    void AnimationSystem.play(header, 'fade-in');
    void AnimationSystem.play(summary, 'slide-in-up', { delay: 100 });
  }

  private rebuildAchievements(): void {
    const state = profileManager.currentState;
    const level = state.level;
    const coins = state.coins;
    const racesFinished = state.lifetimeStats.racesFinished;
    const unlockedSkins = state.unlockedSkins.length;
    const unlockedNeons = state.unlockedNeons.length;
    const currentTitle = titleForLevel(level);

    this.achievements = [
      // PROGRESSION
      {
        id: 'first_race',
        name: 'First Steps',
        description: 'Complete your first race',
        icon: 'Flag',
        category: 'progression',
        unlocked: racesFinished >= 1,
        progress: { current: Math.min(racesFinished, 1), target: 1 },
      },
      {
        id: 'ten_races',
        name: 'Getting Started',
        description: 'Complete 10 races',
        icon: 'Flag',
        category: 'progression',
        unlocked: racesFinished >= 10,
        progress: { current: Math.min(racesFinished, 10), target: 10 },
      },
      {
        id: 'fifty_races',
        name: 'Regular Racer',
        description: 'Complete 50 races',
        icon: 'Flag',
        category: 'progression',
        unlocked: racesFinished >= 50,
        progress: { current: Math.min(racesFinished, 50), target: 50 },
      },
      {
        id: 'hundred_races',
        name: 'Centurion',
        description: 'Complete 100 races',
        icon: 'Checks',
        category: 'progression',
        unlocked: racesFinished >= 100,
        progress: { current: Math.min(racesFinished, 100), target: 100 },
      },
      {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach Level 5',
        icon: 'Star',
        category: 'progression',
        unlocked: level >= 5,
        progress: { current: Math.min(level, 5), target: 5 },
      },
      {
        id: 'level_10',
        name: 'Apex Driver',
        description: 'Reach Level 10',
        icon: 'Star',
        category: 'progression',
        unlocked: level >= 10,
        progress: { current: Math.min(level, 10), target: 10 },
      },
      {
        id: 'level_15',
        name: 'Elite',
        description: 'Reach Level 15',
        icon: 'Diamond',
        category: 'progression',
        unlocked: level >= 15,
        progress: { current: Math.min(level, 15), target: 15 },
      },
      {
        id: 'level_20',
        name: 'Legend',
        description: 'Reach Level 20',
        icon: 'Crown',
        category: 'progression',
        unlocked: level >= 20,
        progress: { current: Math.min(level, 20), target: 20 },
      },

      // COLLECTION
      {
        id: 'first_skin',
        name: 'Custom Paint',
        description: 'Unlock your first car skin',
        icon: 'PaintBrush',
        category: 'collection',
        unlocked: unlockedSkins >= 2, // default + 1
        progress: { current: Math.min(unlockedSkins - 1, 1), target: 1 },
      },
      {
        id: 'all_skins',
        name: 'Car Collector',
        description: 'Unlock all car skins',
        icon: 'PaintBrush',
        category: 'collection',
        unlocked: unlockedSkins >= 6, // all SKIN_ITEMS
        progress: { current: Math.min(unlockedSkins, 6), target: 6 },
      },
      {
        id: 'first_neon',
        name: 'Neon Glow',
        description: 'Unlock your first neon trail',
        icon: 'Lightbulb',
        category: 'collection',
        unlocked: unlockedNeons >= 3, // red + blue + 1
        progress: { current: Math.min(unlockedNeons - 2, 1), target: 1 },
      },
      {
        id: 'all_neons',
        name: 'Light Show',
        description: 'Unlock all neon trails',
        icon: 'Lightbulb',
        category: 'collection',
        unlocked: unlockedNeons >= 6, // all NEON_ITEMS
        progress: { current: Math.min(unlockedNeons, 6), target: 6 },
      },
      {
        id: 'first_title',
        name: 'Named Driver',
        description: 'Earn your first title (Level 3)',
        icon: 'Tag',
        category: 'collection',
        unlocked: currentTitle !== null,
        progress: { current: currentTitle ? 1 : 0, target: 1 },
      },
      {
        id: 'all_titles',
        name: 'Hall of Fame',
        description: 'Unlock all titles (Level 18+)',
        icon: 'Trophy',
        category: 'collection',
        unlocked: level >= 18,
        progress: { current: Math.min(level, 18), target: 18 },
      },

      // MASTERY
      {
        id: 'rich_driver',
        name: 'High Roller',
        description: 'Accumulate 50,000 coins',
        icon: 'Money',
        category: 'mastery',
        unlocked: coins >= 50000,
        progress: { current: Math.min(coins, 50000), target: 50000 },
      },
      {
        id: 'millionaire',
        name: 'Millionaire',
        description: 'Accumulate 1,000,000 coins',
        icon: 'Diamond',
        category: 'mastery',
        unlocked: coins >= 1000000,
        progress: { current: Math.min(coins, 1000000), target: 1000000 },
      },
      {
        id: 'tournament_rookie',
        name: 'Rookie Champion',
        description: 'Win a Rookie division championship',
        icon: 'Trophy',
        category: 'mastery',
        unlocked: false, // Would need tournament history data
      },
      {
        id: 'tournament_champion',
        name: 'Grand Champion',
        description: 'Reach Champion division',
        icon: 'Crown',
        category: 'mastery',
        unlocked: false, // Would need tournament division data
      },
      {
        id: 'survival_master',
        name: 'Survival Expert',
        description: 'Score 100,000 in Endless Survival',
        icon: 'Infinity',
        category: 'mastery',
        unlocked: false, // Would need high score data per mode
      },
    ];
  }

  private buildAchievementCard(ach: Achievement): HTMLElement {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `achievement-card${ach.unlocked ? ' unlocked' : ' locked'}`;
    card.setAttribute('data-achievement', ach.id);

    const progressHtml = ach.progress
      ? `
        <div class="achievement-progress" role="progressbar" aria-valuenow="${ach.progress.current}" aria-valuemin="0" aria-valuemax="${ach.progress.target}" aria-label="${ach.name} progress">
          <div class="achievement-progress-fill" style="width: ${(ach.progress.current / ach.progress.target) * 100}%"></div>
        </div>
        <div class="achievement-progress-text">${ach.progress.current} / ${ach.progress.target}</div>
      `
      : ach.unlocked
        ? '<div class="achievement-progress-text">UNLOCKED</div>'
        : '<div class="achievement-progress-text">LOCKED</div>';

    const iconEl = document.createElement('div');
    iconEl.className = 'achievement-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    const iconComponent = new Icon({ name: ach.icon, size: 28 });
    iconEl.appendChild(iconComponent.el);

    const infoEl = document.createElement('div');
    infoEl.className = 'achievement-info';
    infoEl.innerHTML = `
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${ach.description}</div>
        ${progressHtml}
      `;

    const catEl = document.createElement('div');
    catEl.className = 'achievement-category';
    catEl.textContent = ach.category.toUpperCase();

    card.append(iconEl, infoEl, catEl);

    // Focus/keyboard support
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });

    return card;
  }
}
