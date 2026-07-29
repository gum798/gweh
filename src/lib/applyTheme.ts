import { themes, ThemeKey, DEFAULT_THEME } from './themes';

export type ColorMode = 'dark';

/**
 * Apply the gallery theme by setting CSS custom properties on :root.
 * Always applies dark mode with the gallery theme.
 */
export function applyTheme(key: ThemeKey = DEFAULT_THEME, _mode: ColorMode = 'dark'): void {
  const theme = themes[key];
  if (!theme) {
    console.warn(`[Theme] Unknown theme "${key}", falling back to "${DEFAULT_THEME}"`);
    applyTheme(DEFAULT_THEME);
    return;
  }

  const root = document.documentElement;
  root.setAttribute('data-theme', 'gallery');
  root.setAttribute('data-mode', 'dark');

  // Apply theme CSS custom properties
  for (const [prop, value] of Object.entries(theme)) {
    if (prop.startsWith('--')) {
      root.style.setProperty(prop, value);
    }
  }

  // 항상 다크. 이 한 줄이 네이티브 컨트롤(select 드롭다운, 스크롤바, 자동완성
  // 배경)의 색을 정한다 — index.html 의 color-scheme 속성을 런타임에 덮어쓰므로
  // 여기를 안 바꾸면 부팅 직후에만 다크였다가 흰 드롭다운으로 되돌아간다.
  root.style.colorScheme = 'dark';
}
