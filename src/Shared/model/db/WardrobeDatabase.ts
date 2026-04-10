import { knownFolders, path } from '@nativescript/core';
import { openOrCreate, type SQLiteDatabase } from '@nativescript-community/sqlite';
import { CLOTHES, OUTFITS, STANDARD_CLOTHES } from '../WardrobeData';

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

async function getCount(db: SQLiteDatabase, tableName: string) {
  const row = await db.get(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(row?.count ?? 0);
}

async function seedClothes(db: SQLiteDatabase) {
  const count = await getCount(db, 'clothes');

  if (count > 0) {
    return;
  }

  const nowIso = getNowIso();
  const initialClothes = [
    ...CLOTHES.map((item, index) => ({
      ...item,
      source: 'user',
      isInWardrobe: 1,
      sortOrder: index,
    })),
    ...STANDARD_CLOTHES.map((item, index) => ({
      ...item,
      source: 'standard',
      isInWardrobe: 0,
      sortOrder: CLOTHES.length + index,
    })),
  ];

  await db.transaction(async () => {
    for (const item of initialClothes) {
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
          item.source,
          item.isInWardrobe,
          item.sortOrder,
          nowIso,
          nowIso,
        ]
      );
    }
  });
}

async function seedOutfits(db: SQLiteDatabase) {
  const count = await getCount(db, 'outfits');

  if (count > 0) {
    return;
  }

  const nowIso = getNowIso();

  await db.transaction(async () => {
    for (const [outfitIndex, outfit] of OUTFITS.entries()) {
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
          outfitIndex,
          nowIso,
          nowIso,
        ]
      );

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
            nowIso,
            nowIso,
          ]
        );
      }
    }
  });
}

async function seedSettings(db: SQLiteDatabase) {
  const count = await getCount(db, 'user_settings');

  if (count > 0) {
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

async function seedDatabase(db: SQLiteDatabase) {
  await seedClothes(db);
  await seedOutfits(db);
  await seedSettings(db);
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
    await seedDatabase(db);
    databaseInstance = db;
    initializationPromise = null;
    return db;
  })().catch((error) => {
    initializationPromise = null;
    throw error;
  });

  return initializationPromise;
}

export async function getWardrobeDatabase() {
  return initializeWardrobeDatabase();
}

export { DEFAULT_SETTINGS_ID };
