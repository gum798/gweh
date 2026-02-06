/**
 * MYSTIC AI — Theme System
 *
 * 4 distinctive design skins × 2 color modes (dark/light).
 * Each theme defines CSS custom properties applied to :root.
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
  // ═══════════════════════════════════════════
  // 1. COSMIC DAWN — Dark navy + gold radiance
  // ═══════════════════════════════════════════
  cosmic: {
    name: 'Cosmic Dawn',
    nameKo: '코스믹 던',
    '--bg-primary': '#06060f',
    '--bg-panel': 'rgba(14, 10, 30, 0.55)',
    '--bg-panel-solid': '#0d0a1e',
    '--bg-hero-bottom': '#06060f',
    '--bg-hero-mid': 'rgba(8, 6, 18, 0.6)',
    '--accent': '#d4af37',
    '--accent-hover': '#e8c547',
    '--accent-glow': 'rgba(212, 175, 55, 0.55)',
    '--accent-10': 'rgba(212, 175, 55, 0.1)',
    '--accent-20': 'rgba(212, 175, 55, 0.2)',
    '--accent-30': 'rgba(212, 175, 55, 0.3)',
    '--accent-40': 'rgba(212, 175, 55, 0.4)',
    '--accent-50': 'rgba(212, 175, 55, 0.5)',
    '--scrollbar-track': '#03030a',
    '--scrollbar-thumb': '#d4af37',
    '--scrollbar-thumb-hover': '#e8c547',
    '--glow-1': '0 0 6px #d4af37, 0 0 12px rgba(212,175,55,0.5)',
    '--glow-2': '0 0 24px #d4af37, 0 0 48px rgba(212,175,55,0.3), 0 0 80px rgba(140,100,20,0.15)',
    '--text-glow': 'rgba(212, 175, 55, 0.6)',
    '--glass-border': 'rgba(212, 175, 55, 0.12)',
    '--text-primary': '#f3f4f6',
    '--text-secondary': 'rgba(255, 255, 255, 0.7)',
    '--text-muted': 'rgba(255, 255, 255, 0.5)',
    '--text-faint': 'rgba(255, 255, 255, 0.3)',
    '--border-default': 'rgba(255, 255, 255, 0.08)',
    '--surface-overlay': 'rgba(255, 255, 255, 0.04)',
    '--surface-elevated': 'rgba(255, 255, 255, 0.08)',
  },

  // ═══════════════════════════════════════════
  // 2. CELESTIAL ORACLE — Navy sky + starlight gold
  // ═══════════════════════════════════════════
  celestial: {
    name: 'Celestial Oracle',
    nameKo: '천체 오라클',
    '--bg-primary': '#0a1628',
    '--bg-panel': 'rgba(15, 30, 55, 0.6)',
    '--bg-panel-solid': '#0f1e37',
    '--bg-hero-bottom': '#0a1628',
    '--bg-hero-mid': 'rgba(10, 22, 40, 0.6)',
    '--accent': '#3b82f6',
    '--accent-hover': '#2563eb',
    '--accent-glow': 'rgba(59, 130, 246, 0.5)',
    '--accent-10': 'rgba(59, 130, 246, 0.1)',
    '--accent-20': 'rgba(59, 130, 246, 0.2)',
    '--accent-30': 'rgba(59, 130, 246, 0.3)',
    '--accent-40': 'rgba(59, 130, 246, 0.4)',
    '--accent-50': 'rgba(59, 130, 246, 0.5)',
    '--scrollbar-track': '#060e1c',
    '--scrollbar-thumb': '#3b82f6',
    '--scrollbar-thumb-hover': '#2563eb',
    '--glow-1': '0 0 5px #f59e0b, 0 0 10px #f59e0b',
    '--glow-2': '0 0 20px #f59e0b, 0 0 30px #f59e0b',
    '--text-glow': 'rgba(245, 158, 11, 0.5)',
    '--glass-border': 'rgba(245, 158, 11, 0.2)',
    '--text-primary': '#f3f4f6',
    '--text-secondary': 'rgba(255, 255, 255, 0.7)',
    '--text-muted': 'rgba(255, 255, 255, 0.5)',
    '--text-faint': 'rgba(255, 255, 255, 0.3)',
    '--border-default': 'rgba(255, 255, 255, 0.1)',
    '--surface-overlay': 'rgba(255, 255, 255, 0.05)',
    '--surface-elevated': 'rgba(255, 255, 255, 0.1)',
  },

  // ═══════════════════════════════════════════
  // 3. EMBER DIVINATION — Dark fire + candlelight
  // ═══════════════════════════════════════════
  ember: {
    name: 'Ember Divination',
    nameKo: '엠버 디비네이션',
    '--bg-primary': '#1a0a0a',
    '--bg-panel': 'rgba(45, 20, 15, 0.6)',
    '--bg-panel-solid': '#2d140f',
    '--bg-hero-bottom': '#1a0a0a',
    '--bg-hero-mid': 'rgba(26, 10, 10, 0.6)',
    '--accent': '#dc2626',
    '--accent-hover': '#b91c1c',
    '--accent-glow': 'rgba(220, 38, 38, 0.5)',
    '--accent-10': 'rgba(220, 38, 38, 0.1)',
    '--accent-20': 'rgba(220, 38, 38, 0.2)',
    '--accent-30': 'rgba(220, 38, 38, 0.3)',
    '--accent-40': 'rgba(220, 38, 38, 0.4)',
    '--accent-50': 'rgba(220, 38, 38, 0.5)',
    '--scrollbar-track': '#0f0505',
    '--scrollbar-thumb': '#dc2626',
    '--scrollbar-thumb-hover': '#b91c1c',
    '--glow-1': '0 0 5px #f59e0b, 0 0 10px #f59e0b',
    '--glow-2': '0 0 20px #f59e0b, 0 0 30px #f59e0b',
    '--text-glow': 'rgba(245, 158, 11, 0.5)',
    '--glass-border': 'rgba(245, 158, 11, 0.2)',
    '--text-primary': '#f3f4f6',
    '--text-secondary': 'rgba(255, 255, 255, 0.7)',
    '--text-muted': 'rgba(255, 255, 255, 0.5)',
    '--text-faint': 'rgba(255, 255, 255, 0.3)',
    '--border-default': 'rgba(255, 255, 255, 0.1)',
    '--surface-overlay': 'rgba(255, 255, 255, 0.05)',
    '--surface-elevated': 'rgba(255, 255, 255, 0.1)',
  },

  // ═══════════════════════════════════════════
  // 4. JADE TEMPLE — Eastern green + cream
  // ═══════════════════════════════════════════
  jade: {
    name: 'Jade Temple',
    nameKo: '옥빛 사원',
    '--bg-primary': '#0a1a12',
    '--bg-panel': 'rgba(18, 40, 28, 0.6)',
    '--bg-panel-solid': '#12281c',
    '--bg-hero-bottom': '#0a1a12',
    '--bg-hero-mid': 'rgba(10, 26, 18, 0.6)',
    '--accent': '#10b981',
    '--accent-hover': '#059669',
    '--accent-glow': 'rgba(16, 185, 129, 0.5)',
    '--accent-10': 'rgba(16, 185, 129, 0.1)',
    '--accent-20': 'rgba(16, 185, 129, 0.2)',
    '--accent-30': 'rgba(16, 185, 129, 0.3)',
    '--accent-40': 'rgba(16, 185, 129, 0.4)',
    '--accent-50': 'rgba(16, 185, 129, 0.5)',
    '--scrollbar-track': '#050f0a',
    '--scrollbar-thumb': '#10b981',
    '--scrollbar-thumb-hover': '#059669',
    '--glow-1': '0 0 5px #fef3c7, 0 0 10px #fef3c7',
    '--glow-2': '0 0 20px #fef3c7, 0 0 30px #fef3c7',
    '--text-glow': 'rgba(254, 243, 199, 0.5)',
    '--glass-border': 'rgba(254, 243, 199, 0.2)',
    '--text-primary': '#f3f4f6',
    '--text-secondary': 'rgba(255, 255, 255, 0.7)',
    '--text-muted': 'rgba(255, 255, 255, 0.5)',
    '--text-faint': 'rgba(255, 255, 255, 0.3)',
    '--border-default': 'rgba(255, 255, 255, 0.1)',
    '--surface-overlay': 'rgba(255, 255, 255, 0.05)',
    '--surface-elevated': 'rgba(255, 255, 255, 0.1)',
  },
};

export type ThemeKey = keyof typeof themes;

/**
 * Light mode overrides per theme.
 * Applied on top of the base theme when color mode is 'light'.
 */
