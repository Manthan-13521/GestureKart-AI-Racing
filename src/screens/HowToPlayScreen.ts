import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import { Icon } from '../ui/components/Icon';

/**
 * HowToPlayScreen — comprehensive control guide.
 *
 * Covers all input methods: Hand (MediaPipe), Keyboard, Touch, Gyro,
 * Phone Controller, and Gamepad. Includes one-hand mode and accessibility.
 * Accurate to the actual InputManager implementation.
 */

interface ControlSection {
  title: string;
  icon: string;
  description: string;
  controls: Array<{ keys: string; action: string }>;
  tips?: string[];
}

export class HowToPlayScreen extends Screen {
  onBack: (() => void) | null = null;
  private activeSection = 0;
  private sections: ControlSection[] = [];

  constructor() {
    super('how-to-play');
  }

  protected transition(): TransitionKind {
    return 'fade';
  }

  protected build(): void {
    this.buildSections();

    const wrap = document.createElement('div');
    wrap.className = 'screen-inner screen-scrollable';
    wrap.style.maxWidth = '720px';

    const header = document.createElement('div');
    header.className = 'screen-header';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'screen-eyebrow';
    eyebrow.textContent = 'Guide';
    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = 'How to Play';
    const backBtn = new Button('Back', { variant: 'ghost', size: 'sm' });
    backBtn.el.addEventListener('click', () => this.onBack?.());
    header.append(eyebrow, title, backBtn.el);
    wrap.appendChild(header);

    // Section navigation tabs
    const tabBar = document.createElement('div');
    tabBar.className = 'tab-bar howto-tab-bar';
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const btn = document.createElement('button');
      btn.className = `tab howto-tab${i === this.activeSection ? ' is-active' : ''}`;
      const iconSpan = document.createElement('span');
      iconSpan.className = 'tab-icon';
      const iconComp = new Icon({ name: section.icon, size: 18 });
      iconSpan.appendChild(iconComp.el);
      const labelSpan = document.createElement('span');
      labelSpan.className = 'tab-label';
      labelSpan.textContent = section.title;
      btn.append(iconSpan, labelSpan);
      btn.addEventListener('click', () => {
        this.activeSection = i;
        tabBar.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t === btn));
        renderSection();
      });
      tabBar.appendChild(btn);
    }
    wrap.appendChild(tabBar);

    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'howto-content';
    wrap.appendChild(this.contentContainer);

    const footer = document.createElement('div');
    footer.className = 'screen-footer';
    const backBtn2 = new Button('Done', { variant: 'primary' });
    backBtn2.el.addEventListener('click', () => this.onBack?.());
    footer.appendChild(backBtn2.el);
    wrap.appendChild(footer);

    this.el.appendChild(wrap);

    const renderSection = (): void => {
      const section = this.sections[this.activeSection];
      this.contentContainer.innerHTML = '';

      const sectionEl = document.createElement('div');
      sectionEl.className = 'howto-section';

      const header = document.createElement('div');
      header.className = 'howto-header';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'howto-icon';
      iconSpan.setAttribute('aria-hidden', 'true');
      const iconComp = new Icon({ name: section.icon, size: 24 });
      iconSpan.appendChild(iconComp.el);

      const textDiv = document.createElement('div');
      const title = document.createElement('h3');
      title.className = 'howto-title';
      title.textContent = section.title;
      const desc = document.createElement('p');
      desc.className = 'howto-desc';
      desc.textContent = section.description;
      textDiv.append(title, desc);
      header.append(iconSpan, textDiv);
      sectionEl.appendChild(header);

      const controls = document.createElement('div');
      controls.className = 'howto-controls';
      for (const c of section.controls) {
        const row = document.createElement('div');
        row.className = 'control-row';
        const kbd = document.createElement('kbd');
        kbd.className = 'control-keys';
        kbd.textContent = c.keys;
        const action = document.createElement('span');
        action.className = 'control-action';
        action.textContent = c.action;
        row.append(kbd, action);
        controls.appendChild(row);
      }
      sectionEl.appendChild(controls);

      if (section.tips) {
        const tips = document.createElement('div');
        tips.className = 'howto-tips';
        const h4 = document.createElement('h4');
        h4.textContent = 'Tips';
        const ul = document.createElement('ul');
        for (const t of section.tips) {
          const li = document.createElement('li');
          li.textContent = t;
          ul.appendChild(li);
        }
        tips.append(h4, ul);
        sectionEl.appendChild(tips);
      }

      this.contentContainer.appendChild(sectionEl);
      void AnimationSystem.play(this.contentContainer, 'fade-in', { duration: 220 });
    };

    renderSection();
    void AnimationSystem.play(header, 'fade-in');
    void AnimationSystem.play(tabBar, 'slide-in-up', { delay: 100 });
  }

  private contentContainer!: HTMLElement;

  private buildSections(): void {
    this.sections = [
      {
        title: 'Hand Tracking',
        icon: 'Hand',
        description:
          'Endless Survival mode only. Uses MediaPipe Hands via webcam to detect your palm centers and map them to steering.',
        controls: [
          { keys: '🤲 Both Hands', action: 'Accelerate (auto when both detected)' },
          { keys: '👈 Left Palm', action: 'Steer Left' },
          { keys: '👉 Right Palm', action: 'Steer Right' },
          { keys: '⚙️ Calibrate', action: 'Settings → Accessibility → Gesture Calibration' },
        ],
        tips: [
          'Keep hands flat, palms facing down for best tracking',
          'Calibrate your neutral position for comfort',
          'Works best in well-lit environments',
          'One-Hand mode available in Settings → Controls',
        ],
      },
      {
        title: 'Keyboard',
        icon: 'Keyboard',
        description: 'Primary input for AI Race, You vs You, and Multiplayer. Works in all modes.',
        controls: [
          { keys: 'W / ↑', action: 'Accelerate' },
          { keys: 'A / ←', action: 'Steer Left' },
          { keys: 'D / →', action: 'Steer Right' },
          { keys: 'U', action: 'Toggle Auto-Accelerate' },
        ],
        tips: [
          'Auto-Accelerate holds gas so you only steer',
          'Keys work alongside touch/gyro — priority is: Replay > Phone > Auto > Gyro > Keyboard',
          'Remappable via browser extensions (not in-game)',
        ],
      },
      {
        title: 'Touch Controls',
        icon: 'HandTap',
        description: 'On-screen buttons for mobile play. Appears only during races.',
        controls: [
          { keys: '◀ Left Button', action: 'Steer Left (hold)' },
          { keys: '▶ Right Button', action: 'Steer Right (hold)' },
          { keys: 'GAS Button', action: 'Accelerate (hold)' },
          { keys: 'AUTO Button', action: 'Toggle Auto-Accelerate' },
        ],
        tips: [
          'One-Hand Mode: Left side = steer+gas, Right side = steer only',
          'Buttons use pointer capture — slide off to cancel',
          'Hidden on menus, appears automatically in races',
          'Haptic feedback on supported devices',
        ],
      },
      {
        title: 'Gyroscope',
        icon: 'DeviceMobile',
        description: 'Tilt your device to steer. Uses DeviceOrientation API (gamma axis).',
        controls: [
          { keys: 'Tilt Left', action: 'Steer Left' },
          { keys: 'Tilt Right', action: 'Steer Right' },
          { keys: '🔒 Permission', action: 'iOS requires tap to enable in Settings → Controls' },
        ],
        tips: [
          'Calibrate by holding device in neutral position',
          'Disabled automatically when touch/keyboard input detected',
          'Lower priority than touch/keyboard — toggle off if not needed',
        ],
      },
      {
        title: 'Phone Controller',
        icon: 'QrCode',
        description: 'Use your phone as a dedicated steering wheel via PeerJS WebRTC.',
        controls: [
          { keys: '📷 Scan QR', action: 'Pair phone to this browser session' },
          { keys: '🔢 Room Code', action: '6-character code for manual entry' },
          { keys: '📱 Tilt Phone', action: 'Steer (same as gyro, but on phone)' },
          { keys: '🔌 Disconnect', action: 'Auto on race end or Settings → Controls' },
        ],
        tips: [
          'Requires both devices on same network (or internet via PeerJS cloud)',
          'Phone shows minimal UI — just steering and connection status',
          'Unreliable channel for low-latency steering updates',
          'Falls back gracefully if connection drops',
        ],
      },
      {
        title: 'Gamepad',
        icon: 'GameController',
        description: 'Standard Gamepad API support. Works in all non-gesture modes.',
        controls: [
          { keys: 'L-Stick / D-Pad', action: 'Steer Left/Right' },
          { keys: 'Right Trigger / A', action: 'Accelerate' },
          { keys: 'Left Trigger / B', action: 'Brake (if mapped)' },
          { keys: 'Start', action: 'Pause/Resume' },
        ],
        tips: [
          'Auto-detected on connect — no pairing needed',
          'Rumble supported for collisions/near-misses (where available)',
          'Same priority as keyboard in InputManager',
        ],
      },
      {
        title: 'Accessibility',
        icon: 'Wheelchair',
        description: 'Options to make the game playable for everyone.',
        controls: [
          { keys: '🖐️ One-Hand Mode', action: 'Steer + gas from one touch side' },
          { keys: '🎨 Colorblind', action: 'Deuteranopia / Protanopia / Tritanopia presets' },
          { keys: '🔆 High Contrast', action: 'Brighter text and borders' },
          { keys: '📏 Large HUD', action: 'Scale UI up by 22%' },
          { keys: '🐌 Reduced Motion', action: 'Disable animations, shake, particles' },
          { keys: '⏸️ Hold-to-Confirm', action: 'Prevent accidental quit/leave' },
        ],
        tips: [
          'All settings in Settings → Accessibility tab',
          'Colorblind presets apply to gameplay HUD and menus',
          'Reduced Motion shortens cinematic intros to countdown only',
          'Touch targets meet 48px minimum (WCAG AA)',
        ],
      },
    ];
  }
}
