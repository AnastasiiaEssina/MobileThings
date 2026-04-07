// types.ts
export interface Outfit {
  id: string;
  name: string;
  items: string[];
  style: 'casual' | 'business' | 'sport' | 'evening';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  colorScheme: 'light' | 'dark' | 'neutral' | 'bright';
  imageUrl: string;
}

export interface FilterState {
  style: string | 'all';
  season: string | 'all';
  colorScheme: string | 'all';
}