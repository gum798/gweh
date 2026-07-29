/**
 * GWEH — Gallery Theme
 *
 * Single dark mystic theme: deep purple background with violet accent.
 * Dark mode only — no light mode.
 *
 * 값은 tailwind.config.js 의 팔레트와 같아야 한다. 지금 이 변수들을 읽는 CSS 는
 * 하나도 없지만(var(--…) 소비처 0곳), 값이 라이트로 남아 있으면 다음 사람이
 * 팔레트를 여기서 읽고 흰색을 다시 들여온다.
 */

export interface ThemeDefinition {
  name: string;
  nameKo: string;
  /** Main background */
  '--bg-primary': string;
  /** Panel/card background (semi-transparent) */
  '--bg-panel': string;
  /** Solid panel for modals */
  '--bg-panel-solid': string;
  /** Hero gradient overlay bottom color */
  '--bg-hero-bottom': string;
  /** Hero gradient overlay mid color */
  '--bg-hero-mid': string;
  /** Primary accent color */
  '--accent': string;
  /** Accent hover state */
  '--accent-hover': string;
  /** Accent glow (for shadows/rings) */
  '--accent-glow': string;
  /** Accent at 10% opacity */
  '--accent-10': string;
  /** Accent at 20% opacity */
  '--accent-20': string;
  /** Accent at 30% opacity */
  '--accent-30': string;
  /** Accent at 40% opacity */
  '--accent-40': string;
  /** Accent at 50% opacity */
  '--accent-50': string;
  /** Scrollbar track */
  '--scrollbar-track': string;
  /** Scrollbar thumb */
  '--scrollbar-thumb': string;
  /** Scrollbar thumb hover */
  '--scrollbar-thumb-hover': string;
  /** Glow animation color 1 */
  '--glow-1': string;
  /** Glow animation color 2 */
  '--glow-2': string;
  /** Text shadow glow color */
  '--text-glow': string;
  /** Glass panel border */
  '--glass-border': string;
  /** Primary text color */
  '--text-primary': string;
  /** Secondary text color */
  '--text-secondary': string;
  /** Muted text color */
  '--text-muted': string;
  /** Faint text color */
  '--text-faint': string;
  /** Default border color */
  '--border-default': string;
  /** Overlay surface background */
  '--surface-overlay': string;
  /** Elevated surface background */
  '--surface-elevated': string;
}

export const themes: Record<string, ThemeDefinition> = {
  gallery: {
    name: 'Gallery',
    nameKo: '갤러리',
    '--bg-primary': '#161022',
    '--bg-panel': 'rgba(48, 37, 78, 0.95)',
    '--bg-panel-solid': '#30254e',
    '--bg-hero-bottom': '#161022',
    '--bg-hero-mid': 'rgba(22, 16, 34, 0.7)',
    '--accent': '#5b13ec',
    '--accent-hover': '#6d2af0',
    '--accent-glow': 'rgba(91, 19, 236, 0.35)',
    '--accent-10': 'rgba(184, 165, 255, 0.08)',
    '--accent-20': 'rgba(184, 165, 255, 0.15)',
    '--accent-30': 'rgba(184, 165, 255, 0.22)',
    '--accent-40': 'rgba(184, 165, 255, 0.35)',
    '--accent-50': 'rgba(184, 165, 255, 0.5)',
    '--scrollbar-track': '#30254e',
    '--scrollbar-thumb': '#5b13ec',
    '--scrollbar-thumb-hover': '#6d2af0',
    '--glow-1': 'none',
    '--glow-2': 'none',
    '--text-glow': 'transparent',
    '--glass-border': '#8175a4',
    '--text-primary': '#f6f6f8',
    '--text-secondary': '#b8b0c8',
    '--text-muted': '#9c93ad',
    '--text-faint': '#8175a4',
    '--border-default': '#8175a4',
    '--surface-overlay': 'rgba(255, 255, 255, 0.03)',
    '--surface-elevated': 'rgba(255, 255, 255, 0.06)',
  },
};

export type ThemeKey = keyof typeof themes;

export const DEFAULT_THEME: ThemeKey = 'gallery';
