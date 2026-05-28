import type { SqliteRow } from '@nativescript-community/sqlite/sqlite.common';
import type { WardrobeSyncSnapshot } from '../api/WardrobeSyncApi';
import type {
  Clothing,
  ClothingCategory,
  ClothingUpdateInput,
  Outfit,
  OutfitUpdateInput,
  Season,
  ColorScheme,
  UserSettings,
} from '../Wardrobe';
import { DEFAULT_SETTINGS_ID, getWardrobeDatabase } from '../db/WardrobeDatabase';

interface ClothingRow extends SqliteRow {
  id: string;
  name: string;
  category: string;
  season: string;
  color_scheme: string;
  source: 'user' | 'standard';
  image_url?: string | null;
  emoji?: string | null;
  fill_color?: string | null;
  is_in_wardrobe?: number;
  is_deleted?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

interface OutfitRow extends SqliteRow {
  id: string;
  name: string;
  style: string;
  season: string;
  color_scheme: string;
  image_url: string;
  views: number;
  is_deleted?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
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
  updated_at?: string;
}

function boolFromNumber(value: unknown) {
  return Boolean(Number(value ?? 0));
}

function shouldApplyServerRow(localUpdatedAt: unknown, serverUpdatedAt: string) {
  const current = String(localUpdatedAt ?? '');
  return !current || serverUpdatedAt >= current;
}

function toClothing(row: ClothingRow): Clothing {
  return {
    id: String(row.id),
    name: String(row.name),
    category: row.category as Clothing['category'],
    season: row.season as Clothing['season'],
    colorScheme: row.color_scheme as Clothing['colorScheme'],
    source: row.source,
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
      SELECT id, name, category, season, color_scheme, source, image_url, emoji, fill_color
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
      SELECT id, name, category, season, color_scheme, source, image_url, emoji, fill_color
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

export async function createCustomClothing(input: {
  id: string;
  name: string;
  category: ClothingCategory;
  season: Season;
  colorScheme: ColorScheme;
  imageUrl: string;
}) {
  const db = await getWardrobeDatabase();
  const createdAt = new Date().toISOString();
  const orderRow = await db.get('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM clothes');
  const nextOrder = Number(orderRow?.next_order ?? 0);

  await db.execute(
    `
      INSERT INTO clothes (
        id,
        remote_id,
        name,
        category,
        season,
        color_scheme,
        image_url,
        emoji,
        fill_color,
        source,
        is_in_wardrobe,
        is_deleted,
        sort_order,
        sync_status,
        created_at,
        updated_at
      )
      VALUES (?, NULL, ?, ?, ?, ?, ?, NULL, NULL, 'user', 1, 0, ?, 'pending', ?, ?)
    `,
    [
      input.id,
      input.name,
      input.category,
      input.season,
      input.colorScheme,
      input.imageUrl,
      nextOrder,
      createdAt,
      createdAt,
    ]
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

export async function updateOutfit(outfitId: string, patch: OutfitUpdateInput) {
  const db = await getWardrobeDatabase();

  await db.execute(
    `
      UPDATE outfits
      SET name = ?,
          style = ?,
          season = ?,
          color_scheme = ?,
          updated_at = ?,
          sync_status = CASE
            WHEN sync_status = 'synced' THEN 'pending'
            ELSE sync_status
          END
      WHERE id = ?
    `,
    [
      patch.name,
      patch.style,
      patch.season,
      patch.colorScheme,
      new Date().toISOString(),
      outfitId,
    ]
  );
}

export async function deleteOutfit(outfitId: string) {
  const db = await getWardrobeDatabase();
  const now = new Date().toISOString();

  await db.transaction(async () => {
    await db.execute(
      `
        UPDATE outfits
        SET is_deleted = 1,
            updated_at = ?,
            sync_status = CASE
              WHEN sync_status = 'synced' THEN 'pending'
              ELSE sync_status
            END
        WHERE id = ?
      `,
      [now, outfitId]
    );

    await db.execute(
      `
        UPDATE outfit_items
        SET updated_at = ?,
            sync_status = CASE
              WHEN sync_status = 'synced' THEN 'pending'
              ELSE sync_status
            END
        WHERE outfit_id = ?
      `,
      [now, outfitId]
    );
  });
}

export async function updateClothing(clothingId: string, patch: ClothingUpdateInput) {
  const db = await getWardrobeDatabase();

  await db.execute(
    `
      UPDATE clothes
      SET name = ?,
          category = ?,
          season = ?,
          color_scheme = ?,
          updated_at = ?,
          sync_status = CASE
            WHEN sync_status = 'synced' THEN 'pending'
            ELSE sync_status
          END
      WHERE id = ?
    `,
    [
      patch.name,
      patch.category,
      patch.season,
      patch.colorScheme,
      new Date().toISOString(),
      clothingId,
    ]
  );
}

export async function deleteClothing(clothingId: string) {
  const db = await getWardrobeDatabase();
  const now = new Date().toISOString();
  const clothingRow = await db.get(
    `
      SELECT source
      FROM clothes
      WHERE id = ?
    `,
    [clothingId]
  );

  if (String(clothingRow?.source ?? '') === 'standard') {
    throw new Error('Нельзя удалить базовую вещь из каталога.');
  }

  const usageRow = await db.get(
    `
      SELECT COUNT(*) AS count
      FROM outfit_items
      INNER JOIN outfits ON outfits.id = outfit_items.outfit_id
      WHERE outfit_items.clothing_id = ?
        AND outfits.is_deleted = 0
    `,
    [clothingId]
  );

  if (Number(usageRow?.count ?? 0) > 0) {
    throw new Error('Нельзя удалить вещь, пока она входит в образ.');
  }

  await db.execute(
    `
      UPDATE clothes
      SET is_deleted = 1,
          is_in_wardrobe = 0,
          updated_at = ?,
          sync_status = CASE
            WHEN sync_status = 'synced' THEN 'pending'
            ELSE sync_status
          END
      WHERE id = ?
    `,
    [now, clothingId]
  );
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

export async function exportWardrobeSnapshot(): Promise<WardrobeSyncSnapshot> {
  const db = await getWardrobeDatabase();
  const clothesRows = await db.select(
    `
      SELECT
        id,
        name,
        category,
        season,
        color_scheme,
        source,
        image_url,
        emoji,
        fill_color,
        is_in_wardrobe,
        is_deleted,
        sort_order,
        created_at,
        updated_at
      FROM clothes
      ORDER BY sort_order ASC, id ASC
    `
  );
  const outfitRows = await db.select(
    `
      SELECT
        id,
        name,
        style,
        season,
        color_scheme,
        image_url,
        views,
        is_deleted,
        sort_order,
        created_at,
        updated_at
      FROM outfits
      ORDER BY sort_order ASC, id ASC
    `
  );
  const outfitItemRows = await db.select(
    `
      SELECT outfit_id, clothing_id
      FROM outfit_items
      ORDER BY outfit_id ASC, sort_order ASC
    `
  );
  const settingsRow = await db.get(
    `
      SELECT language, theme, notifications_enabled, updated_at
      FROM user_settings
      WHERE id = ?
    `,
    [DEFAULT_SETTINGS_ID]
  );
  const itemsByOutfitId = new Map<string, string[]>();

  for (const row of outfitItemRows as OutfitItemRow[]) {
    const outfitId = String(row.outfit_id);
    const items = itemsByOutfitId.get(outfitId) ?? [];
    items.push(String(row.clothing_id));
    itemsByOutfitId.set(outfitId, items);
  }

  return {
    clothes: (clothesRows as ClothingRow[]).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      category: String(row.category),
      season: String(row.season),
      color_scheme: String(row.color_scheme),
      image_url: row.image_url ? String(row.image_url) : null,
      emoji: row.emoji ? String(row.emoji) : null,
      fill_color: row.fill_color ? String(row.fill_color) : null,
      source: String(row.source),
      is_in_wardrobe: boolFromNumber(row.is_in_wardrobe),
      is_deleted: boolFromNumber(row.is_deleted),
      sort_order: Number(row.sort_order ?? 0),
      created_at: String(row.created_at ?? new Date().toISOString()),
      updated_at: String(row.updated_at ?? new Date().toISOString()),
    })),
    outfits: (outfitRows as OutfitRow[]).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      style: String(row.style),
      season: String(row.season),
      color_scheme: String(row.color_scheme),
      image_url: String(row.image_url),
      views: Number(row.views ?? 0),
      items: itemsByOutfitId.get(String(row.id)) ?? [],
      is_deleted: boolFromNumber(row.is_deleted),
      sort_order: Number(row.sort_order ?? 0),
      created_at: String(row.created_at ?? new Date().toISOString()),
      updated_at: String(row.updated_at ?? new Date().toISOString()),
    })),
    settings: {
      language: String(settingsRow?.language ?? 'ru'),
      theme: String(settingsRow?.theme ?? 'light'),
      notifications_enabled: Boolean(Number(settingsRow?.notifications_enabled ?? 1)),
      updated_at: String(settingsRow?.updated_at ?? new Date().toISOString()),
    },
  };
}

