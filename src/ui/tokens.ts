export const MotionTokens = {
  duration: {
    fast: 160,
    base: 260,
    slow: 420,
    cinematic: 700,
    ambient: 1800,
  },
  easing: {
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    in: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    snap: 'cubic-bezier(0.12, 0.8, 0.32, 1)',
  },
} as const;

export const ZTokens = {
  screen: 10,
  header: 20,
  modal: 100,
  toast: 200,
  overlay: 300,
} as const;

export const Breakpoints = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
} as const;

export type BreakpointName = 'mobile' | 'tablet' | 'desktop';

export type ThemeMode = 'default' | 'high-contrast' | 'colorblind';

export type A11yPrefs = {
  highContrast: boolean;
  colorblind: boolean;
  largeHud: boolean;
  reducedMotion: boolean;
};

export const A11yPrefsDefaults: A11yPrefs = {
  highContrast: false,
  colorblind: false,
  largeHud: false,
  reducedMotion: false,
};
