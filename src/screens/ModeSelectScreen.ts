import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { GlassCard } from '../ui/components/GlassCard';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import { SoundHooks } from '../ui/core/SoundHooks';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import type { InputSourceId } from '../input/InputFrame';
import {
  GAME_MODES,
  MODE_ORDER,
  isSourceAllowed,
  type GameModeConfig,
  type ModeId,
} from '../game/GameModeConfig';

export type { ModeId };

export type ControlMethod = 'keyboard' | 'hand' | 'gyro' | 'phone' | 'gamepad';

/**
 * Control-method catalog. This is a UI concern: which method a player can
 * pick and how it is labelled. Whether a method is actually allowed for a
 * selected mode is derived from GameModeConfig (`mode.input`), never
 * duplicated here.
 */
export interface ControlMethodDef {
  id: ControlMethod;
  source: InputSourceId;
  label: string;
  /** Method is not implemented yet (kept visible but unavailable). */
  pending?: boolean;
}

export const CONTROL_METHODS: ControlMethodDef[] = [
  { id: 'keyboard', source: 'keyboard', label: 'Keyboard' },
  { id: 'hand', source: 'hand', label: 'Hand Tracking' },
  { id: 'gyro', source: 'gyro', label: 'Laptop Gyro' },
  { id: 'phone', source: 'phone', label: '📱 Phone Wheel' },
  { id: 'gamepad', source: 'gamepad', label: '🎮 Gamepad', pending: true },
];

const INPUT_LABEL: Partial<Record<InputSourceId, string>> = {
  keyboard: '⌨ Keyboard',
  gamepad: '🎮 Gamepad',
  hand: '🖐 Gesture',
};

const CONTROL_TO_SOURCE: Record<ControlMethod, InputSourceId> = Object.fromEntries(
  CONTROL_METHODS.map((m) => [m.id, m.source])
) as Record<ControlMethod, InputSourceId>;

function clampControlMethod(current: ControlMethod, mode: GameModeConfig): ControlMethod {
  if (isSourceAllowed(mode.id, CONTROL_TO_SOURCE[current])) return current;
  for (const m of CONTROL_METHODS) {
    if (!m.pending && isSourceAllowed(mode.id, m.source)) return m.id;
  }
  return current;
}

export class ModeSelectScreen extends Screen {
  trackId = '';
  selected: ModeId | null = null;
  controlMethod: ControlMethod = 'keyboard';
  onSelect: ((mode: ModeId) => void) | null = null;
  onBack: (() => void) | null = null;

  /** Mode whose controls are currently highlighted (hover/focus preview). */
  private previewMode: ModeId | null = null;
  private chipEls: HTMLButtonElement[] = [];

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

    const controlWrap = document.createElement('div');
    controlWrap.className = 'control-method-row';
    const controlLabel = document.createElement('div');
    controlLabel.className = 'control-method-label';
    controlLabel.textContent = 'CONTROL METHOD';
    controlWrap.appendChild(controlLabel);

    const chips = document.createElement('div');
    chips.className = 'control-method-chips';
    chips.setAttribute('data-focus-group', 'control-method');
    this.chipEls = CONTROL_METHODS.map((m) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'control-chip';
      chip.textContent = m.label;
      chip.dataset.method = m.id;
      chip.setAttribute('aria-pressed', this.controlMethod === m.id ? 'true' : 'false');
      if (m.pending) chip.classList.add('is-unavailable', 'is-pending');
      chip.addEventListener('click', () => {
        if (chip.disabled) return;
        SoundHooks.confirm();
        this.controlMethod = m.id;
        for (const other of this.chipEls) {
          other.setAttribute('aria-pressed', other === chip ? 'true' : 'false');
          other.classList.toggle('active', other === chip);
        }
      });
      if (this.controlMethod === m.id) chip.classList.add('active');
      chips.appendChild(chip);
      return chip;
    });
    controlWrap.appendChild(chips);

    this.syncChipAvailability(null);

    const cards = MODE_ORDER.map((id) => GAME_MODES[id]).map((mode) => {
      const card = new GlassCard({
        title: mode.name,
        subtitle: mode.subtitle,
        preview: mode.ui.gradient,
        badge: `Difficulty ${'★'.repeat(mode.ui.difficulty)}${'☆'.repeat(3 - mode.ui.difficulty)}`,
        focusable: true,
        onClick: () => {
          SoundHooks.confirm();
          for (const other of cards) other.setSelected(false);
          card.setSelected(true);
          this.controlMethod = clampControlMethod(this.controlMethod, mode);
          this.syncChipAvailability(mode.id);
          this.onSelect?.(mode.id);
        },
      });
      card.el.addEventListener('pointerenter', () => this.syncChipAvailability(mode.id));
      card.el.addEventListener('focus', () => this.syncChipAvailability(mode.id));
      const icons = document.createElement('div');
      icons.className = 'glass-card-meta';
      icons.style.borderTop = 'none';
      icons.style.paddingTop = '0';
      for (const kind of mode.input) {
        const label = INPUT_LABEL[kind];
        if (!label) continue;
        const chip = document.createElement('span');
        chip.className = `input-icon${kind === 'hand' ? ' input-icon--gesture' : ''}`;
        chip.textContent = label;
        icons.appendChild(chip);
      }
      card.addSlot(icons);
      card.addMeta({ label: 'Est. Duration', value: mode.ui.durationLabel });
      card.setDescription(mode.description);
      if (selected === mode.id) card.setSelected(true);
      grid.appendChild(card.el);
      return card;
    });
    wrap.appendChild(grid);
    wrap.appendChild(controlWrap);

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

  /**
   * Mark control methods that `mode` disallows as unavailable, and dim the
   * rest. `mode === null` shows all implemented methods as available.
   *
   * Mode-disallowed methods stay focusable and clickable (dimmed + labelled
   * unavailable) so keyboard users can still reach them; enforcement of the
   * allowed input source happens at mode selection via `clampControlMethod`.
   * Only pending (unimplemented) methods are hard-blocked via `disabled`.
   */
  private syncChipAvailability(mode: ModeId | null): void {
    this.previewMode = mode;
    for (const def of CONTROL_METHODS) {
      const el = this.chipEls.find((c) => c.dataset.method === def.id);
      if (!el) continue;
      const allowedForMode = mode === null ? true : isSourceAllowed(mode, def.source);
      const available = allowedForMode && !def.pending;
      el.disabled = def.pending;
      el.classList.toggle('is-unavailable', !available);
      el.setAttribute('aria-disabled', available ? 'false' : 'true');
      el.title = available ? '' : `Unavailable for ${mode ?? 'selected mode'}`;
    }
  }
}
