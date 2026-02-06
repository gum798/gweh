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
    '--bg-primary': '#f5f3f0',
    '--bg-panel': 'rgba(255, 255, 255, 0.75)',
    '--bg-panel-solid': '#ffffff',
    '--bg-hero-bottom': '#f5f3f0',
    '--bg-hero-mid': 'rgba(245, 243, 240, 0.6)',
    '--accent': '#b8930f',
    '--accent-hover': '#a07e0d',
    '--accent-glow': 'rgba(184, 147, 15, 0.3)',
    '--accent-10': 'rgba(184, 147, 15, 0.08)',
    '--accent-20': 'rgba(184, 147, 15, 0.15)',
    '--accent-30': 'rgba(184, 147, 15, 0.22)',
    '--accent-40': 'rgba(184, 147, 15, 0.3)',
    '--accent-50': 'rgba(184, 147, 15, 0.4)',
    '--scrollbar-track': '#e8e5e0',
    '--scrollbar-thumb': '#b8930f',
    '--scrollbar-thumb-hover': '#a07e0d',
    '--glow-1': '0 0 5px rgba(184,147,15,0.2), 0 0 10px rgba(184,147,15,0.1)',
    '--glow-2': '0 0 15px rgba(184,147,15,0.15), 0 0 25px rgba(184,147,15,0.08)',
    '--text-glow': 'rgba(184, 147, 15, 0.3)',
    '--glass-border': 'rgba(184, 147, 15, 0.2)',
    '--text-primary': '#1a1a2e',
    '--text-secondary': 'rgba(26, 26, 46, 0.7)',
    '--text-muted': 'rgba(26, 26, 46, 0.5)',
    '--text-faint': 'rgba(26, 26, 46, 0.3)',
    '--border-default': 'rgba(0, 0, 0, 0.1)',
    '--surface-overlay': 'rgba(0, 0, 0, 0.04)',
    '--surface-elevated': 'rgba(0, 0, 0, 0.06)',
  },
  celestial: {
    '--bg-primary': '#f0f4fa',
    '--bg-panel': 'rgba(255, 255, 255, 0.75)',
    '--bg-panel-solid': '#ffffff',
    '--bg-hero-bottom': '#f0f4fa',
    '--bg-hero-mid': 'rgba(240, 244, 250, 0.6)',
    '--accent': '#2563eb',
    '--accent-hover': '#1d4ed8',
    '--accent-glow': 'rgba(37, 99, 235, 0.3)',
    '--accent-10': 'rgba(37, 99, 235, 0.08)',
    '--accent-20': 'rgba(37, 99, 235, 0.15)',
    '--accent-30': 'rgba(37, 99, 235, 0.22)',
    '--accent-40': 'rgba(37, 99, 235, 0.3)',
    '--accent-50': 'rgba(37, 99, 235, 0.4)',
    '--scrollbar-track': '#e5e9f0',
    '--scrollbar-thumb': '#2563eb',
    '--scrollbar-thumb-hover': '#1d4ed8',
    '--glow-1': '0 0 5px rgba(37,99,235,0.15), 0 0 10px rgba(37,99,235,0.08)',
    '--glow-2': '0 0 15px rgba(37,99,235,0.12), 0 0 25px rgba(37,99,235,0.06)',
    '--text-glow': 'rgba(37, 99, 235, 0.25)',
    '--glass-border': 'rgba(37, 99, 235, 0.15)',
    '--text-primary': '#1a1a2e',
    '--text-secondary': 'rgba(26, 26, 46, 0.7)',
    '--text-muted': 'rgba(26, 26, 46, 0.5)',
    '--text-faint': 'rgba(26, 26, 46, 0.3)',
    '--border-default': 'rgba(0, 0, 0, 0.1)',
    '--surface-overlay': 'rgba(0, 0, 0, 0.04)',
    '--surface-elevated': 'rgba(0, 0, 0, 0.06)',
  },
  ember: {
    '--bg-primary': '#faf5f3',
    '--bg-panel': 'rgba(255, 255, 255, 0.75)',
    '--bg-panel-solid': '#ffffff',
    '--bg-hero-bottom': '#faf5f3',
    '--bg-hero-mid': 'rgba(250, 245, 243, 0.6)',
    '--accent': '#b91c1c',
    '--accent-hover': '#991b1b',
    '--accent-glow': 'rgba(185, 28, 28, 0.3)',
    '--accent-10': 'rgba(185, 28, 28, 0.08)',
    '--accent-20': 'rgba(185, 28, 28, 0.15)',
    '--accent-30': 'rgba(185, 28, 28, 0.22)',
    '--accent-40': 'rgba(185, 28, 28, 0.3)',
    '--accent-50': 'rgba(185, 28, 28, 0.4)',
    '--scrollbar-track': '#f0e8e5',
    '--scrollbar-thumb': '#b91c1c',
    '--scrollbar-thumb-hover': '#991b1b',
    '--glow-1': '0 0 5px rgba(185,28,28,0.15), 0 0 10px rgba(185,28,28,0.08)',
    '--glow-2': '0 0 15px rgba(185,28,28,0.12), 0 0 25px rgba(185,28,28,0.06)',
    '--text-glow': 'rgba(185, 28, 28, 0.25)',
    '--glass-border': 'rgba(185, 28, 28, 0.15)',
    '--text-primary': '#1a1a2e',
    '--text-secondary': 'rgba(26, 26, 46, 0.7)',
    '--text-muted': 'rgba(26, 26, 46, 0.5)',
    '--text-faint': 'rgba(26, 26, 46, 0.3)',
    '--border-default': 'rgba(0, 0, 0, 0.1)',
    '--surface-overlay': 'rgba(0, 0, 0, 0.04)',
    '--surface-elevated': 'rgba(0, 0, 0, 0.06)',
  },
  jade: {
    '--bg-primary': '#f0f7f3',
    '--bg-panel': 'rgba(255, 255, 255, 0.75)',
    '--bg-panel-solid': '#ffffff',
    '--bg-hero-bottom': '#f0f7f3',
    '--bg-hero-mid': 'rgba(240, 247, 243, 0.6)',
    '--accent': '#059669',
    '--accent-hover': '#047857',
    '--accent-glow': 'rgba(5, 150, 105, 0.3)',
    '--accent-10': 'rgba(5, 150, 105, 0.08)',
    '--accent-20': 'rgba(5, 150, 105, 0.15)',
    '--accent-30': 'rgba(5, 150, 105, 0.22)',
    '--accent-40': 'rgba(5, 150, 105, 0.3)',
    '--accent-50': 'rgba(5, 150, 105, 0.4)',
    '--scrollbar-track': '#e0ede5',
    '--scrollbar-thumb': '#059669',
    '--scrollbar-thumb-hover': '#047857',
    '--glow-1': '0 0 5px rgba(5,150,105,0.15), 0 0 10px rgba(5,150,105,0.08)',
    '--glow-2': '0 0 15px rgba(5,150,105,0.12), 0 0 25px rgba(5,150,105,0.06)',
    '--text-glow': 'rgba(5, 150, 105, 0.25)',
    '--glass-border': 'rgba(5, 150, 105, 0.15)',
    '--text-primary': '#1a1a2e',
    '--text-secondary': 'rgba(26, 26, 46, 0.7)',
    '--text-muted': 'rgba(26, 26, 46, 0.5)',
    '--text-faint': 'rgba(26, 26, 46, 0.3)',
    '--border-default': 'rgba(0, 0, 0, 0.1)',
    '--surface-overlay': 'rgba(0, 0, 0, 0.04)',
    '--surface-elevated': 'rgba(0, 0, 0, 0.06)',
  },
};

/**
 * ✨ Change this value to switch the entire app's design skin ✨
 * Options: 'cosmic' | 'celestial' | 'ember' | 'jade'
 */
export const DEFAULT_THEME: ThemeKey = 'cosmic';
