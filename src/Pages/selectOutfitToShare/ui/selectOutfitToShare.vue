<template>
  <Page
    actionBarHidden="true"
    :backgroundColor="COLORS.profileBackground"
    @loaded="backListener.start"
    @unloaded="backListener.stop"
  >
    <ActionBar visibility="collapse" />

    <GridLayout rows="auto, *, auto">
      <StackLayout row="0" class="header" @tap="closeActiveFilter">
        <Label
          text="Выберите образ для публикации"
          class="title"
          :color="COLORS.profileText"
        />

        <Button
          text="Опубликовать выбранный"
          class="publish-button"
          :isEnabled="Boolean(selectedOutfit) && !isPublishing && authStore.isServerUser"
          :backgroundColor="COLORS.profileButton"
          :color="COLORS.profileText"
          @tap="publishSelectedOutfit"
        />
        <Label
          v-if="publishMessage"
          :text="publishMessage"
          class="publish-status"
          :color="COLORS.mutedText"
        />

        <GridLayout columns="*, *, *" class="filters-labels">
          <Label text="Стиль:" col="0" class="filter-label" :color="COLORS.profileText" />
          <Label text="Сезон:" col="1" class="filter-label" :color="COLORS.profileText" />
          <Label text="Гамма:" col="2" class="filter-label" :color="COLORS.profileText" />
        </GridLayout>

        <GridLayout columns="*, *, *" class="filters-row">
          <Button
            col="0"
            :text="`${styleLabel} ▼`"
            class="filter-button"
            :backgroundColor="COLORS.profileButton"
            :color="COLORS.profileText"
            @tap="toggleFilter('style')"
          />
          <Button
            col="1"
            :text="`${seasonLabel} ▼`"
            class="filter-button"
            :backgroundColor="COLORS.profileButton"
            :color="COLORS.profileText"
            @tap="toggleFilter('season')"
          />
          <Button
            col="2"
            :text="`${colorLabel} ▼`"
            class="filter-button"
            :backgroundColor="COLORS.profileButton"
            :color="COLORS.profileText"
            @tap="toggleFilter('colorScheme')"
          />
        </GridLayout>

        <StackLayout
          v-if="activeFilter"
          class="filter-dropdown"
          :backgroundColor="COLORS.cardBackground"
        >
          <Button
            v-for="option in activeOptions"
            :key="option.value"
            :text="option.label"
            class="filter-option"
            :class="{ selected: option.value === activeValue }"
            :color="COLORS.profileText"
            @tap="selectFilterOption(option.value)"
          />
        </StackLayout>
      </StackLayout>

      <ScrollView row="1" @tap="closeActiveFilter">
        <WrapLayout class="outfits-grid">
          <GridLayout
            v-for="item in filteredOutfits"
            :key="item.id"
            rows="*"
            columns="*"
            class="outfit-card"
            :class="{ selected: selectedOutfitId === item.id }"
            :backgroundColor="COLORS.cardBackground"
            :borderColor="COLORS.profileText"
            @tap="handleOutfitTap(item.id)"
          >
            <OutfitPreview :items="wardrobeStore.getOutfitItems(item)" variant="tiny" />
          </GridLayout>
        </WrapLayout>
      </ScrollView>

      <GridLayout
        row="2"
        columns="*, *, *, *"
        class="bottom-nav"
        :backgroundColor="COLORS.profileBackground"
      >
        <GridLayout col="0" class="nav-item" @tap="openMyOutfits">
          <SVGView src="~/assets/home-alt.svg" stretch="aspectFit" class="nav-svg home-icon" />
        </GridLayout>

        <GridLayout col="1" class="nav-item" @tap="openMyClothes">
          <SVGView src="~/assets/backpack.svg" stretch="aspectFit" class="nav-svg backpack-icon" />
        </GridLayout>

        <GridLayout col="2" class="nav-item" @tap="openFeed">
          <SVGView src="~/assets/thumb-up.svg" stretch="aspectFit" class="nav-svg thumbs-icon" />
        </GridLayout>

        <GridLayout
          col="3"
          class="nav-item active"
          :backgroundColor="COLORS.navActiveBackground"
          @tap="openProfile"
        >
          <SVGView src="~/assets/user.svg" stretch="aspectFit" class="nav-svg profile-icon" />
        </GridLayout>
      </GridLayout>

      <OutfitInfoModal
        row="0"
        rowSpan="3"
        :visible="Boolean(infoOutfit)"
        :outfit="infoOutfit"
        :outfit-items="infoOutfitItems"
        @close="closeOutfitDetails"
      />
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $navigateTo } from 'nativescript-vue';
import { storeToRefs } from 'pinia';
import {
  COLOR_SCHEME_LABELS,
  COLOR_SCHEME_VALUES,
  OUTFIT_STYLE_LABELS,
  OUTFIT_STYLE_VALUES,
  SEASON_LABELS,
  SEASON_VALUES,
  matchesOutfitFilters,
  type OutfitFilterState,
} from '../../../Shared/model/Wardrobe';
import { publishOutfit } from '../../../Shared/model/api/SocialApi';
import { useAuthStore } from '../../../Shared/model/AuthStore';
import {
  createAndroidBackListener,
  type AndroidBackHandler,
} from '../../../Shared/model/AndroidBack';
import { useWardrobeStore } from '../../../Shared/model/WardrobeStore';
import { COLORS } from '../../../Shared/ui/Colors';
import OutfitInfoModal from '../../../Shared/ui/OutfitInfoModal.vue';
import OutfitPreview from '../../../Shared/ui/OutfitPreview.vue';
import Feed from '../../Feed/ui/Feed.vue';
import MyClothes from '../../MyClothes/ui/MyClothes.vue';
import MyOutfits from '../../MyOutfits/ui/MyOutfits.vue';
import Profile from '../../profile/ui/Profile.vue';

