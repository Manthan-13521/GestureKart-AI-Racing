import { Screen } from '../ui/components/Screen';
import { Button } from '../ui/components/Button';
import { AnimationSystem } from '../ui/core/AnimationSystem';
import { NotificationSystem } from '../ui/core/NotificationSystem';
import { SoundHooks } from '../ui/core/SoundHooks';
import type { TransitionKind } from '../ui/core/TransitionSystem';
import type { A11yPrefs } from '../ui/tokens';

export type SettingsTab = 'graphics' | 'audio' | 'controls' | 'accessibility' | 'gameplay';

export interface SettingsModel {
  a11y: A11yPrefs;
  sensitivity: number;
  autoAccelerate: boolean;
  gyroscopeMode: boolean;
  graphicsQuality: 'performance' | 'balanced' | 'quality';
  shadows: boolean;
  particles: boolean;
  masterVolume: number;
  uiSounds: boolean;
}

export interface SettingsApi {
  get: () => SettingsModel;
  save: (patch: Partial<SettingsModel>) => void;
  calibrateGesture: () => void;
  onBack: () => void;
}

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'graphics', label: 'Graphics' },
  { id: 'audio', label: 'Audio' },
  { id: 'controls', label: 'Controls' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'gameplay', label: 'Gameplay' },
];

function row(label: string, hint: string): { el: HTMLElement; control: HTMLElement } {
  const el = document.createElement('div');
  el.className = 'setting-row';
  const info = document.createElement('div');
  info.className = 'setting-info';
  const strong = document.createElement('strong');
  strong.textContent = label;
  const span = document.createElement('span');
  span.textContent = hint;
  info.append(strong, span);
  el.appendChild(info);
  const control = document.createElement('div');
  el.appendChild(control);
  return { el, control };
}

function toggle(checked: boolean, onChange: (v: boolean) => void): HTMLElement {
  const wrap = document.createElement('label');
  wrap.className = 'toggle';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.setAttribute('role', 'switch');
  input.addEventListener('change', () => onChange(input.checked));
  const track = document.createElement('span');
  track.className = 'toggle-track';
  wrap.append(input, track);
  return wrap;
}

function slider(value: number, min: number, max: number, onChange: (v: number) => void): HTMLElement {
  const input = document.createElement('input');
  input.type = 'range';
  input.className = 'slider';
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.addEventListener('input', () => onChange(Number(input.value)));
  return input;
}

/**
 * Settings screen with five animated categories. Accessibility toggles
 * drive the ThemeManager through the provided API.
 */
export class SettingsScreen extends Screen {
  api: SettingsApi | null = null;
  private activeTab: SettingsTab = 'graphics';
  private content: HTMLElement | null = null;

  constructor() {
    super('settings');
  }

  protected transition(): TransitionKind {
    return 'slide-left';
  }

