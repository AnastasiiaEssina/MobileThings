<template>
  <Page :backgroundColor="COLORS.profileBackground">
    <ActionBar visibility="collapse" />

    <GridLayout rows="auto, *, auto">
      <StackLayout row="0" class="header" @tap="closeActiveFilter">
        <Label
          text="Выберите образ для публикации"
          class="title"
          :color="COLORS.profileText"
        />

        <GridLayout columns="*, *, *" class="filters-labels">
          <Label
            text="Стиль:"
            col="0"
            class="filter-label"
            :color="COLORS.profileText"
          />
          <Label
            text="Сезон:"
            col="1"
            class="filter-label"
            :color="COLORS.profileText"
          />
          <Label
            text="Гамма:"
            col="2"
            class="filter-label"
            :color="COLORS.profileText"
          />
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
            @tap="selectOutfit(item.id)"
          >
            <Image
              :src="item.imageUrl"
              stretch="aspectFill"
              class="outfit-image"
            />
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
          <SVGView
            src="~/assets/home-alt.svg"
            stretch="aspectFit"
            class="nav-svg home-icon"
          />
        </GridLayout>

        <GridLayout col="1" class="nav-item" @tap="openMyClothes">
          <SVGView
            src="~/assets/backpack.svg"
            stretch="aspectFit"
            class="nav-svg backpack-icon"
          />
        </GridLayout>

        <GridLayout col="2" class="nav-item">
          <SVGView
            src="~/assets/thumb-up.svg"
            stretch="aspectFit"
            class="nav-svg thumbs-icon"
          />
        </GridLayout>

        <GridLayout
          col="3"
          class="nav-item active"
          :backgroundColor="COLORS.navActiveBackground"
          @tap="openProfile"
        >
          <SVGView
            src="~/assets/user.svg"
            stretch="aspectFit"
            class="nav-svg profile-icon"
          />
        </GridLayout>
      </GridLayout>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { $navigateTo } from 'nativescript-vue';
import {
  COLOR_SCHEME_VALUES,
  OUTFIT_STYLE_VALUES,
  SEASON_VALUES,
  matchesOutfitFilters,
  type OutfitFilterState,
} from '../../../Shared/model/Wardrobe';
import { OUTFITS } from '../../../Shared/model/WardrobeData';
import { COLORS } from '../../../Shared/ui/Colors';
import MyClothes from '../../MyClothes/ui/MyClothes.vue';
import MyOutfits from '../../MyOutfits/ui/MyOutfits.vue';
import Profile from '../../profile/ui/Profile.vue';

type FilterKey = 'style' | 'season' | 'colorScheme';

const styleOptions = ['all', ...OUTFIT_STYLE_VALUES] as const;
const seasonOptions = ['all', ...SEASON_VALUES] as const;
const colorOptions = ['all', ...COLOR_SCHEME_VALUES] as const;

const styleLabels: Record<(typeof styleOptions)[number], string> = {
  all: 'Любой',
  casual: 'Кэжуал',
  business: 'Деловой',
  sport: 'Спорт',
  evening: 'Вечер',
};

const seasonLabels: Record<(typeof seasonOptions)[number], string> = {
  all: 'Любой',
  spring: 'Весна',
  summer: 'Лето',
  autumn: 'Осень',
  winter: 'Зима',
};

const colorLabels: Record<(typeof colorOptions)[number], string> = {
  all: 'Любая',
  light: 'Светлая',
  dark: 'Тёмная',
  neutral: 'Нейтральная',
  bright: 'Яркая',
};

const selectedOutfitId = ref(OUTFITS[1]?.id ?? OUTFITS[0]?.id ?? '');
const activeFilter = ref<FilterKey | null>(null);
const filters = ref<OutfitFilterState>({
  style: 'all',
  season: 'all',
  colorScheme: 'all',
});

const filteredOutfits = computed(() =>
  OUTFITS.filter((outfit) => matchesOutfitFilters(outfit, filters.value))
);

const styleLabel = computed(() => styleLabels[filters.value.style] ?? 'Любой');
const seasonLabel = computed(() => seasonLabels[filters.value.season] ?? 'Любой');
const colorLabel = computed(() => colorLabels[filters.value.colorScheme] ?? 'Любая');

const activeValue = computed(() => {
  if (!activeFilter.value) {
    return '';
  }

  return filters.value[activeFilter.value];
});

const activeOptions = computed(() => {
  if (activeFilter.value === 'style') {
    return styleOptions.map((value) => ({ value, label: styleLabels[value] }));
  }

  if (activeFilter.value === 'season') {
    return seasonOptions.map((value) => ({ value, label: seasonLabels[value] }));
  }

  if (activeFilter.value === 'colorScheme') {
    return colorOptions.map((value) => ({ value, label: colorLabels[value] }));
  }

  return [];
});

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

function selectOutfit(id: string) {
  selectedOutfitId.value = id;
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
</script>

<style scoped>
.header {
  padding: 12 16 0 16;
}

.title {
  font-size: 20;
  text-align: center;
  margin-top: 44;
  margin-bottom: 44;
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
  width: 114;
  height: 114;
  margin: 6;
  border-width: 1;
  border-radius: 14;
}

.outfit-card.selected {
  border-width: 3;
}

.outfit-image {
  width: 114;
  height: 114;
  border-radius: 14;
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
