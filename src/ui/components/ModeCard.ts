import { GlassCard } from './GlassCard';

export interface ModeCardData {
  name: string;
  subtitle?: string;
  gradient?: string;
  difficulty?: string;
  inputIcons?: string;
  duration?: string;
  description?: string;
}

export interface ModeCardOptions {
  mode: ModeCardData;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Mode selection card built on GlassCard with mode-specific metadata.
 */
export class ModeCard extends GlassCard {
  constructor(opts: ModeCardOptions) {
    const { mode, selected, onClick } = opts;
    super({
      title: mode.name,
      subtitle: mode.subtitle,
      preview: mode.gradient,
      badge: mode.difficulty,
      selected,
      focusable: true,
      onClick,
    });

    if (mode.inputIcons) {
      const icons = document.createElement('div');
      icons.className = 'card-meta-icons';
      icons.textContent = mode.inputIcons;
      this.addSlot(icons);
    }

    if (mode.duration) {
      this.addMeta({ label: 'Duration', value: mode.duration });
    }

    if (mode.description) {
      this.setDescription(mode.description);
    }
  }
}
