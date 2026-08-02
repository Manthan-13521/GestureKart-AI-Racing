import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { GlassCard } from '../ui/components/GlassCard';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import { SoundHooks } from '../ui/core/SoundHooks';
import type { TransitionKind } from '../ui/core/TransitionSystem';

export type ModeId = 'versus' | 'multiplayer' | 'ai-race' | 'survival';

export type InputKind = 'keyboard' | 'gamepad' | 'gesture';

export interface ModeDef {
  id: ModeId;
  name: string;
  subtitle: string;
  input: InputKind[];
  difficulty: 1 | 2 | 3;
  duration: string;
  gradient: string;
  description: string;
}

export const MODES: ModeDef[] = [
  {
    id: 'versus',
    name: 'You vs You',
    subtitle: 'Your best lap, your worst enemy',
    input: ['keyboard', 'gamepad'],
    difficulty: 1,
    duration: '~2:00',
    gradient: 'rgba(56, 189, 248, 0.55), rgba(30, 64, 175, 0.4)',
    description: 'Race the ghost of your previous best. Pure time attack.',
  },
  {
    id: 'multiplayer',
    name: 'Multiplayer',
    subtitle: 'Real rivals, real rubber',
    input: ['keyboard', 'gamepad'],
    difficulty: 2,
    duration: '~2:30',
    gradient: 'rgba(255, 215, 0, 0.5), rgba(255, 77, 94, 0.35)',
    description: 'Online duels. Dash pushes rivals — physics apply to everyone.',
  },
  {
    id: 'ai-race',
    name: 'AI Race',
    subtitle: 'Outsmart the pack',
    input: ['keyboard', 'gamepad'],
    difficulty: 2,
    duration: '~2:30',
    gradient: 'rgba(45, 255, 154, 0.5), rgba(5, 150, 105, 0.4)',
    description: 'Fight a grid of adaptive opponents to the chequered flag.',
  },
  {
    id: 'survival',
    name: 'Endless Survival',
    subtitle: 'The road never ends',
    input: ['gesture'],
    difficulty: 1,
    duration: 'Endless',
    gradient: 'rgba(168, 85, 247, 0.55), rgba(236, 72, 153, 0.35)',
    description: 'Gesture-only mode. Steer with your hands, dodge everything.',
  },
];

const INPUT_LABEL: Record<InputKind, string> = {
  keyboard: '⌨ Keyboard',
  gamepad: '🎮 Gamepad',
  gesture: '🖐 Gesture',
};

export class ModeSelectScreen extends Screen {
  trackId = '';
  selected: ModeId | null = null;
  onSelect: ((mode: ModeId) => void) | null = null;
  onBack: (() => void) | null = null;

  constructor() {
    super('mode-select');
  }

  protected transition(): TransitionKind {
    return 'slide-left';
  }

  protected build(_params: Record<string, unknown>): void {
    const { trackId, selected } = this;
    const wrap = document.createElement('div');
    wrap.className = 'screen-inner';

    const header = document.createElement('div');
    header.className = 'screen-header';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'screen-eyebrow';
    eyebrow.textContent = `Track: ${trackId.replace(/-/g, ' ')}`;
    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = 'Select Mode';
    header.append(eyebrow, title);
    wrap.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'card-grid card-grid--4';
    grid.setAttribute('data-focus-group', 'modes');

    const cards = MODES.map((mode) => {
      const card = new GlassCard({
        title: mode.name,
        subtitle: mode.subtitle,
        preview: mode.gradient,
        badge: `Difficulty ${'★'.repeat(mode.difficulty)}${'☆'.repeat(3 - mode.difficulty)}`,
        focusable: true,
        onClick: () => {
          SoundHooks.confirm();
          for (const other of cards) other.setSelected(false);
          card.setSelected(true);
          this.onSelect?.(mode.id);
        },
      });
      const icons = document.createElement('div');
      icons.className = 'glass-card-meta';
      icons.style.borderTop = 'none';
      icons.style.paddingTop = '0';
      for (const kind of mode.input) {
        const chip = document.createElement('span');
        chip.className = `input-icon${kind === 'gesture' ? ' input-icon--gesture' : ''}`;
        chip.textContent = INPUT_LABEL[kind];
        icons.appendChild(chip);
      }
      card.addSlot(icons);
      card.addMeta({ label: 'Est. Duration', value: mode.duration });
      card.setDescription(mode.description);
      if (selected === mode.id) card.setSelected(true);
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
