/**
 * MYSTIC AI — Theme System
 *
 * 4 distinctive design skins. Change DEFAULT_THEME to switch.
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
}

export const themes: Record<string, ThemeDefinition> = {
  // ═══════════════════════════════════════════
  // 1. COSMIC DAWN — Dark navy + gold radiance
  // ═══════════════════════════════════════════
  cosmic: {
    name: 'Cosmic Dawn',
    nameKo: '코스믹 던',
    '--bg-primary': '#0a0a1a',
    '--bg-panel': 'rgba(18, 14, 36, 0.65)',
    '--bg-panel-solid': '#110e24',
    '--bg-hero-bottom': '#0a0a1a',
    '--bg-hero-mid': 'rgba(10, 10, 26, 0.6)',
    '--accent': '#d4af37',
    '--accent-hover': '#c9a227',
    '--accent-glow': 'rgba(212, 175, 55, 0.45)',
    '--accent-10': 'rgba(212, 175, 55, 0.1)',
    '--accent-20': 'rgba(212, 175, 55, 0.2)',
    '--accent-30': 'rgba(212, 175, 55, 0.3)',
    '--accent-40': 'rgba(212, 175, 55, 0.4)',
    '--accent-50': 'rgba(212, 175, 55, 0.5)',
    '--scrollbar-track': '#05050f',
    '--scrollbar-thumb': '#d4af37',
    '--scrollbar-thumb-hover': '#c9a227',
    '--glow-1': '0 0 5px #d4af37, 0 0 10px rgba(212,175,55,0.6)',
    '--glow-2': '0 0 20px #d4af37, 0 0 35px rgba(212,175,55,0.4)',
    '--text-glow': 'rgba(212, 175, 55, 0.5)',
    '--glass-border': 'rgba(212, 175, 55, 0.15)',
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
  },
};

export type ThemeKey = keyof typeof themes;

/**
 * ✨ Change this value to switch the entire app's design skin ✨
 * Options: 'cosmic' | 'celestial' | 'ember' | 'jade'
 */
export const DEFAULT_THEME: ThemeKey = 'cosmic';
