import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Clothing, Outfit, UserSettings } from './Wardrobe';
import { CLOTHES, OUTFITS, STANDARD_CLOTHES } from './WardrobeData';
import { initializeWardrobeDatabase } from './db/WardrobeDatabase';
import {
  addClothingToMyWardrobe as addClothingToMyWardrobeInRepository,
  createOutfit as createOutfitInRepository,
  getMyClothes,
  getOutfits,
  getStandardClothes,
  getUserSettings,
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

  async function addClothingToMyWardrobe(clothingId: string) {
    await initialize();
    await addClothingToMyWardrobeInRepository(clothingId);
    await refreshClothes();
  }

  async function createOutfitFromSelection(itemIds: string[]) {
    await initialize();

    const allKnownClothes = [...myClothes.value, ...standardClothes.value];
    const selectedItems = itemIds
      .map((id) => allKnownClothes.find((item) => item.id === id))
      .filter((item): item is Clothing => Boolean(item));

    if (!selectedItems.length) {
      return;
    }

    const firstItem = selectedItems[0];
    const input = {
      id: `outfit-${Date.now()}`,
      name: `Образ ${outfits.value.length + 1}`,
      imageUrl: firstItem.imageUrl ?? '~/assets/outfit_1.png',
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

  return {
    myClothes,
    standardClothes,
    outfits,
    settings,
    isHydrated,
    isLoading,
    error,
    hasData: computed(() => myClothes.value.length > 0 || outfits.value.length > 0),
    initialize,
    refreshClothes,
    refreshOutfits,
    refreshSettings,
    addClothingToMyWardrobe,
    createOutfitFromSelection,
    updateUserSettings,
  };
});