  protected build(_params: Record<string, unknown>): void {
    const api = this.api;
    if (!api) throw new Error('SettingsScreen: api not injected');
    const wrap = document.createElement('div');
    wrap.className = 'screen-inner';
    wrap.style.width = 'min(900px, 92vw)';

    const header = document.createElement('div');
    header.className = 'screen-header';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'screen-eyebrow';
    eyebrow.textContent = 'Options';
    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = 'Settings';
    header.append(eyebrow, title);
    wrap.appendChild(header);

    const tabBar = document.createElement('div');
    tabBar.className = 'tab-bar';
    for (const tab of TABS) {
      const btn = document.createElement('button');
      btn.className = `tab${tab.id === this.activeTab ? ' is-active' : ''}`;
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        SoundHooks.press();
        this.activeTab = tab.id;
        tabBar.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t === btn));
        this.renderContent(api, wrap);
      });
      tabBar.appendChild(btn);
    }
    wrap.appendChild(tabBar);

    this.content = document.createElement('div');
    this.content.className = 'panel';
    this.content.style.marginTop = '4px';
    wrap.appendChild(this.content);

    const footer = document.createElement('div');
    footer.className = 'screen-footer';
    const backBtn = new Button('Done', { variant: 'primary' });
    backBtn.el.addEventListener('click', () => {
      SoundHooks.confirm();
      api.onBack();
    });
    footer.appendChild(backBtn.el);
    wrap.appendChild(footer);

    this.el.appendChild(wrap);
    this.renderContent(api, wrap);
    void AnimationSystem.play(header, 'fade-in');
  }

  private renderContent(api: SettingsApi, _wrap: HTMLElement): void {
    if (!this.content) return;
    const model = api.get();
    this.content.replaceChildren();
    const panel = this.content;

    switch (this.activeTab) {
      case 'graphics': {
        const quality = row('Quality', 'Target rendering load');
        const sel = document.createElement('select');
        sel.className = 'slider';
        sel.style.width = 'auto';
        sel.style.height = '34px';
        sel.style.padding = '0 10px';
        for (const q of ['performance', 'balanced', 'quality'] as const) {
          const opt = document.createElement('option');
          opt.value = q;
          opt.textContent = q[0].toUpperCase() + q.slice(1);
          opt.selected = model.graphicsQuality === q;
          sel.appendChild(opt);
        }
        sel.addEventListener('change', () => {
          api.save({ graphicsQuality: sel.value as SettingsModel['graphicsQuality'] });
        });
        quality.control.appendChild(sel);
        panel.appendChild(quality.el);

        const shadows = row('Shadows', 'Real-time shadow mapping');
        shadows.control.appendChild(toggle(model.shadows, (v) => api.save({ shadows: v })));
        panel.appendChild(shadows.el);

        const particles = row('Particles', 'Ambient menu particles');
        particles.control.appendChild(toggle(model.particles, (v) => api.save({ particles: v })));
        panel.appendChild(particles.el);
        break;
      }
      case 'audio': {
        const vol = row('Master Volume', 'Engine and effects');
        vol.control.appendChild(
          slider(Math.round(model.masterVolume * 100), 0, 100, (v) => api.save({ masterVolume: v / 100 }))
        );
        panel.appendChild(vol.el);

        const ui = row('UI Sounds', 'Menu feedback clicks');
        ui.control.appendChild(toggle(model.uiSounds, (v) => api.save({ uiSounds: v })));
        panel.appendChild(ui.el);
        break;
      }
      case 'controls': {
        const keys = row('Steering Keys', 'A / D or Left / Right');
        const hint = document.createElement('span');
        hint.className = 'input-icon';
        hint.textContent = '⌨ A D · ← →';
        keys.control.appendChild(hint);
        panel.appendChild(keys.el);

        const gyro = row('Gyro Steering', 'Tilt device to steer');
        gyro.control.appendChild(toggle(model.gyroscopeMode, (v) => api.save({ gyroscopeMode: v })));
        panel.appendChild(gyro.el);

        const sens = row('Steering Sensitivity', 'Hand tracking responsiveness');
        sens.control.appendChild(slider(model.sensitivity, 10, 100, (v) => api.save({ sensitivity: v })));
        panel.appendChild(sens.el);
        break;
      }
      case 'accessibility': {
        const contrast = row('High Contrast', 'Brighter text and borders');
        contrast.control.appendChild(
          toggle(model.a11y.highContrast, (v) => api.save({ a11y: { ...model.a11y, highContrast: v } }))
        );
        panel.appendChild(contrast.el);

        const cb = row('Colorblind Mode', 'Blue-shifted accents');
        cb.control.appendChild(
          toggle(model.a11y.colorblind, (v) => api.save({ a11y: { ...model.a11y, colorblind: v } }))
        );
        panel.appendChild(cb.el);

        const hud = row('Large HUD', 'Enlarge UI and text');
        hud.control.appendChild(
          toggle(model.a11y.largeHud, (v) => api.save({ a11y: { ...model.a11y, largeHud: v } }))
        );
        panel.appendChild(hud.el);

        const motion = row('Reduced Motion', 'Disable ambient animation');
        motion.control.appendChild(
          toggle(model.a11y.reducedMotion, (v) => api.save({ a11y: { ...model.a11y, reducedMotion: v } }))
        );
        panel.appendChild(motion.el);

        const calibrate = row('Gesture Calibration', 'Center your hand position');
        const calBtn = new Button('Calibrate', { variant: 'outline', size: 'sm' });
        calBtn.el.addEventListener('click', () => {
          SoundHooks.confirm();
          api.calibrateGesture();
          NotificationSystem.getInstance().success('Calibration saved');
        });
        calibrate.control.appendChild(calBtn.el);
        panel.appendChild(calibrate.el);
        break;
      }
      case 'gameplay': {
        const auto = row('Auto-Accelerate', 'Car accelerates by itself');
        auto.control.appendChild(toggle(model.autoAccelerate, (v) => api.save({ autoAccelerate: v })));
        panel.appendChild(auto.el);

        const sens = row('Steering Sensitivity', 'On-track responsiveness');
        sens.control.appendChild(slider(model.sensitivity, 10, 100, (v) => api.save({ sensitivity: v })));
        panel.appendChild(sens.el);
        break;
      }
    }
    void AnimationSystem.play(panel, 'fade-in', { duration: 220 });
    void AnimationSystem.play(panel, 'slide-in-up', { duration: 220 });
  }
}
