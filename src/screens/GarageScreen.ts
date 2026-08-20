import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import { NotificationSystem } from '../ui/core/NotificationSystem';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import { profileManager, type ProfileState } from '../managers/ProfileManager';
import { SKIN_ITEMS, NEON_ITEMS, type CosmeticItem } from '../progression/ContentCatalog';
import { xpProgress, formatCurrency } from '../progression/ProgressionView';
import { titleForLevel } from '../progression/ContentCatalog';

/**
 * Garage & Profile (P8.6).
 *
 * ContentCatalog is the SINGLE source of cosmetic identity/prices; ownership
 * and equipped state come from ProfileManager; every mutation (purchase,
 * equip) goes through the domain — no business logic lives in event
 * handlers, no prices/ids are duplicated here.
 */
export class GarageScreen extends Screen {
  onBack: (() => void) | null = null;
  private state: ProfileState;

  constructor() {
    super('garage');
    this.state = profileManager.currentState;
  }

  protected transition(): TransitionKind {
    return 'slide-left';
  }

  protected build(): void {
    this.state = profileManager.currentState;

    const wrap = document.createElement('div');
    wrap.className = 'screen-inner screen-scrollable';

    // ─── Header ────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'settings-header';
    const title = document.createElement('h2');
    title.textContent = 'GARAGE & PROFILE';
    const backBtn = new Button('Back', { variant: 'ghost', size: 'sm' });
    backBtn.el.addEventListener('click', () => this.onBack?.());
    header.append(title, backBtn.el);
    wrap.appendChild(header);

    // ─── Driver profile (authoritative values only) ────────────────────
    const progress = xpProgress(this.state.xp);
    const driverTitle = titleForLevel(this.state.level);
    const profileSection = document.createElement('div');
    profileSection.className = 'settings-group';
    profileSection.innerHTML = `
      <h3>Driver Profile ${driverTitle ? `· ${driverTitle.toUpperCase()}` : ''}</h3>
      <div class="profile-stats">
        <div class="stat-box">
          <div class="stat-label">LEVEL</div>
          <div class="stat-val">${this.state.level}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">COINS</div>
          <div class="stat-val" style="color: gold;">${formatCurrency(this.state.coins)}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">RACES</div>
          <div class="stat-val">${this.state.lifetimeStats.racesFinished}</div>
        </div>
      </div>
      <div class="profile-xprow">
        <div class="profile-xpbar" role="progressbar" aria-valuenow="${progress.into}" aria-valuemin="0" aria-valuemax="1000" aria-label="XP progress">
          <div class="profile-xpfill" style="width: ${progress.pct}%"></div>
        </div>
        <div class="profile-xptext">${progress.into} / ${progress.needed} XP · ${progress.xp} TOTAL · LEVEL ${progress.level + 1} NEXT</div>
      </div>
    `;
    wrap.appendChild(profileSection);

    // ─── Cosmetics sections ────────────────────────────────────────────
    wrap.appendChild(
      this.buildCategorySection('Car Skins', SKIN_ITEMS, {
        isOwned: (id) => this.state.unlockedSkins.includes(id),
        isEquipped: (id) => this.state.selectedSkin === id,
        onActivate: (id) => this.handleActivate(id, 'skin'),
      })
    );
    wrap.appendChild(
      this.buildCategorySection('Neon Trails', NEON_ITEMS, {
        isOwned: (id) => this.state.unlockedNeons.includes(id),
        isEquipped: (id) => this.state.selectedNeon === id,
        onActivate: (id) => this.handleActivate(id, 'neon'),
      })
    );

    this.el.appendChild(wrap);

    void AnimationSystem.play(header, 'fade-in');
    void AnimationSystem.play(profileSection, 'slide-in-right', { delay: 100 });
  }

  private buildCategorySection(
    heading: string,
    items: CosmeticItem[],
    hooks: {
      isOwned: (id: string) => boolean;
      isEquipped: (id: string) => boolean;
      onActivate: (id: string) => void;
    }
  ): HTMLElement {
    const section = document.createElement('div');
    section.className = 'settings-group';
    const h = document.createElement('h3');
    h.textContent = heading;
    section.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'skins-grid';
    grid.setAttribute('data-focus-group', heading);

    for (const item of items) {
      const owned = hooks.isOwned(item.id);
      const equipped = hooks.isEquipped(item.id);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'skin-card';
      card.setAttribute('data-item', item.id);
      if (equipped) card.classList.add('selected');

      const status = equipped ? 'EQUIPPED' : owned ? 'OWNED' : `${formatCurrency(item.cost)} COINS`;
      card.innerHTML = `
        <span class="skin-color" style="background: ${item.hex}"></span>
        <span class="skin-info">
          <span class="skin-name">${item.name}</span>
          <span class="skin-status">${status}</span>
        </span>
      `;
      card.addEventListener('click', () => hooks.onActivate(item.id));
      grid.appendChild(card);
    }

    section.appendChild(grid);
    return section;
  }

  /**
   * Domain-owned mutation entry: equip when owned, buy when not. Every
   * outcome is validated by ProfileManager (catalog pricing, ownership,
   * funds) and the UI only reflects the authoritative result.
   */
  private handleActivate(id: string, kind: 'skin' | 'neon'): void {
    const notify = NotificationSystem.getInstance();
    if (kind === 'skin') {
      if (this.state.unlockedSkins.includes(id)) {
        profileManager.selectSkin(id);
        notify.success('Equipped', 'Skin applied to your car');
      } else if (profileManager.purchaseSkin(id)) {
        notify.success('Purchased', 'New car skin unlocked');
      } else {
        notify.error('Not enough coins', 'Earn coins by racing');
        this.shake(id);
      }
    } else {
      if (this.state.unlockedNeons.includes(id)) {
        profileManager.selectNeon(id);
        notify.success('Equipped', 'Neon applied to your car');
      } else if (profileManager.purchaseNeon(id)) {
        notify.success('Purchased', 'New neon trail unlocked');
      } else {
        notify.error('Not enough coins', 'Earn coins by racing');
        this.shake(id);
      }
    }
    this.rebuild();
  }

  private shake(id: string): void {
    const card = this.el.querySelector<HTMLElement>(`[data-item="${id}"]`);
    if (!card) return;
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = 'error-shake 0.3s ease';
  }

  private rebuild(): void {
    this.el.innerHTML = '';
    this.build();
    this.refreshFocus();
  }
}