export async function applySyncedWardrobeSnapshot(snapshot: WardrobeSyncSnapshot) {
  const db = await getWardrobeDatabase();

  await db.transaction(async () => {
    for (const [index, item] of snapshot.clothes.entries()) {
      const localRow = await db.get(
        `
          SELECT updated_at
          FROM clothes
          WHERE id = ?
        `,
        [item.id]
      );
      if (!shouldApplyServerRow(localRow?.updated_at, item.updated_at)) {
        continue;
      }

      await db.execute(
        `
          INSERT INTO clothes (
            id,
            remote_id,
            name,
            category,
            season,
            color_scheme,
            image_url,
            emoji,
            fill_color,
            source,
            is_in_wardrobe,
            is_deleted,
            sort_order,
            sync_status,
            created_at,
            updated_at
          )
          VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            category = excluded.category,
            season = excluded.season,
            color_scheme = excluded.color_scheme,
            image_url = excluded.image_url,
            emoji = excluded.emoji,
            fill_color = excluded.fill_color,
            source = excluded.source,
            is_in_wardrobe = excluded.is_in_wardrobe,
            is_deleted = excluded.is_deleted,
            sort_order = excluded.sort_order,
            sync_status = 'synced',
            updated_at = excluded.updated_at
        `,
        [
          item.id,
          item.name,
          item.category,
          item.season,
          item.color_scheme,
          item.image_url ?? null,
          item.emoji ?? null,
          item.fill_color ?? null,
          item.source,
          item.is_in_wardrobe ? 1 : 0,
          item.is_deleted ? 1 : 0,
          Number(item.sort_order ?? index),
          item.created_at,
          item.updated_at,
        ]
      );
    }

    for (const [index, outfit] of snapshot.outfits.entries()) {
      const localRow = await db.get(
        `
          SELECT updated_at
          FROM outfits
          WHERE id = ?
        `,
        [outfit.id]
      );
      if (!shouldApplyServerRow(localRow?.updated_at, outfit.updated_at)) {
        continue;
      }

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
          VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            style = excluded.style,
            season = excluded.season,
            color_scheme = excluded.color_scheme,
            image_url = excluded.image_url,
            views = excluded.views,
            is_deleted = excluded.is_deleted,
            sort_order = excluded.sort_order,
            sync_status = 'synced',
            updated_at = excluded.updated_at
        `,
        [
          outfit.id,
          outfit.name,
          outfit.style,
          outfit.season,
          outfit.color_scheme,
          outfit.image_url,
          Number(outfit.views ?? 0),
          outfit.is_deleted ? 1 : 0,
          Number(outfit.sort_order ?? index),
          outfit.created_at,
          outfit.updated_at,
        ]
      );

      await db.execute('DELETE FROM outfit_items WHERE outfit_id = ?', [outfit.id]);

      for (const [itemIndex, clothingId] of outfit.items.entries()) {
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
            VALUES (?, ?, ?, ?, 'synced', ?, ?)
          `,
          [
            `${outfit.id}:${clothingId}:${itemIndex}`,
            outfit.id,
            clothingId,
            itemIndex,
            outfit.updated_at,
            outfit.updated_at,
          ]
        );
      }
    }

    const settingsRow = await db.get(
      `
        SELECT updated_at
        FROM user_settings
        WHERE id = ?
      `,
      [DEFAULT_SETTINGS_ID]
    );
    if (shouldApplyServerRow(settingsRow?.updated_at, snapshot.settings.updated_at)) {
      await db.execute(
        `
          INSERT INTO user_settings (
            id,
            language,
            theme,
            notifications_enabled,
            sync_status,
            updated_at
          )
          VALUES (?, ?, ?, ?, 'synced', ?)
          ON CONFLICT(id) DO UPDATE SET
            language = excluded.language,
            theme = excluded.theme,
            notifications_enabled = excluded.notifications_enabled,
            sync_status = 'synced',
            updated_at = excluded.updated_at
        `,
        [
          DEFAULT_SETTINGS_ID,
          snapshot.settings.language,
          snapshot.settings.theme,
          snapshot.settings.notifications_enabled ? 1 : 0,
          snapshot.settings.updated_at,
        ]
      );
    }
  });
}