type FilterKey = 'style' | 'season' | 'colorScheme';

const wardrobeStore = useWardrobeStore();
const authStore = useAuthStore();
const { outfits } = storeToRefs(wardrobeStore);

const styleOptions = ['all', ...OUTFIT_STYLE_VALUES] as const;
const seasonOptions = ['all', ...SEASON_VALUES] as const;
const colorOptions = ['all', ...COLOR_SCHEME_VALUES] as const;

const selectedOutfitId = ref('');
const infoOutfitId = ref<string | null>(null);
const activeFilter = ref<FilterKey | null>(null);
const isPublishing = ref(false);
const publishStatus = ref('');
const publishMessage = computed(() =>
  authStore.isServerUser
    ? publishStatus.value
    : 'Войдите в аккаунт, чтобы публиковать образы.'
);
const handleAndroidBack: AndroidBackHandler = (args) => {
  if (!infoOutfitId.value) {
    return;
  }

  args.cancel = true;
  closeOutfitDetails();
};
const backListener = createAndroidBackListener(handleAndroidBack);
const filters = ref<OutfitFilterState>({
  style: 'all',
  season: 'all',
  colorScheme: 'all',
});

const filteredOutfits = computed(() =>
  outfits.value.filter((outfit) => matchesOutfitFilters(outfit, filters.value))
);
const selectedOutfit = computed(() =>
  outfits.value.find((outfit) => outfit.id === selectedOutfitId.value)
);

const styleLabel = computed(() => OUTFIT_STYLE_LABELS[filters.value.style] ?? 'Любой');
const seasonLabel = computed(() => SEASON_LABELS[filters.value.season] ?? 'Любой');
const colorLabel = computed(() => COLOR_SCHEME_LABELS[filters.value.colorScheme] ?? 'Любая');

const activeValue = computed(() => {
  if (!activeFilter.value) {
    return '';
  }

  return filters.value[activeFilter.value];
});

const activeOptions = computed(() => {
  if (activeFilter.value === 'style') {
    return styleOptions.map((value) => ({ value, label: OUTFIT_STYLE_LABELS[value] }));
  }

  if (activeFilter.value === 'season') {
    return seasonOptions.map((value) => ({ value, label: SEASON_LABELS[value] }));
  }

  if (activeFilter.value === 'colorScheme') {
    return colorOptions.map((value) => ({ value, label: COLOR_SCHEME_LABELS[value] }));
  }

  return [];
});