export const lightOverrides: Record<ThemeKey, Partial<ThemeDefinition>> = {
  cosmic: {
    '--bg-primary': '#f8f6ff',
    '--bg-panel': 'rgba(255, 255, 255, 0.88)',
    '--bg-panel-solid': '#ffffff',
    '--bg-hero-bottom': '#f8f6ff',
    '--bg-hero-mid': 'rgba(248, 246, 255, 0.7)',
    '--accent': '#b8860b',
    '--accent-hover': '#9a7209',
    '--accent-glow': 'rgba(184, 134, 11, 0.45)',
    '--accent-10': 'rgba(184, 134, 11, 0.08)',
    '--accent-20': 'rgba(184, 134, 11, 0.16)',
    '--accent-30': 'rgba(184, 134, 11, 0.24)',
    '--accent-40': 'rgba(184, 134, 11, 0.35)',
    '--accent-50': 'rgba(184, 134, 11, 0.5)',
    '--scrollbar-track': '#eeeafc',
    '--scrollbar-thumb': '#b8860b',
    '--scrollbar-thumb-hover': '#9a7209',
    '--glow-1': '0 0 8px rgba(184,134,11,0.3), 0 0 16px rgba(140,90,200,0.1)',
    '--glow-2': '0 0 24px rgba(184,134,11,0.25), 0 0 40px rgba(140,90,200,0.12), 0 0 60px rgba(184,134,11,0.08)',
    '--text-glow': 'rgba(184, 134, 11, 0.4)',
    '--glass-border': 'rgba(184, 134, 11, 0.18)',
    '--text-primary': '#1a1428',
    '--text-secondary': 'rgba(26, 20, 40, 0.78)',
    '--text-muted': 'rgba(26, 20, 40, 0.55)',
    '--text-faint': 'rgba(26, 20, 40, 0.35)',
    '--border-default': 'rgba(184, 134, 11, 0.12)',
    '--surface-overlay': 'rgba(140, 90, 200, 0.04)',
    '--surface-elevated': 'rgba(184, 134, 11, 0.06)',
  },
  celestial: {
    '--bg-primary': '#f0f4ff',
    '--bg-panel': 'rgba(255, 255, 255, 0.9)',
    '--bg-panel-solid': '#ffffff',
    '--bg-hero-bottom': '#f0f4ff',
    '--bg-hero-mid': 'rgba(240, 244, 255, 0.7)',
    '--accent': '#1d4ed8',
    '--accent-hover': '#1e40af',
    '--accent-glow': 'rgba(29, 78, 216, 0.45)',
    '--accent-10': 'rgba(29, 78, 216, 0.08)',
    '--accent-20': 'rgba(29, 78, 216, 0.16)',
    '--accent-30': 'rgba(29, 78, 216, 0.24)',
    '--accent-40': 'rgba(29, 78, 216, 0.35)',
    '--accent-50': 'rgba(29, 78, 216, 0.5)',
    '--scrollbar-track': '#e0e8fc',
    '--scrollbar-thumb': '#1d4ed8',
    '--scrollbar-thumb-hover': '#1e40af',
    '--glow-1': '0 0 8px rgba(29,78,216,0.25), 0 0 16px rgba(99,102,241,0.1)',
    '--glow-2': '0 0 24px rgba(29,78,216,0.2), 0 0 40px rgba(99,102,241,0.12)',
    '--text-glow': 'rgba(29, 78, 216, 0.35)',
    '--glass-border': 'rgba(29, 78, 216, 0.15)',
    '--text-primary': '#141832',
    '--text-secondary': 'rgba(20, 24, 50, 0.78)',
    '--text-muted': 'rgba(20, 24, 50, 0.55)',
    '--text-faint': 'rgba(20, 24, 50, 0.35)',
    '--border-default': 'rgba(29, 78, 216, 0.1)',
    '--surface-overlay': 'rgba(99, 102, 241, 0.04)',
    '--surface-elevated': 'rgba(29, 78, 216, 0.06)',
  },
  ember: {
    '--bg-primary': '#fff6f4',
    '--bg-panel': 'rgba(255, 255, 255, 0.88)',
    '--bg-panel-solid': '#ffffff',
    '--bg-hero-bottom': '#fff6f4',
    '--bg-hero-mid': 'rgba(255, 246, 244, 0.7)',
    '--accent': '#b91c1c',
    '--accent-hover': '#991b1b',
    '--accent-glow': 'rgba(185, 28, 28, 0.45)',
    '--accent-10': 'rgba(185, 28, 28, 0.08)',
    '--accent-20': 'rgba(185, 28, 28, 0.16)',
    '--accent-30': 'rgba(185, 28, 28, 0.24)',
    '--accent-40': 'rgba(185, 28, 28, 0.35)',
    '--accent-50': 'rgba(185, 28, 28, 0.5)',
    '--scrollbar-track': '#fce8e4',
    '--scrollbar-thumb': '#b91c1c',
    '--scrollbar-thumb-hover': '#991b1b',
    '--glow-1': '0 0 8px rgba(185,28,28,0.25), 0 0 16px rgba(251,146,60,0.1)',
    '--glow-2': '0 0 24px rgba(185,28,28,0.2), 0 0 40px rgba(251,146,60,0.12)',
    '--text-glow': 'rgba(185, 28, 28, 0.35)',
    '--glass-border': 'rgba(185, 28, 28, 0.15)',
    '--text-primary': '#2a1215',
    '--text-secondary': 'rgba(42, 18, 21, 0.78)',
    '--text-muted': 'rgba(42, 18, 21, 0.55)',
    '--text-faint': 'rgba(42, 18, 21, 0.35)',
    '--border-default': 'rgba(185, 28, 28, 0.1)',
    '--surface-overlay': 'rgba(251, 146, 60, 0.04)',
    '--surface-elevated': 'rgba(185, 28, 28, 0.06)',
  },
  jade: {
    '--bg-primary': '#f2fbf6',
    '--bg-panel': 'rgba(255, 255, 255, 0.88)',
    '--bg-panel-solid': '#ffffff',
    '--bg-hero-bottom': '#f2fbf6',
    '--bg-hero-mid': 'rgba(242, 251, 246, 0.7)',
    '--accent': '#087a52',
    '--accent-hover': '#065f3e',
    '--accent-glow': 'rgba(8, 122, 82, 0.45)',
    '--accent-10': 'rgba(8, 122, 82, 0.08)',
    '--accent-20': 'rgba(8, 122, 82, 0.16)',
    '--accent-30': 'rgba(8, 122, 82, 0.24)',
    '--accent-40': 'rgba(8, 122, 82, 0.35)',
    '--accent-50': 'rgba(8, 122, 82, 0.5)',
    '--scrollbar-track': '#ddf0e5',
    '--scrollbar-thumb': '#087a52',
    '--scrollbar-thumb-hover': '#065f3e',
    '--glow-1': '0 0 8px rgba(8,122,82,0.25), 0 0 16px rgba(52,211,153,0.1)',
    '--glow-2': '0 0 24px rgba(8,122,82,0.2), 0 0 40px rgba(52,211,153,0.12)',
    '--text-glow': 'rgba(8, 122, 82, 0.35)',
    '--glass-border': 'rgba(8, 122, 82, 0.15)',
    '--text-primary': '#0f2518',
    '--text-secondary': 'rgba(15, 37, 24, 0.78)',
    '--text-muted': 'rgba(15, 37, 24, 0.55)',
    '--text-faint': 'rgba(15, 37, 24, 0.35)',
    '--border-default': 'rgba(8, 122, 82, 0.1)',
    '--surface-overlay': 'rgba(52, 211, 153, 0.04)',
    '--surface-elevated': 'rgba(8, 122, 82, 0.06)',
  },
};

/**
 * ✨ Change this value to switch the entire app's design skin ✨
 * Options: 'cosmic' | 'celestial' | 'ember' | 'jade'
 */
export const DEFAULT_THEME: ThemeKey = 'cosmic';
