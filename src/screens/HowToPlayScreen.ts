import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import type { TransitionKind } from '../ui/core/TransitionSystem';

export class HowToPlayScreen extends Screen {
  onBack: (() => void) | null = null;

  constructor() {
    super('how-to-play');
  }

  protected transition(): TransitionKind {
    return 'fade';
  }

  protected build(): void {
    const wrap = document.createElement('div');
    wrap.className = 'screen-inner glass-panel';
    wrap.style.maxWidth = '600px';

    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = 'How to Play';
    wrap.appendChild(title);

    const content = document.createElement('div');
    content.className = 'setting-row';
    content.style.flexDirection = 'column';
    content.style.alignItems = 'flex-start';
    content.innerHTML = `
      <p style="color: var(--text2); font-size: 14px; margin-bottom: 12px; line-height: 1.5;">
        Steer the car by tilting your hand.
        Keep your hand flat (palm facing down) for neutral steering.
        Tilt left to steer left, tilt right to steer right.
      </p>
      <p style="color: var(--text2); font-size: 14px; margin-bottom: 12px; line-height: 1.5;">
        Avoid other cars on the road to maintain your speed and finish in 1st place!
      </p>
    `;
    wrap.appendChild(content);

    const actions = document.createElement('div');
    actions.className = 'settings-actions';
    const backBtn = new Button('Back', { variant: 'ghost' });
    backBtn.el.addEventListener('click', () => this.onBack?.());
    actions.appendChild(backBtn.el);
    wrap.appendChild(actions);

    this.el.appendChild(wrap);
  }
}
