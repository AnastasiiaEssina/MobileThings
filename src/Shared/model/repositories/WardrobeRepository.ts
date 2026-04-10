import type { SqliteRow } from '@nativescript-community/sqlite/sqlite.common';
import type { Clothing, Outfit, UserSettings } from '../Wardrobe';
import { DEFAULT_SETTINGS_ID, getWardrobeDatabase } from '../db/WardrobeDatabase';

interface ClothingRow extends SqliteRow {
  id: string;
  name: string;
  category: string;
  season: string;
  color_scheme: string;
  image_url?: string | null;
  emoji?: string | null;
  fill_color?: string | null;
}

interface OutfitRow extends SqliteRow {
  id: string;
  name: string;
  style: string;
  season: string;
  color_scheme: string;
  image_url: string;
  views: number;
}

interface OutfitItemRow extends SqliteRow {
  outfit_id: string;
  clothing_id: string;
}

interface UserSettingsRow extends SqliteRow {
  id: string;
  language: string;
  theme: string;
  notifications_enabled: number;
}

function toClothing(row: ClothingRow): Clothing {
  return {
    id: String(row.id),
    name: String(row.name),
    category: row.category as Clothing['category'],
    season: row.season as Clothing['season'],
    colorScheme: row.color_scheme as Clothing['colorScheme'],
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    emoji: row.emoji ? String(row.emoji) : undefined,
    fillColor: row.fill_color ? String(row.fill_color) : undefined,
  };
}

function toOutfit(row: OutfitRow, items: string[]): Outfit {
  return {
    id: String(row.id),
    name: String(row.name),
    items,
    style: row.style as Outfit['style'],
    season: row.season as Outfit['season'],
    colorScheme: row.color_scheme as Outfit['colorScheme'],
    imageUrl: String(row.image_url),
    views: Number(row.views ?? 0),
  };
}

function toUserSettings(row?: UserSettingsRow): UserSettings {
  return {
    id: row?.id ? String(row.id) : DEFAULT_SETTINGS_ID,
    language: row?.language ? String(row.language) : 'ru',
    theme: row?.theme ? String(row.theme) : 'light',
    notificationsEnabled: Boolean(Number(row?.notifications_enabled ?? 1)),
  };
}

export async function getMyClothes() {
  const db = await getWardrobeDatabase();
  const rows = await db.select(
    `
      SELECT id, name, category, season, color_scheme, image_url, emoji, fill_color
      FROM clothes
      WHERE is_deleted = 0 AND is_in_wardrobe = 1
      ORDER BY sort_order ASC
    `
  );

  return rows.map((row: unknown) => toClothing(row as ClothingRow));
}

export async function getStandardClothes() {
  const db = await getWardrobeDatabase();
  const rows = await db.select(
    `
      SELECT id, name, category, season, color_scheme, image_url, emoji, fill_color
      FROM clothes
      WHERE is_deleted = 0 AND source = 'standard'
      ORDER BY sort_order ASC
    `
  );

  return rows.map((row: unknown) => toClothing(row as ClothingRow));
}

export async function addClothingToMyWardrobe(clothingId: string) {
  const db = await getWardrobeDatabase();

  await db.execute(
    `
      UPDATE clothes
      SET is_in_wardrobe = 1,
          updated_at = ?,
          sync_status = CASE
            WHEN sync_status = 'synced' THEN 'pending'
            ELSE sync_status
          END
      WHERE id = ?
    `,
    [new Date().toISOString(), clothingId]
  );
}

export async function getOutfits() {
  const db = await getWardrobeDatabase();
  const outfitRows = await db.select(
    `
      SELECT id, name, style, season, color_scheme, image_url, views
      FROM outfits
      WHERE is_deleted = 0
      ORDER BY sort_order ASC
    `
  );
  const outfitItemRows = await db.select(
    `
      SELECT outfit_id, clothing_id
      FROM outfit_items
      ORDER BY outfit_id ASC, sort_order ASC
    `
  );

  const itemsByOutfitId = new Map<string, string[]>();

  for (const row of outfitItemRows as OutfitItemRow[]) {
    const outfitId = String(row.outfit_id);
    const items = itemsByOutfitId.get(outfitId) ?? [];
    items.push(String(row.clothing_id));
    itemsByOutfitId.set(outfitId, items);
  }

  return (outfitRows as OutfitRow[]).map((row) =>
    toOutfit(row, itemsByOutfitId.get(String(row.id)) ?? [])
  );
}

export async function createOutfit(input: {
  id: string;
  name: string;
  imageUrl: string;
  items: string[];
  style: Outfit['style'];
  season: Outfit['season'];
  colorScheme: Outfit['colorScheme'];
}) {
  const db = await getWardrobeDatabase();
  const createdAt = new Date().toISOString();
  const orderRow = await db.get('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM outfits');
  const nextOrder = Number(orderRow?.next_order ?? 0);

  await db.transaction(async () => {
    await db.execute(
      `
        INSERT INTO outfits (
          id,
          remote_id,
          name,
          style,
          season,
          color_scheme,
          image_url,
          views,
          is_deleted,
          sort_order,
          sync_status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending', ?, ?)
      `,
      [
        input.id,
        null,
        input.name,
        input.style,
        input.season,
        input.colorScheme,
        input.imageUrl,
        nextOrder,
        createdAt,
        createdAt,
      ]
    );

    for (const [index, clothingId] of input.items.entries()) {
      await db.execute(
        `
          INSERT INTO outfit_items (
            id,
            outfit_id,
            clothing_id,
            sort_order,
            sync_status,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, 'pending', ?, ?)
        `,
        [`${input.id}:${clothingId}:${index}`, input.id, clothingId, index, createdAt, createdAt]
      );
    }
  });
}

export async function getUserSettings() {
  const db = await getWardrobeDatabase();
  const row = await db.get(
    `
      SELECT id, language, theme, notifications_enabled
      FROM user_settings
      WHERE id = ?
    `,
    [DEFAULT_SETTINGS_ID]
  );

  return toUserSettings(row as UserSettingsRow | undefined);
}

export async function updateUserSettings(patch: Partial<UserSettings>) {
  const db = await getWardrobeDatabase();
  const current = await getUserSettings();
  const nextSettings = {
    ...current,
    ...patch,
  };

  await db.execute(
    `
      UPDATE user_settings
      SET language = ?,
          theme = ?,
          notifications_enabled = ?,
          sync_status = CASE
            WHEN sync_status = 'synced' THEN 'pending'
            ELSE sync_status
          END,
          updated_at = ?
      WHERE id = ?
    `,
    [
      nextSettings.language,
      nextSettings.theme,
      nextSettings.notificationsEnabled ? 1 : 0,
      new Date().toISOString(),
      DEFAULT_SETTINGS_ID,
    ]
  );
}
