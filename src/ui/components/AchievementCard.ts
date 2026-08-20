import { Component } from '../core/Component';

export interface AchievementData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  progress?: { current: number; target: number };
}

export interface AchievementCardOptions {
  achievement: AchievementData;
  onClick?: () => void;
}

/**
 * Achievement card with progress bar, lock/unlock state, and accessibility.
 */
export class AchievementCard extends Component<HTMLButtonElement> {
  private readonly data: AchievementData;
  private readonly progressFill: HTMLElement;
  private readonly progressText: HTMLElement;

  constructor(opts: AchievementCardOptions) {
    super('button', 'achievement-card');
    this.data = opts.achievement;
    this.el.dataset.achievement = this.data.id;
    this.el.classList.toggle('unlocked', this.data.unlocked);
    this.el.classList.toggle('locked', !this.data.unlocked);
    this.el.type = 'button';

    // Icon
    const icon = document.createElement('div');
    icon.className = 'achievement-icon';
    icon.textContent = this.data.icon;
    icon.setAttribute('aria-hidden', 'true');
    this.el.appendChild(icon);

    // Info
    const info = document.createElement('div');
    info.className = 'achievement-info';

    const name = document.createElement('div');
    name.className = 'achievement-name';
    name.textContent = this.data.name;
    info.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'achievement-desc';
    desc.textContent = this.data.description;
    info.appendChild(desc);

    // Progress bar
    const progress = document.createElement('div');
    progress.className = 'achievement-progress';
    progress.setAttribute('role', 'progressbar');

    this.progressFill = document.createElement('div');
    this.progressFill.className = 'achievement-progress-fill';

    const pct = this.data.progress
      ? Math.min(1, this.data.progress.current / this.data.progress.target)
      : this.data.unlocked
        ? 1
        : 0;
    this.progressFill.style.width = `${pct * 100}%`;
    progress.setAttribute('aria-valuenow', String(pct * 100));
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    progress.appendChild(this.progressFill);
    info.appendChild(progress);

    // Progress text
    this.progressText = document.createElement('div');
    this.progressText.className = 'achievement-progress-text';
    if (this.data.progress) {
      this.progressText.textContent = `${this.data.progress.current} / ${this.data.progress.target}`;
    } else {
      this.progressText.textContent = this.data.unlocked ? 'UNLOCKED' : 'LOCKED';
    }
    info.appendChild(this.progressText);

    this.el.appendChild(info);

    // Category label
    const cat = document.createElement('div');
    cat.className = 'achievement-category';
    cat.textContent = this.data.category.toUpperCase();
    this.el.appendChild(cat);

    if (opts.onClick) {
      this.el.addEventListener('click', opts.onClick);
    }
  }
}
