import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { GlassCard } from '../ui/components/GlassCard';
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
}

function difficultyStars(level: number): string {
  return '★'.repeat(level) + '☆'.repeat(3 - level);
}

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
    wrap.className = 'screen-inner';

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

    const grid = document.createElement('div');
    grid.className = 'card-grid card-grid--3';
    grid.setAttribute('data-focus-group', 'tracks');

    const cards = TRACKS.map((track) => {
      const card = new GlassCard({
        title: track.name,
        subtitle: track.subtitle,
        preview: track.gradient,
        badge: `${track.weather} · ${track.environment}`,
        focusable: true,
        onClick: () => {
          SoundHooks.confirm();
          for (const other of cards) other.setSelected(false);
          card.setSelected(true);
          this.onSelect?.(track.id);
        },
      });
      card.addMeta({ label: 'Difficulty', value: difficultyStars(track.difficulty) });
      card.addMeta({ label: 'Est. Duration', value: track.duration });
      card.setDescription(track.description);
      if (selected === track.id) card.setSelected(true);
      grid.appendChild(card.el);
      return card;
    });
    wrap.appendChild(grid);

    const footer = document.createElement('div');
    footer.className = 'screen-footer';
    const backBtn = new Button('Back', { variant: 'ghost' });
    backBtn.el.addEventListener('click', () => this.onBack?.());
    footer.appendChild(backBtn.el);
    wrap.appendChild(footer);

    this.el.appendChild(wrap);

    void AnimationSystem.play(header, 'fade-in');
    void AnimationSystem.stagger(
      cards.map((c) => c.el),
      'slide-in-up',
      { duration: 460 },
      80
    );
  }
}
