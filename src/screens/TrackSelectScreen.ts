import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import { SoundHooks } from '../ui/core/SoundHooks';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import type { TrackId } from '../game/GameModeConfig';

export type { TrackId };

export interface TrackDef {
  id: TrackId;
  name: string;
  subtitle: string;
  gradient: string;
  difficulty: 1 | 2 | 3;
  weather: string;
  environment: string;
  duration: string;
  description: string;
  mapSvg: string;
}

function difficultyStars(level: number): string {
  return '★'.repeat(level) + '☆'.repeat(3 - level);
}

// Track map SVGs (simplified silhouettes)
const TRACK_MAPS: Record<TrackId, string> = {
  'cyber-city': `
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50 Q 50 20 80 30 Q 110 40 140 25 Q 170 10 190 30 Q 195 55 175 70 Q 155 85 125 75 Q 95 65 65 80 Q 35 95 10 70 Q 5 45 20 25 Q 35 5 60 20 Q 85 35 110 50 Q 135 65 160 50 Q 185 35 190 60" 
            stroke="var(--accent-cyan)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="50" cy="35" r="4" fill="var(--accent-primary)"/>
    </svg>
  `,
  'mountain-highway': `
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 60 Q 40 30 70 40 Q 100 50 130 35 Q 160 20 190 40 Q 195 70 165 80 Q 135 90 100 75 Q 65 60 35 75 Q 5 90 15 60 Q 25 30 55 45 Q 85 60 115 50 Q 145 40 170 55 Q 195 70 180 85" 
            stroke="var(--accent-gold)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="70" cy="40" r="4" fill="var(--accent-primary)"/>
    </svg>
  `,
  'space-highway': `
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="50" rx="70" ry="30" stroke="var(--accent-magenta)" stroke-width="3" fill="none"/>
      <ellipse cx="100" cy="50" rx="45" ry="20" stroke="var(--accent-magenta)" stroke-width="2" fill="none" stroke-dasharray="8 4"/>
      <circle cx="100" cy="50" r="4" fill="var(--accent-primary)"/>
    </svg>
  `,
};

export const TRACKS: TrackDef[] = [
  {
    id: 'cyber-city',
    name: 'Cyber City',
    subtitle: 'Neon-lit downtown circuit',
    gradient: 'rgba(56, 189, 248, 0.55), rgba(139, 92, 246, 0.35)',
    difficulty: 1,
    weather: 'Clear',
    environment: 'Neon rain, holograms',
    duration: '~1:30',
    description: 'Wide lanes and long straights. The perfect place to learn your car.',
    mapSvg: TRACK_MAPS['cyber-city'],
  },
  {
    id: 'mountain-highway',
    name: 'Mountain Highway',
    subtitle: 'Hairpins above the clouds',
    gradient: 'rgba(45, 255, 154, 0.5), rgba(14, 116, 144, 0.4)',
    difficulty: 2,
    weather: 'Clear / Mist',
    environment: 'Fog banks, cliff edges',
    duration: '~2:00',
    description: 'Narrow ribbons with blind corners. Commit or brake early.',
    mapSvg: TRACK_MAPS['mountain-highway'],
  },
  {
    id: 'space-highway',
    name: 'Space Highway',
    subtitle: 'Zero-gravity ring road',
    gradient: 'rgba(255, 215, 0, 0.5), rgba(88, 28, 135, 0.45)',
    difficulty: 3,
    weather: 'Stable',
    environment: 'Asteroids, solar flares',
    duration: '~2:30',
    description: 'Disorienting banks and light-speed straights for experts only.',
    mapSvg: TRACK_MAPS['space-highway'],
  },
];

export class TrackSelectScreen extends Screen {
  selected: TrackId | null = null;
  onSelect: ((id: TrackId) => void) | null = null;
  onBack: (() => void) | null = null;

  constructor() {
    super('track-select');
  }

  protected transition(): TransitionKind {
    return 'slide-left';
  }

