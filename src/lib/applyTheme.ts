import { themes, lightOverrides, ThemeKey, DEFAULT_THEME } from './themes';

export type ColorMode = 'dark' | 'light';

/**
 * Apply a theme by setting CSS custom properties on :root.
 * Call once at startup. Call again to switch themes or color modes at runtime.
 */
export function applyTheme(key: ThemeKey = DEFAULT_THEME, mode: ColorMode = 'dark'): void {
  const theme = themes[key];
  if (!theme) {
    console.warn(`[Theme] Unknown theme "${key}", falling back to "${DEFAULT_THEME}"`);
    applyTheme(DEFAULT_THEME, mode);
    return;
  }

  const root = document.documentElement;
  root.setAttribute('data-theme', key);
  root.setAttribute('data-mode', mode);

  // 1. Apply base theme
  for (const [prop, value] of Object.entries(theme)) {
    if (prop.startsWith('--')) {
      root.style.setProperty(prop, value);
    }
  }

  // 2. Apply light mode overrides
  if (mode === 'light') {
    const overrides = lightOverrides[key];
    if (overrides) {
      for (const [prop, value] of Object.entries(overrides)) {
        if (prop.startsWith('--')) {
          root.style.setProperty(prop, value as string);
        }
      }
    }
  }

  // 3. Set color-scheme
  root.style.colorScheme = mode;
}
