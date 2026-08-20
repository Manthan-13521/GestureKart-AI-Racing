export const MotionTokens = {
  duration: {
    instant: 50,
    fast: 120,
    base: 200,
    medium: 280,
    slow: 400,
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
  stagger: {
    interval: 60,
    maxItems: 8,
  },
} as const;

export const ZTokens = {
  screen: 10,
  header: 20,
  modal: 100,
  toast: 200,
  overlay: 300,
  hud: 50,
  aiHud: 150,
  ceremony: 200,
  flash: 250,
} as const;

export const Breakpoints = {
  mobile: 600,
  tablet: 800,
  desktop: 1000,
  wide: 1280,
} as const;

export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide';

export type ThemeMode = 'default' | 'high-contrast' | 'colorblind';

export type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export const ColorblindModes: ColorblindMode[] = ['none', 'deuteranopia', 'protanopia', 'tritanopia'];

export type A11yPrefs = {
  highContrast: boolean;
  colorblind: boolean;
  colorblindMode: ColorblindMode;
  largeHud: boolean;
  reducedMotion: boolean;
};

export const A11yPrefsDefaults: A11yPrefs = {
  highContrast: false,
  colorblind: false,
  colorblindMode: 'none',
  largeHud: false,
  reducedMotion: false,
};

// Semantic color tokens (mirror CSS :root)
export const ColorTokens = {
  bg: '#05070b',
  bgElevated: '#0a0d13',
  surface: '#0c0f14',
  surfaceElevated: '#13171e',
  glass: 'rgba(255,255,255,0.03)',
  glassStrong: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.05)',
  borderBright: 'rgba(255,255,255,0.12)',
  borderHot: 'rgba(255,255,255,0.2)',
  accentPrimary: '#00ff66',
  accentPrimaryDim: 'rgba(0,255,102,0.15)',
  accentGold: '#ffd700',
  accentGoldDim: 'rgba(255,215,0,0.15)',
  accentCyan: '#00e5ff',
  accentCyanDim: 'rgba(0,229,255,0.12)',
  accentRed: '#e10600',
  accentRedDim: 'rgba(225,6,0,0.15)',
  accentMagenta: '#ff2d95',
  accentMagentaDim: 'rgba(255,45,149,0.12)',
  text: '#ffffff',
  textMuted: '#8a8e9c',
  textDim: '#4a4f5c',
  glowPrimary: '0 0 24px rgba(0,255,102,0.4)',
  glowGold: '0 0 24px rgba(255,215,0,0.5)',
  glowCyan: '0 0 24px rgba(0,229,255,0.4)',
  glowRed: '0 0 24px rgba(225,6,0,0.4)',
  glowMagenta: '0 0 24px rgba(255,45,149,0.4)',
  shadowCard: '0 8px 32px rgba(0,0,0,0.4)',
  shadowModal: '0 20px 60px rgba(0,0,0,0.55)',
} as const;

export const RadiusTokens = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  pill: '999px',
} as const;

export const FontTokens = {
  display: "'Orbitron', 'Rajdhani', system-ui, sans-serif",
  hud: "'Rajdhani', 'Share Tech Mono', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'Share Tech Mono', 'JetBrains Mono', monospace",
} as const;

export const TabularNums = 'tabular-nums';

export type MotionTokenKey = keyof typeof MotionTokens.duration;
export type EasingTokenKey = keyof typeof MotionTokens.easing;
export type ZTokenKey = keyof typeof ZTokens;
export type ColorTokenKey = keyof typeof ColorTokens;
export type RadiusTokenKey = keyof typeof RadiusTokens;
export type FontTokenKey = keyof typeof FontTokens;
