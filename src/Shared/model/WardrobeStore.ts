import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Clothing, Outfit, UserSettings } from './Wardrobe';
import { CLOTHES, OUTFITS, STANDARD_CLOTHES } from './WardrobeData';
import { syncWardrobeSnapshot } from './api/WardrobeSyncApi';
import { initializeWardrobeDatabase } from './db/WardrobeDatabase';
import {
  addClothingToMyWardrobe as addClothingToMyWardrobeInRepository,
  applySyncedWardrobeSnapshot,
  createOutfit as createOutfitInRepository,
  deleteClothing as deleteClothingInRepository,
  deleteOutfit as deleteOutfitInRepository,
  exportWardrobeSnapshot,
  getMyClothes,
  getOutfits,
  getStandardClothes,
  getUserSettings,
  updateClothing as updateClothingInRepository,
  updateOutfit as updateOutfitInRepository,
  updateUserSettings as updateUserSettingsInRepository,
} from './repositories/WardrobeRepository';

const DEFAULT_USER_SETTINGS: UserSettings = {
  id: 'default',
  language: 'ru',
  theme: 'light',
  notificationsEnabled: true,
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export const useWardrobeStore = defineStore('wardrobe', () => {
  const myClothes = ref<Clothing[]>([...CLOTHES]);
  const standardClothes = ref<Clothing[]>([...STANDARD_CLOTHES]);
  const outfits = ref<Outfit[]>([...OUTFITS]);
  const settings = ref<UserSettings>({ ...DEFAULT_USER_SETTINGS });
  const isHydrated = ref(false);
  const isLoading = ref(false);
  const isSyncing = ref(false);
  const lastSyncedAt = ref<string | null>(null);
  const syncError = ref<string | null>(null);
  const error = ref<string | null>(null);

  let initializationPromise: Promise<void> | null = null;

  async function refreshClothes() {
    const [nextMyClothes, nextStandardClothes] = await Promise.all([
      getMyClothes(),
      getStandardClothes(),
    ]);

    myClothes.value = nextMyClothes;
    standardClothes.value = nextStandardClothes;
  }

  async function refreshOutfits() {
    outfits.value = await getOutfits();
  }

  async function refreshSettings() {
    settings.value = await getUserSettings();
  }

  async function initialize() {
    if (isHydrated.value) {
      return;
    }

    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      isLoading.value = true;
      error.value = null;

      try {
        await initializeWardrobeDatabase();
        await Promise.all([refreshClothes(), refreshOutfits(), refreshSettings()]);
        isHydrated.value = true;
      } catch (caughtError) {
        error.value = getErrorMessage(caughtError);
        throw caughtError;
      } finally {
        isLoading.value = false;
        initializationPromise = null;
      }
    })();

    return initializationPromise;
  }

  const allClothes = computed(() => {
    const uniqueById = new Map<string, Clothing>();

    for (const item of [...standardClothes.value, ...myClothes.value]) {
      uniqueById.set(item.id, item);
    }

    return [...uniqueById.values()];
  });

  function getClothingById(clothingId: string) {
    return allClothes.value.find((item) => item.id === clothingId);
  }

  function getOutfitItems(outfit: Outfit) {
    return outfit.items
      .map((itemId) => getClothingById(itemId))
      .filter((item): item is Clothing => Boolean(item));
  }

  async function addClothingToMyWardrobe(clothingId: string) {
    await initialize();
    await addClothingToMyWardrobeInRepository(clothingId);
    await refreshClothes();
  }

  async function createOutfitFromSelection(itemIds: string[]) {
    await initialize();

    const selectedItems = itemIds
      .map((id) => getClothingById(id))
      .filter((item): item is Clothing => Boolean(item));

    if (!selectedItems.length) {
      return;
    }

    const firstItem = selectedItems[0];
    const input = {
      id: `outfit-${Date.now()}`,
      name: `Образ ${outfits.value.length + 1}`,
      imageUrl: firstItem.imageUrl ?? '~/assets/baseClothes/white_tshirt.jpg',
      items: selectedItems.map((item) => item.id),
      style: 'casual' as const,
      season: firstItem.season,
      colorScheme: firstItem.colorScheme,
    };

    await createOutfitInRepository(input);
    await refreshOutfits();
  }

  async function updateUserSettings(patch: Partial<UserSettings>) {
    await initialize();
    await updateUserSettingsInRepository(patch);
    await refreshSettings();
  }

  async function updateOutfit(
    outfitId: string,
    patch: {
      name: string;
      style: Outfit['style'];
      season: Outfit['season'];
      colorScheme: Outfit['colorScheme'];
    }
  ) {
    await initialize();
    await updateOutfitInRepository(outfitId, patch);
    await refreshOutfits();
  }

  async function deleteOutfit(outfitId: string) {
    await initialize();
    await deleteOutfitInRepository(outfitId);
    await refreshOutfits();
  }

  async function updateClothing(
    clothingId: string,
    patch: {
      name: string;
      category: Clothing['category'];
      season: Clothing['season'];
      colorScheme: Clothing['colorScheme'];
    }
  ) {
    await initialize();
    await updateClothingInRepository(clothingId, patch);
    await Promise.all([refreshClothes(), refreshOutfits()]);
  }

  async function deleteClothing(clothingId: string) {
    await initialize();

    const clothing = getClothingById(clothingId);
    const isUsedInOutfits = outfits.value.some((outfit) => outfit.items.includes(clothingId));

    if (clothing?.source === 'standard') {
      throw new Error('Нельзя удалить базовую вещь из каталога.');
    }

    if (isUsedInOutfits) {
      throw new Error('Нельзя удалить вещь, пока она входит в образ.');
    }

    await deleteClothingInRepository(clothingId);
    await Promise.all([refreshClothes(), refreshOutfits()]);
  }

  async function syncWithServer(accessToken?: string | null) {
    const token = accessToken?.trim();
    if (!token || isSyncing.value) {
      return;
    }

    await initialize();
    isSyncing.value = true;
    syncError.value = null;

    try {
      const localSnapshot = await exportWardrobeSnapshot();
      const remoteSnapshot = await syncWardrobeSnapshot(token, localSnapshot);
      await applySyncedWardrobeSnapshot(remoteSnapshot);
      await Promise.all([refreshClothes(), refreshOutfits(), refreshSettings()]);
      lastSyncedAt.value = new Date().toISOString();
    } catch (caughtError) {
      syncError.value = getErrorMessage(caughtError);
    } finally {
      isSyncing.value = false;
    }
  }

  return {
    myClothes,
    standardClothes,
    allClothes,
    outfits,
    settings,
    isHydrated,
    isLoading,
    isSyncing,
    lastSyncedAt,
    syncError,
    error,
    hasData: computed(() => myClothes.value.length > 0 || outfits.value.length > 0),
    initialize,
    refreshClothes,
    refreshOutfits,
    refreshSettings,
    addClothingToMyWardrobe,
    createOutfitFromSelection,
    updateOutfit,
    deleteOutfit,
    updateClothing,
    deleteClothing,
    updateUserSettings,
    syncWithServer,
    getClothingById,
    getOutfitItems,
  };
});
