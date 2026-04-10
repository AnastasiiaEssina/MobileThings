<template>
  <Page :backgroundColor="COLORS.profileBackground">
    <ActionBar visibility="collapse" />

    <GridLayout rows="auto, auto, auto, auto, *, auto">
      <StackLayout row="0" class="header" @tap="closeActiveFilter">
        <Label text="Мои образы" class="title" :color="COLORS.profileText" />
      </StackLayout>

      <StackLayout row="1" class="add-container" @tap="closeActiveFilter">
        <Button
          text="+"
          class="add-button"
          :backgroundColor="COLORS.profileButton"
          :color="COLORS.profileText"
          @tap="addOutfit"
        />
      </StackLayout>

      <StackLayout row="2" class="filters">
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

      <GridLayout row="3" class="scrollbar-track" @tap="closeActiveFilter">
        <StackLayout class="scrollbar-thumb" :backgroundColor="COLORS.cardBackground" />
      </GridLayout>

      <ScrollView
        row="4"
        orientation="horizontal"
        scrollBarIndicatorVisible="false"
        @tap="closeActiveFilter"
      >
        <StackLayout orientation="horizontal" class="outfits-row">
          <GridLayout
            v-for="outfit in filteredOutfits"
            :key="outfit.id"
            class="outfit-card"
            :backgroundColor="COLORS.cardBackground"
            :borderColor="COLORS.profileText"
          >
            <Image
              :src="outfit.imageUrl"
              stretch="aspectFill"
              class="outfit-image"
            />
          </GridLayout>
        </StackLayout>
      </ScrollView>

      <GridLayout
        row="5"
        columns="*, *, *, *"
        class="bottom-nav"
        :backgroundColor="COLORS.profileBackground"
        @tap="closeActiveFilter"
      >
        <GridLayout
          col="0"
          class="nav-item active"
          :backgroundColor="COLORS.navActiveBackground"
          @tap="openMyOutfits"
        >
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

        <GridLayout col="3" class="nav-item" @tap="openProfile">
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
import { computed, onMounted, ref } from 'vue';
import { $navigateTo } from 'nativescript-vue';
import { useMachine } from '@xstate/vue';
import { COLORS } from '../../../Shared/ui/Colors';
import CreateOutfit from '../../CreateOutfit/ui/CreateOutfit.vue';
import MyClothes from '../../MyClothes/ui/MyClothes.vue';
import { outfitsMachine } from '../model/Machine';
import Profile from '../../profile/ui/Profile.vue';
import { OUTFITS } from '../../../Shared/model/WardrobeData';
import {
  COLOR_SCHEME_VALUES,
  OUTFIT_STYLE_VALUES,
  SEASON_VALUES,
  type Outfit,
  type OutfitFilterState,
} from '../../../Shared/model/Wardrobe';

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

const { snapshot, send } = useMachine(outfitsMachine);
const activeFilter = ref<FilterKey | null>(null);

onMounted(() => {
  send({ type: 'FETCH_OUTFITS' });
  send({ type: 'FETCH_SUCCESS', outfits: OUTFITS });
});

const filters = computed(() => snapshot.value.context.filters);
const filteredOutfits = computed(() => snapshot.value.context.filteredOutfits);

const styleLabel = computed(() => styleLabels[filters.value.style as keyof typeof styleLabels] ?? 'Любой');
const seasonLabel = computed(() => seasonLabels[filters.value.season as keyof typeof seasonLabels] ?? 'Любой');
const colorLabel = computed(() => colorLabels[filters.value.colorScheme as keyof typeof colorLabels] ?? 'Любая');

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

function setFilter(payload: Partial<OutfitFilterState>) {
  send({ type: 'SET_FILTER', payload });
}

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

  setFilter({ [activeFilter.value]: value });
  activeFilter.value = null;
}

function addOutfit() {
  $navigateTo(CreateOutfit);
}

function openMyOutfits() {
  return;
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
  padding-top: 12;
  padding-left: 16;
  padding-right: 16;
}

.title {
  font-size: 24;
  text-align: center;
  margin-top: 18;
  margin-bottom: 18;
}

.add-container {
  padding-left: 12;
  padding-right: 12;
  margin-bottom: 28;
}

.add-button {
  height: 42;
  border-radius: 21;
  font-size: 24;
  font-weight: 600;
  padding: 0;
}

.filters {
  padding-left: 12;
  padding-right: 12;
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
  height: 38;
  border-radius: 19;
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

.scrollbar-track {
  margin: 18 16 12 16;
  height: 6;
  border-radius: 3;
  background-color: #d9d5cf;
}

.scrollbar-thumb {
  width: 72;
  height: 6;
  border-radius: 3;
  horizontal-align: left;
}

.outfits-row {
  padding: 0 12 0 12;
}

.outfit-card {
  width: 150;
  height: 168;
  margin-right: 12;
  border-width: 1;
  border-radius: 16;
}

.outfit-image {
  width: 150;
  height: 168;
  border-radius: 16;
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
