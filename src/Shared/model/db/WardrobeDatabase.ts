import { knownFolders, path } from '@nativescript/core';
import { openOrCreate, type SQLiteDatabase } from '@nativescript-community/sqlite';
import { CLOTHES, OUTFITS, STANDARD_CLOTHES } from '../WardrobeData';
import type { Clothing, Outfit } from '../Wardrobe';

const DATABASE_FILE_NAME = 'mobile-things.sqlite';
const DEFAULT_SETTINGS_ID = 'default';

let databaseInstance: SQLiteDatabase | null = null;
let initializationPromise: Promise<SQLiteDatabase> | null = null;

function getNowIso() {
  return new Date().toISOString();
}

async function ensureSchema(db: SQLiteDatabase) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS clothes (
      id TEXT PRIMARY KEY,
      remote_id TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      season TEXT NOT NULL,
      color_scheme TEXT NOT NULL,
      image_url TEXT,
      emoji TEXT,
      fill_color TEXT,
      source TEXT NOT NULL,
      is_in_wardrobe INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS outfits (
      id TEXT PRIMARY KEY,
      remote_id TEXT,
      name TEXT NOT NULL,
      style TEXT NOT NULL,
      season TEXT NOT NULL,
      color_scheme TEXT NOT NULL,
      image_url TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS outfit_items (
      id TEXT PRIMARY KEY,
      outfit_id TEXT NOT NULL,
      clothing_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      language TEXT NOT NULL,
      theme TEXT NOT NULL,
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute('CREATE INDEX IF NOT EXISTS idx_clothes_in_wardrobe ON clothes(is_in_wardrobe)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_clothes_category ON clothes(category)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_outfits_sort_order ON outfits(sort_order)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit ON outfit_items(outfit_id, sort_order)');
}

async function upsertClothing(db: SQLiteDatabase, item: Clothing, sortOrder: number, source: 'user' | 'standard', isInWardrobe: number) {
  const nowIso = getNowIso();
  const existingRow = await db.get(
    `
      SELECT created_at
      FROM clothes
      WHERE id = ?
    `,
    [item.id]
  );

  if (existingRow) {
    await db.execute(
      `
        UPDATE clothes
        SET name = ?,
            category = ?,
            season = ?,
            color_scheme = ?,
            image_url = ?,
            emoji = ?,
            fill_color = ?,
            source = ?,
            is_in_wardrobe = ?,
            is_deleted = 0,
            sort_order = ?,
            updated_at = ?
        WHERE id = ?
      `,
      [
        item.name,
        item.category,
        item.season,
        item.colorScheme,
        item.imageUrl ?? null,
        item.emoji ?? null,
        item.fillColor ?? null,
        source,
        isInWardrobe,
        sortOrder,
        nowIso,
        item.id,
      ]
    );
    return;
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'synced', ?, ?)
    `,
    [
      item.id,
      null,
      item.name,
      item.category,
      item.season,
      item.colorScheme,
      item.imageUrl ?? null,
      item.emoji ?? null,
      item.fillColor ?? null,
      source,
      isInWardrobe,
      sortOrder,
      nowIso,
      nowIso,
    ]
  );
}

async function syncClothingSeedItems(
  db: SQLiteDatabase,
  items: Clothing[],
  source: 'user' | 'standard',
  isInWardrobe: number
) {
  for (const [index, item] of items.entries()) {
    await upsertClothing(db, item, index, source, isInWardrobe);
  }
}

async function upsertOutfit(db: SQLiteDatabase, outfit: Outfit, sortOrder: number) {
  const nowIso = getNowIso();
  const existingRow = await db.get(
    `
      SELECT created_at
      FROM outfits
      WHERE id = ?
    `,
    [outfit.id]
  );

  if (existingRow) {
    await db.execute(
      `
        UPDATE outfits
        SET name = ?,
            style = ?,
            season = ?,
            color_scheme = ?,
            image_url = ?,
            views = ?,
            is_deleted = 0,
            sort_order = ?,
            updated_at = ?
        WHERE id = ?
      `,
      [
        outfit.name,
        outfit.style,
        outfit.season,
        outfit.colorScheme,
        outfit.imageUrl,
        outfit.views,
        sortOrder,
        nowIso,
        outfit.id,
      ]
    );
  } else {
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'synced', ?, ?)
      `,
      [
        outfit.id,
        null,
        outfit.name,
        outfit.style,
        outfit.season,
        outfit.colorScheme,
        outfit.imageUrl,
        outfit.views,
        sortOrder,
        nowIso,
        nowIso,
      ]
    );
  }

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
      [`${outfit.id}:${clothingId}:${itemIndex}`, outfit.id, clothingId, itemIndex, nowIso, nowIso]
    );
  }
}

async function syncDefaultOutfits(db: SQLiteDatabase) {
  for (const [index, outfit] of OUTFITS.entries()) {
    await upsertOutfit(db, outfit, index);
  }
}

async function ensureDefaultSettings(db: SQLiteDatabase) {
  const existingRow = await db.get(
    `
      SELECT id
      FROM user_settings
      WHERE id = ?
    `,
    [DEFAULT_SETTINGS_ID]
  );

  if (existingRow) {
    return;
  }

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
      VALUES (?, 'ru', 'light', 1, 'synced', ?)
    `,
    [DEFAULT_SETTINGS_ID, getNowIso()]
  );
}

async function syncSeedData(db: SQLiteDatabase) {
  await db.transaction(async () => {
    await syncClothingSeedItems(db, CLOTHES, 'user', 1);
    await syncClothingSeedItems(db, STANDARD_CLOTHES, 'standard', 0);
    await syncDefaultOutfits(db);
    await ensureDefaultSettings(db);
  });
}

export function getWardrobeDatabasePath() {
  return path.join(knownFolders.documents().path, DATABASE_FILE_NAME);
}

export async function initializeWardrobeDatabase() {
  if (databaseInstance) {
    return databaseInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const db = openOrCreate(getWardrobeDatabasePath());
    await ensureSchema(db);
    await syncSeedData(db);
    databaseInstance = db;
    initializationPromise = null;
    return db;
  })().catch((error) => {
    initializationPromise = null;
    throw error;
  });

  return initializationPromise;
}

export function getWardrobeDatabase() {
  return initializeWardrobeDatabase();
}

export { DEFAULT_SETTINGS_ID };