  protected build(_params: Record<string, unknown>): void {
    const { selected } = this;
    const wrap = document.createElement('div');
    wrap.className = 'screen-inner track-select-wrap';

    const header = document.createElement('div');
    header.className = 'screen-header';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'screen-eyebrow';
    eyebrow.textContent = 'Step 1 of 2';
    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = 'Select Track';
    header.append(eyebrow, title);
    wrap.appendChild(header);

    // Horizontal rail with scroll-snap
    const rail = document.createElement('div');
    rail.className = 'track-rail';
    rail.setAttribute('data-focus-group', 'tracks');
    rail.style.cssText = `
      display: flex;
      gap: 16px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding: 16px 24px;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-x: contain;
    `;

    TRACKS.map((track, index) => {
      const cardEl = document.createElement('article');
      cardEl.className = 'card track-card';
      cardEl.style.cssText = `
        flex: 0 0 280px;
        scroll-snap-align: center;
        position: relative;
      `;
      if (index === 0) cardEl.style.marginLeft = '0';
      if (index === TRACKS.length - 1) cardEl.style.marginRight = '0';
      cardEl.setAttribute('data-track-id', track.id);
      cardEl.setAttribute('tabindex', '0');
      cardEl.setAttribute('role', 'button');
      cardEl.setAttribute('aria-label', `${track.name}, ${track.subtitle}`);

      // Track map SVG
      const mapContainer = document.createElement('div');
      mapContainer.className = 'track-map';
      mapContainer.style.cssText = `
        width: 100%;
        height: 120px;
        margin-bottom: 12px;
        border-radius: var(--radius);
        overflow: hidden;
        background: var(--surface);
        border: 1px solid var(--glass-border);
      `;
      mapContainer.innerHTML = track.mapSvg;

      // Track info
      const info = document.createElement('div');
      info.className = 'track-info';
      info.innerHTML = `
        <h3 class="track-name">${track.name}</h3>
        <p class="track-subtitle">${track.subtitle}</p>
        <div class="track-meta">
          <span class="badge badge-cyan">${track.weather}</span>
          <span class="badge badge-gold">${track.environment}</span>
        </div>
        <div class="track-meta-row">
          <span class="track-difficulty">Difficulty: ${difficultyStars(track.difficulty)}</span>
          <span class="track-duration">${track.duration}</span>
        </div>
      `;

      // Best time placeholder
      const bestTime = document.createElement('div');
      bestTime.className = 'track-best';
      bestTime.innerHTML = `
        <span class="track-best-label">Best Time</span>
        <span class="track-best-time">--:--.---</span>
      `;

      cardEl.append(mapContainer, info, bestTime);

      // Selection handling
      const handleSelect = () => {
        SoundHooks.confirm();
        for (const child of rail.children) {
          (child as HTMLElement).classList.remove('card-selected');
        }
        cardEl.classList.add('card-selected');
        this.selected = track.id;
        this.onSelect?.(track.id);
      };

      cardEl.addEventListener('click', handleSelect);
      cardEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      });

      // Hover effect
      cardEl.addEventListener('mouseenter', () => {
        if (!cardEl.classList.contains('card-selected')) {
          cardEl.style.transform = 'translateY(-4px)';
          cardEl.style.boxShadow = 'var(--shadow-card), var(--glow-primary)';
        }
      });
      cardEl.addEventListener('mouseleave', () => {
        if (!cardEl.classList.contains('card-selected')) {
          cardEl.style.transform = '';
          cardEl.style.boxShadow = '';
        }
      });

      if (selected === track.id) {
        cardEl.classList.add('card-selected');
      }

      rail.appendChild(cardEl);
      return cardEl;
    });

    wrap.appendChild(rail);

    // Footer with back button
    const footer = document.createElement('div');
    footer.className = 'screen-footer';
    const backBtn = new Button('Back', { variant: 'ghost' });
    backBtn.el.addEventListener('click', () => this.onBack?.());
    footer.appendChild(backBtn.el);
    wrap.appendChild(footer);

    this.el.appendChild(wrap);

    // Entrance animations
    void AnimationSystem.play(header, 'fade-in');
    void AnimationSystem.stagger(
      Array.from(rail.children) as HTMLElement[],
      'slide-in-up',
      { duration: 460 },
      60
    );
  }
}
