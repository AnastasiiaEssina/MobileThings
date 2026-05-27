import { reactive } from 'vue';

export type ThemeName = 'light' | 'dark';

export type ColorPalette = {
  primary: string;
  accent: string;
  background: string;
  profileBackground: string;
  profileText: string;
  profileButton: string;
  cardBackground: string;
  navActiveBackground: string;
  darkText: string;
  mutedText: string;
};

export const THEME_PALETTES: Record<ThemeName, ColorPalette> = {
  light: {
    primary: '#d71f1f',
    accent: '#8252f2',
    background: '#FFFFFF',
    profileBackground: '#f9f0de',
    profileText: '#7d1b29',
    profileButton: '#adbdb5',
    cardBackground: '#ececec',
    navActiveBackground: '#ece8d3',
    darkText: '#222222',
    mutedText: '#4f3a3a',
  },
  dark: {
    primary: '#e05d6f',
    accent: '#77bfa3',
    background: '#1f1b1c',
    profileBackground: '#2b2225',
    profileText: '#f2d8dc',
    profileButton: '#536b61',
    cardBackground: '#3a3032',
    navActiveBackground: '#4a3d35',
    darkText: '#f3ece8',
    mutedText: '#ccb8b6',
  },
};

export const COLORS = reactive<ColorPalette>({ ...THEME_PALETTES.light });

export function applyThemePalette(theme: ThemeName) {
  Object.assign(COLORS, THEME_PALETTES[theme]);
}
