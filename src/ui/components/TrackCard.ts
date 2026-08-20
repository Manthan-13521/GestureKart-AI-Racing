import { Component } from '../core/Component';

export interface TrackCardData {
  id: string;
  name: string;
  subtitle?: string;
  gradient?: string;
  difficulty?: number;
  weather?: string;
  environment?: string;
  duration?: string;
  bestTime?: string | null;
  mapSvg?: string;
}

export interface TrackCardOptions {
  track: TrackCardData;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Track selection card with SVG map preview, metadata badges, and best time.
 */
export class TrackCard extends Component<HTMLElement> {
  private readonly data: TrackCardData;

  constructor(opts: TrackCardOptions) {
    super('article', 'card track-card');
    this.data = opts.track;
    this.el.dataset.trackId = this.data.id;
    this.el.setAttribute('tabindex', '0');
    this.el.setAttribute('role', 'button');
    if (opts.selected) this.el.classList.add('card-selected');

    // Map preview
    if (this.data.mapSvg) {
      const map = document.createElement('div');
      map.className = 'track-map';
      map.innerHTML = this.data.mapSvg;
      this.el.appendChild(map);
    } else if (this.data.gradient) {
      const map = document.createElement('div');
      map.className = 'track-map';
      map.style.background = this.data.gradient;
      this.el.appendChild(map);
    }

    // Info section
    const info = document.createElement('div');
    info.className = 'track-info';

    const name = document.createElement('h3');
    name.className = 'track-name';
    name.textContent = this.data.name;
    info.appendChild(name);

    if (this.data.subtitle) {
      const sub = document.createElement('p');
      sub.className = 'track-subtitle';
      sub.textContent = this.data.subtitle;
      info.appendChild(sub);
    }

    // Meta badges
    if (this.data.weather || this.data.environment) {
      const meta = document.createElement('div');
      meta.className = 'track-meta';
      if (this.data.weather) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-cyan';
        badge.textContent = this.data.weather;
        meta.appendChild(badge);
      }
      if (this.data.environment) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-gold';
        badge.textContent = this.data.environment;
        meta.appendChild(badge);
      }
      info.appendChild(meta);
    }

    // Difficulty + duration row
    if (this.data.difficulty || this.data.duration) {
      const row = document.createElement('div');
      row.className = 'track-meta-row';
      if (this.data.difficulty) {
        const diff = document.createElement('span');
        diff.className = 'track-difficulty';
        diff.textContent = '★'.repeat(this.data.difficulty) + '☆'.repeat(5 - this.data.difficulty);
        row.appendChild(diff);
      }
      if (this.data.duration) {
        const dur = document.createElement('span');
        dur.className = 'track-duration';
        dur.textContent = this.data.duration;
        row.appendChild(dur);
      }
      info.appendChild(row);
    }

    // Best time
    if (this.data.bestTime) {
      const best = document.createElement('div');
      best.className = 'track-best';
      const bestLabel = document.createElement('span');
      bestLabel.className = 'track-best-label';
      bestLabel.textContent = 'Best Time';
      const bestTime = document.createElement('span');
      bestTime.className = 'track-best-time';
      bestTime.textContent = this.data.bestTime;
      best.append(bestLabel, bestTime);
      info.appendChild(best);
    }

    this.el.appendChild(info);

    if (opts.onClick) {
      this.el.addEventListener('click', opts.onClick);
      this.el.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          opts.onClick?.();
        }
      });
    }
  }

  setSelected(on: boolean): void {
    this.el.classList.toggle('card-selected', on);
  }
}
