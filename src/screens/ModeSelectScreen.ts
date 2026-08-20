import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { GlassCard } from '../ui/components/GlassCard';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import { SoundHooks } from '../ui/core/SoundHooks';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import type { InputSourceId } from '../input/InputFrame';
import type { ModeId } from '../game/GameModeConfig';
import { GAME_MODES, isSourceAllowed, type GameModeConfig } from '../game/GameModeConfig';
import { Icon } from '../ui/components/Icon';

export type { ModeId };

export type ControlMethod = 'keyboard' | 'hand' | 'gyro' | 'phone' | 'gamepad';

export interface ControlMethodDef {
  id: ControlMethod;
  source: InputSourceId;
  label: string;
  icon: string;
  pending?: boolean;
}

export const CONTROL_METHODS: ControlMethodDef[] = [
  { id: 'keyboard', source: 'keyboard', label: 'Keyboard', icon: 'Keyboard' },
  { id: 'hand', source: 'hand', label: 'Hand Tracking', icon: 'Hand' },
  { id: 'gyro', source: 'gyro', label: 'Laptop Gyro', icon: 'DeviceMobile' },
  { id: 'phone', source: 'phone', label: 'Phone Wheel', icon: 'DeviceMobile' },
  { id: 'gamepad', source: 'gamepad', label: 'Gamepad', icon: 'GameController', pending: true },
];

