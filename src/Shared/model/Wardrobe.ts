export const OUTFIT_STYLE_VALUES = ['casual', 'business', 'sport', 'evening'] as const;
export const SEASON_VALUES = ['spring', 'summer', 'autumn', 'winter'] as const;
export const COLOR_SCHEME_VALUES = ['light', 'dark', 'neutral', 'bright'] as const;
export const CLOTHING_CATEGORY_VALUES = ['tops', 'pants', 'shoes', 'accessories'] as const;

export type OutfitStyle = (typeof OUTFIT_STYLE_VALUES)[number];
export type Season = (typeof SEASON_VALUES)[number];
export type ColorScheme = (typeof COLOR_SCHEME_VALUES)[number];
export type ClothingCategory = (typeof CLOTHING_CATEGORY_VALUES)[number];

export interface Clothing {
  id: string;
  name: string;
  category: ClothingCategory;
  season: Season;
  colorScheme: ColorScheme;
  imageUrl?: string;
  emoji?: string;
  fillColor?: string;
}

export interface Outfit {
  id: string;
  name: string;
  items: Clothing['id'][];
  style: OutfitStyle;
  season: Season;
  colorScheme: ColorScheme;
  imageUrl: string;
  views: number;
}

export interface OutfitFilterState {
  style: OutfitStyle | 'all';
  season: Season | 'all';
  colorScheme: ColorScheme | 'all';
}

export interface UserSettings {
  id: string;
  language: string;
  theme: string;
  notificationsEnabled: boolean;
}

export function matchesOutfitFilters(outfit: Outfit, filters: OutfitFilterState) {
  const matchStyle = filters.style === 'all' || outfit.style === filters.style;
  const matchSeason = filters.season === 'all' || outfit.season === filters.season;
  const matchColor =
    filters.colorScheme === 'all' || outfit.colorScheme === filters.colorScheme;

  return matchStyle && matchSeason && matchColor;
}
