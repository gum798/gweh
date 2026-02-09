/**
 * GWEH — Gallery Theme
 *
 * Single clean gallery theme with white background and blue accent.
 * Light mode only — no dark mode.
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
    '--bg-primary': '#ffffff',
    '--bg-panel': 'rgba(255, 255, 255, 0.95)',
    '--bg-panel-solid': '#ffffff',
    '--bg-hero-bottom': '#ffffff',
    '--bg-hero-mid': 'rgba(255, 255, 255, 0.7)',
    '--accent': '#2ea3f2',
    '--accent-hover': '#1a8fd8',
    '--accent-glow': 'rgba(46, 163, 242, 0.3)',
    '--accent-10': 'rgba(46, 163, 242, 0.08)',
    '--accent-20': 'rgba(46, 163, 242, 0.15)',
    '--accent-30': 'rgba(46, 163, 242, 0.22)',
    '--accent-40': 'rgba(46, 163, 242, 0.35)',
    '--accent-50': 'rgba(46, 163, 242, 0.5)',
    '--scrollbar-track': '#f5f5f5',
    '--scrollbar-thumb': '#2ea3f2',
    '--scrollbar-thumb-hover': '#1a8fd8',
    '--glow-1': 'none',
    '--glow-2': 'none',
    '--text-glow': 'transparent',
    '--glass-border': '#e5e5e5',
    '--text-primary': '#1a1a1a',
    '--text-secondary': '#666666',
    '--text-muted': '#999999',
    '--text-faint': '#cccccc',
    '--border-default': '#e5e5e5',
    '--surface-overlay': 'rgba(0, 0, 0, 0.02)',
    '--surface-elevated': 'rgba(0, 0, 0, 0.04)',
  },
};

export type ThemeKey = keyof typeof themes;

export const DEFAULT_THEME: ThemeKey = 'gallery';