/** Compact input icons shown on mode cards (not every source gets a glyph). */
const MODE_INPUT_ICONS: Partial<Record<InputSourceId, string>> = {
  keyboard: 'Keyboard',
  gamepad: 'GameController',
  hand: 'Hand',
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

/** Visual grouping of modes; DOM order follows MODE_ORDER so focus stays canonical. */
const MODE_GROUPS: Array<{ label: string; modes: ModeId[] }> = [
  { label: 'Compete', modes: ['versus', 'multiplayer'] },
  { label: 'Solo', modes: ['ai-race', 'survival'] },
];

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
    wrap.className = 'screen-inner mode-select-wrap';

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

    // Mode cards - grouped visually, but one focus cluster in MODE_ORDER so
    // keyboard navigation follows the canonical versus → multiplayer → ai-race
    // → survival sequence, then crosses into the control chips.
    const modeGroups = document.createElement('div');
    modeGroups.className = 'mode-groups';
    modeGroups.setAttribute('data-focus-group', 'modes');

    const cards: GlassCard[] = [];
    for (const group of MODE_GROUPS) {
      const groupEl = document.createElement('div');
      groupEl.className = 'mode-group';

      const groupLabel = document.createElement('h3');
      groupLabel.className = 'mode-group-label';
      groupLabel.textContent = group.label;
      groupEl.appendChild(groupLabel);

      const grid = document.createElement('div');
      grid.className = 'mode-card-grid';
      for (const id of group.modes) {
        const mode = GAME_MODES[id];
        const card = new GlassCard({
          title: mode.name,
          subtitle: mode.subtitle,
          preview: mode.ui.gradient,
          badge: `Difficulty ${'★'.repeat(mode.ui.difficulty)}${'☆'.repeat(3 - mode.ui.difficulty)}`,
          focusable: true,
          onClick: () => {
            for (const other of cards) other.setSelected(false);
            card.setSelected(true);
            this.controlMethod = clampControlMethod(this.controlMethod, mode);
            this.syncChipAvailability(mode.id);
            this.selectMethod(this.controlMethod);
            this.onSelect?.(mode.id);
          },
        });

        // Input method icons
        const icons = document.createElement('div');
        icons.className = 'mode-input-icons';
        for (const kind of mode.input) {
          const iconName = MODE_INPUT_ICONS[kind];
          if (!iconName) continue;
          const iconEl = document.createElement('span');
          iconEl.className = 'input-icon';
          iconEl.title = kind;
          const iconComp = new Icon({ name: iconName, size: 14 });
          iconEl.appendChild(iconComp.el);
          icons.appendChild(iconEl);
        }
        card.addSlot(icons);

        card.addMeta({ label: 'Est. Duration', value: mode.ui.durationLabel });
        card.setDescription(mode.description);
        if (selected === mode.id) card.setSelected(true);

        // Preview chip availability on hover/focus without committing.
        card.el.addEventListener('pointerenter', () => this.syncChipAvailability(mode.id));
        card.el.addEventListener('focus', () => this.syncChipAvailability(mode.id));

        grid.appendChild(card.el);
        cards.push(card);
      }
      groupEl.appendChild(grid);
      modeGroups.appendChild(groupEl);
    }
    wrap.appendChild(modeGroups);

    // Control method chips
    const controlWrap = document.createElement('div');
    controlWrap.className = 'control-method-row';
    const controlLabel = document.createElement('div');
    controlLabel.className = 'control-method-label';
    controlLabel.textContent = 'CONTROL METHOD';
    controlWrap.appendChild(controlLabel);

    const status = document.createElement('div');
    status.className = 'visually-hidden';
    status.setAttribute('data-live', 'control-method');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    controlWrap.appendChild(status);

    const chips = document.createElement('div');
    chips.className = 'control-method-chips';
    chips.setAttribute('data-focus-group', 'control-method');
    chips.setAttribute('role', 'group');
    chips.setAttribute('aria-label', 'Control method');

    this.chipEls = CONTROL_METHODS.map((m) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'control-chip';
      chip.dataset.method = m.id;
      chip.setAttribute('aria-pressed', this.controlMethod === m.id ? 'true' : 'false');
      if (m.pending) chip.classList.add('is-unavailable', 'is-pending');
      const iconSpan = document.createElement('span');
      iconSpan.className = 'control-chip-icon';
      iconSpan.setAttribute('aria-hidden', 'true');
      const iconComp = new Icon({ name: m.icon, size: 16 });
      iconSpan.appendChild(iconComp.el);
      const labelSpan = document.createElement('span');
      labelSpan.className = 'control-chip-label';
      labelSpan.textContent = m.label;
      chip.append(iconSpan, labelSpan);
      if (m.pending) {
        const pending = document.createElement('span');
        pending.className = 'control-chip-pending';
        pending.textContent = 'Soon';
        chip.appendChild(pending);
      }
      chip.addEventListener('click', () => {
        if (chip.disabled) return;
        this.selectMethod(m.id);
      });
      if (this.controlMethod === m.id) chip.classList.add('active');
      chips.appendChild(chip);
      return chip;
    });
    controlWrap.appendChild(chips);
    wrap.appendChild(controlWrap);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'screen-footer';
    const backBtn = new Button('Back', { variant: 'ghost' });
    backBtn.el.addEventListener('click', () => this.onBack?.());
    footer.appendChild(backBtn.el);
    wrap.appendChild(footer);

    this.el.appendChild(wrap);

    // Sync initial chip availability
    this.syncChipAvailability(selected);

    // Entrance animations
    void AnimationSystem.play(header, 'fade-in');
    void AnimationSystem.stagger(
      cards.map((c) => c.el),
      'slide-in-up',
      { duration: 460 },
      60
    );
  }

  private selectMethod(m: ControlMethod, opts: { announce?: boolean } = {}): void {
    this.controlMethod = m;
    for (const other of this.chipEls) {
      const selected = other.dataset.method === m;
      other.setAttribute('aria-pressed', selected ? 'true' : 'false');
      other.classList.toggle('active', selected);
    }
    if (opts.announce !== false) {
      SoundHooks.confirm();
      this.setStatusMessage(`${m.replace(/-/g, ' ')} selected`);
    }
  }

  /** Live-region text for accessible confirmation (no-op when unsupported). */
  private setStatusMessage(msg: string): void {
    const live = this.el.querySelector('[data-live="control-method"]');
    if (live) live.textContent = msg;
  }

  private syncChipAvailability(mode: ModeId | null): void {
    this.previewMode = mode;
    for (const def of CONTROL_METHODS) {
      const el = this.chipEls.find((c) => c.dataset.method === def.id);
      if (!el) continue;
      const allowedForMode = mode === null ? true : isSourceAllowed(mode, def.source);
      const available = allowedForMode && !def.pending;
      el.disabled = !!def.pending;
      el.classList.toggle('is-unavailable', !available);
      el.setAttribute('aria-disabled', available ? 'false' : 'true');
      el.title = available ? '' : `Unavailable for ${mode ?? 'selected mode'}`;
    }
  }
}
