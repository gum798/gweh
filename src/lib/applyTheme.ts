import { themes, ThemeKey, DEFAULT_THEME } from './themes';

export type ColorMode = 'light';

/**
 * Apply the gallery theme by setting CSS custom properties on :root.
 * Always applies light mode with the gallery theme.
 */
export function applyTheme(key: ThemeKey = DEFAULT_THEME, _mode: ColorMode = 'light'): void {
  const theme = themes[key];
  if (!theme) {
    console.warn(`[Theme] Unknown theme "${key}", falling back to "${DEFAULT_THEME}"`);
    applyTheme(DEFAULT_THEME);
    return;
  }

  const root = document.documentElement;
  root.setAttribute('data-theme', 'gallery');
  root.setAttribute('data-mode', 'light');

  // Apply theme CSS custom properties
  for (const [prop, value] of Object.entries(theme)) {
    if (prop.startsWith('--')) {
      root.style.setProperty(prop, value);
    }
  }

  // Always light mode
  root.style.colorScheme = 'light';
}
