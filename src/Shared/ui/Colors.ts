import { reactive } from 'vue';

export type AppTheme = 'light' | 'dark';

type AppColors = {
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

const THEME_COLORS: Record<AppTheme, AppColors> = {
  light: {
    primary: '#d71f1f',
    accent: '#8252f2',
    background: '#ffffff',
    profileBackground: '#f9f0de',
    profileText: '#7d1b29',
    profileButton: '#adbdb5',
    cardBackground: '#ececec',
    navActiveBackground: '#ece8d3',
    darkText: '#222222',
    mutedText: '#4f3a3a',
  },
  dark: {
    primary: '#f27783',
    accent: '#97aef7',
    background: '#171615',
    profileBackground: '#211d1e',
    profileText: '#f5d7d8',
    profileButton: '#59685f',
    cardBackground: '#312c2e',
    navActiveBackground: '#40373a',
    darkText: '#fff6ef',
    mutedText: '#ccb8b9',
  },
};

export const COLORS = reactive<AppColors>({ ...THEME_COLORS.light });

export function getAppTheme(theme: string): AppTheme {
  return theme === 'dark' ? 'dark' : 'light';
}

export function applyAppTheme(theme: string) {
  Object.assign(COLORS, THEME_COLORS[getAppTheme(theme)]);
}
