import { API_BASE_URL } from './ApiConfig';

export type WardrobeSyncClothing = {
  id: string;
  name: string;
  category: string;
  season: string;
  color_scheme: string;
  image_url?: string | null;
  emoji?: string | null;
  fill_color?: string | null;
  source: string;
  is_in_wardrobe: boolean;
  is_deleted: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type WardrobeSyncOutfit = {
  id: string;
  name: string;
  style: string;
  season: string;
  color_scheme: string;
  image_url: string;
  views: number;
  items: string[];
  is_deleted: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type WardrobeSyncSettings = {
  language: string;
  theme: string;
  notifications_enabled: boolean;
  updated_at: string;
};

export type WardrobeSyncSnapshot = {
  clothes: WardrobeSyncClothing[];
  outfits: WardrobeSyncOutfit[];
  settings: WardrobeSyncSettings;
};

export async function syncWardrobeSnapshot(
  accessToken: string,
  snapshot: WardrobeSyncSnapshot
): Promise<WardrobeSyncSnapshot> {
  const response = await fetch(`${API_BASE_URL}/wardrobe/sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(snapshot),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Wardrobe sync failed.');
  }

  return data as WardrobeSyncSnapshot;
}
