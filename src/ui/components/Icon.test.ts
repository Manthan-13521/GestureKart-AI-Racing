import { describe, expect, it } from 'vitest';
import { Icon, ICON_MAP } from './Icon';

describe('Icon', () => {
  it('renders an inline SVG for a known icon', () => {
    const icon = new Icon({ name: 'Flag', size: 24 });
    const svg = icon.el.innerHTML;
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 256 256"');
    expect(svg).toContain('width="24"');
    expect(svg).toContain('fill="currentColor"');
  });

  it('caches SVG output across calls', () => {
    const a = Icon.getSVG('Flag');
    const b = Icon.getSVG('Flag');
    expect(a).toBe(b);
  });

  it('applies a custom color', () => {
    const svg = Icon.getSVG('Trophy', 20, '#ff0000');
    expect(svg).toContain('fill="#ff0000"');
  });

  it('returns null for unknown icons and renders empty fallback', () => {
    expect(Icon.getSVG('DoesNotExist')).toBeNull();
    const icon = new Icon({ name: 'DoesNotExist' });
    expect(icon.el.innerHTML).toBe('');
  });

  it('is case-insensitive via PascalCase names', () => {
    expect(Icon.getSVG('GameController')).toBeTruthy();
    expect(Icon.getSVG('DeviceMobile')).toBeTruthy();
    expect(Icon.getSVG('HandTap')).toBeTruthy();
    expect(Icon.getSVG('QrCode')).toBeTruthy();
    expect(Icon.getSVG('PaintBrush')).toBeTruthy();
  });

  it('every ICON_MAP entry resolves to a real path', () => {
    for (const name of Object.values(ICON_MAP)) {
      expect(Icon.getSVG(name)).toBeTruthy();
    }
  });

  it('every icon referenced by screens resolves to a real path', () => {
    const used = [
      'Flag',
      'DeviceMobile',
      'Trophy',
      'Star',
      'PaintBrush',
      'Lightbulb',
      'Keyboard',
      'Hand',
      'GameController',
      'Diamond',
      'Crown',
      'Wheelchair',
      'Tag',
      'QrCode',
      'Money',
      'Infinity',
      'HandTap',
      'Checks',
    ];
    for (const name of used) {
      expect(Icon.getSVG(name), `missing path for ${name}`).toBeTruthy();
    }
  });
});
