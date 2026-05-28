import { ApplicationSettings } from '@nativescript/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { applyThemePalette, type ThemeName } from '../ui/Colors';

const THEME_KEY = 'things.theme';

function normalizeTheme(value?: string | null): ThemeName {
  return value === 'dark' ? 'dark' : 'light';
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeName>('light');

  function applyTheme(nextTheme: ThemeName) {
    theme.value = nextTheme;
    applyThemePalette(nextTheme);
    ApplicationSettings.setString(THEME_KEY, nextTheme);
  }

  function initialize() {
    applyTheme(normalizeTheme(ApplicationSettings.getString(THEME_KEY)));
  }

  return {
    theme,
    initialize,
    applyTheme,
  };
});