const infoOutfit = computed(() => {
  if (!infoOutfitId.value) {
    return null;
  }

  return outfits.value.find((item) => item.id === infoOutfitId.value) ?? null;
});

const infoOutfitItems = computed(() => {
  if (!infoOutfit.value) {
    return [];
  }

  return wardrobeStore.getOutfitItems(infoOutfit.value);
});

watch(
  outfits,
  (nextOutfits) => {
    if (!selectedOutfitId.value && nextOutfits.length > 0) {
      selectedOutfitId.value = nextOutfits[1]?.id ?? nextOutfits[0]?.id ?? '';
    }
  },
  { immediate: true }
);

function toggleFilter(filter: FilterKey) {
  activeFilter.value = activeFilter.value === filter ? null : filter;
}

function closeActiveFilter() {
  activeFilter.value = null;
}

function selectFilterOption(value: string) {
  if (!activeFilter.value) {
    return;
  }

  filters.value = {
    ...filters.value,
    [activeFilter.value]: value,
  };
  activeFilter.value = null;
}

function handleOutfitTap(id: string) {
  if (selectedOutfitId.value === id) {
    infoOutfitId.value = id;
    return;
  }

  selectedOutfitId.value = id;
}

function closeOutfitDetails() {
  infoOutfitId.value = null;
}

function getErrorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function publishSelectedOutfit() {
  if (!selectedOutfit.value || isPublishing.value) {
    return;
  }

  isPublishing.value = true;
  publishStatus.value = '';

  try {
    await publishOutfit(
      authStore.accessToken,
      selectedOutfit.value,
      wardrobeStore.getOutfitItems(selectedOutfit.value)
    );
    publishStatus.value = 'Образ появился в ленте.';
  } catch (error) {
    publishStatus.value = getErrorText(error);
  } finally {
    isPublishing.value = false;
  }
}

function openMyOutfits() {
  $navigateTo(MyOutfits);
}

function openMyClothes() {
  $navigateTo(MyClothes);
}

function openProfile() {
  $navigateTo(Profile);
}

function openFeed() {
  $navigateTo(Feed);
}
</script>

<style scoped>
.header {
  padding: 12 16 0 16;
}

.title {
  font-size: 20;
  text-align: center;
  margin-top: 44;
  margin-bottom: 18;
}

.publish-button {
  height: 42;
  border-radius: 21;
  font-size: 15;
  margin-bottom: 10;
  padding: 0;
  text-transform: none;
}

.publish-status {
  margin-bottom: 18;
  font-size: 13;
  text-align: center;
}

.filters-labels {
  margin-bottom: 10;
}

.filter-label {
  font-size: 13;
  font-weight: 600;
}

.filters-row {
  column-gap: 10;
}

.filter-dropdown {
  margin-top: 10;
  border-radius: 16;
  padding: 6 0;
}

.filter-button {
  height: 40;
  border-radius: 20;
  font-size: 14;
  padding: 0;
  text-transform: none;
}

.filter-option {
  background-color: transparent;
  text-transform: none;
  text-align: left;
  font-size: 14;
  height: 36;
  padding-left: 14;
  padding-right: 14;
}

.filter-option.selected {
  font-weight: 700;
}

.outfits-grid {
  padding: 12 10 10 12;
}

.outfit-card {
  width: 136;
  height: 136;
  margin: 6;
  border-width: 1;
  border-radius: 14;
}

.outfit-card.selected {
  border-width: 3;
}

.bottom-nav {
  padding: 8 14 14 14;
}

.nav-item {
  width: 64;
  height: 64;
  horizontal-align: center;
  vertical-align: middle;
}

.nav-item.active {
  width: 56;
  height: 56;
  border-radius: 28;
}

.nav-svg {
  horizontal-align: center;
  vertical-align: middle;
}

.home-icon {
  width: 42;
  height: 40;
}

.backpack-icon {
  width: 34;
  height: 40;
}

.thumbs-icon {
  width: 36;
  height: 36;
}

.profile-icon {
  width: 38;
  height: 38;
}
</style>
