import { themes, ThemeKey, DEFAULT_THEME } from './themes';

/**
 * Apply a theme by setting CSS custom properties on :root.
 * Call once at startup. Call again to switch themes at runtime.
 */
export function applyTheme(key: ThemeKey = DEFAULT_THEME): void {
  const theme = themes[key];
  if (!theme) {
    console.warn(`[Theme] Unknown theme "${key}", falling back to "${DEFAULT_THEME}"`);
    applyTheme(DEFAULT_THEME);
    return;
  }

  const root = document.documentElement;
  root.setAttribute('data-theme', key);

  for (const [prop, value] of Object.entries(theme)) {
    if (prop.startsWith('--')) {
      root.style.setProperty(prop, value);
    }
  }
}
