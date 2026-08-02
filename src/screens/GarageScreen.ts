import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import { profileManager, type ProfileState } from '../managers/ProfileManager';

const SKINS = [
  { id: 'default', name: 'Factory Red', cost: 0, hex: '#cc2222' },
  { id: 'blue', name: 'Azure Blue', cost: 1500, hex: '#1188cc' },
  { id: 'green', name: 'Neon Green', cost: 3000, hex: '#00aa88' },
  { id: 'purple', name: 'Midnight Purple', cost: 5000, hex: '#8833cc' },
  { id: 'gold', name: 'Champion Gold', cost: 10000, hex: '#ccaa33' },
];

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

    // Header
    const header = document.createElement('div');
    header.className = 'settings-header';
    const title = document.createElement('h2');
    title.textContent = 'GARAGE & PROFILE';
    const backBtn = new Button('Back', { variant: 'ghost', size: 'sm' });
    backBtn.el.addEventListener('click', () => this.onBack?.());
    header.append(title, backBtn.el);
    wrap.appendChild(header);

    // Profile Stats
    const profileSection = document.createElement('div');
    profileSection.className = 'settings-group';
    profileSection.innerHTML = `
      <h3>Driver Profile</h3>
      <div class="profile-stats">
        <div class="stat-box">
          <div class="stat-label">LEVEL</div>
          <div class="stat-val">${this.state.level}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">TOTAL XP</div>
          <div class="stat-val">${this.state.xp}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">COINS</div>
          <div class="stat-val" style="color: gold;">${this.state.coins}</div>
        </div>
      </div>
    `;
    wrap.appendChild(profileSection);

    // Skins
    const skinsSection = document.createElement('div');
    skinsSection.className = 'settings-group';
    const skinsTitle = document.createElement('h3');
    skinsTitle.textContent = 'Car Skins';
    skinsSection.appendChild(skinsTitle);

    const skinsGrid = document.createElement('div');
    skinsGrid.className = 'skins-grid';

    SKINS.forEach((skin) => {
      const card = document.createElement('div');
      card.className = 'skin-card';
      const isUnlocked = this.state.unlockedSkins.includes(skin.id);
      const isSelected = this.state.selectedSkin === skin.id;

      if (isSelected) card.classList.add('selected');

      card.innerHTML = `
        <div class="skin-color" style="background: ${skin.hex}"></div>
        <div class="skin-info">
          <div class="skin-name">${skin.name}</div>
          <div class="skin-status">${isSelected ? 'EQUIPPED' : isUnlocked ? 'UNLOCKED' : `${skin.cost} COINS`}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        if (isUnlocked) {
          profileManager.selectSkin(skin.id);
          this.rebuild();
        } else {
          if (profileManager.purchaseSkin(skin.id, skin.cost)) {
            this.rebuild();
          } else {
            // Flash red to indicate lack of funds
            card.style.animation = 'none';
            void card.offsetWidth;
            card.style.animation = 'error-shake 0.3s ease';
          }
        }
      });
      skinsGrid.appendChild(card);
    });

    skinsSection.appendChild(skinsGrid);
    wrap.appendChild(skinsSection);

    this.el.appendChild(wrap);

    void AnimationSystem.play(header, 'fade-in');
    void AnimationSystem.play(profileSection, 'slide-in-right', { delay: 100 });
    void AnimationSystem.play(skinsSection, 'slide-in-right', { delay: 200 });
  }

  private rebuild(): void {
    this.el.innerHTML = '';
    this.build();
  }
}
