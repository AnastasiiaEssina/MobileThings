<template>
  <GridLayout
    v-if="visible && clothing"
    rows="*"
    columns="*"
    class="modal-overlay"
  >
    <StackLayout class="modal-backdrop" @tap="emitClose" />

    <ScrollView class="modal-scroll">
      <StackLayout class="modal-card" :backgroundColor="COLORS.profileBackground">
        <Label text="Информация о вещи" class="modal-title" :color="COLORS.profileText" />

        <ClothingPreview :item="clothing" size="lg" />

        <Label text="Название" class="field-label" :color="COLORS.profileText" />
        <TextField v-model="draftName" class="field-input" />

        <Label text="Категория" class="field-label" :color="COLORS.profileText" />
        <ListPicker
          class="field-picker"
          :items="categoryPickerItems"
          :selectedIndex="categoryIndex"
          @selectedIndexChange="onCategoryChange"
        />

        <Label text="Сезон" class="field-label" :color="COLORS.profileText" />
        <ListPicker
          class="field-picker"
          :items="seasonPickerItems"
          :selectedIndex="seasonIndex"
          @selectedIndexChange="onSeasonChange"
        />

        <Label text="Гамма" class="field-label" :color="COLORS.profileText" />
        <ListPicker
          class="field-picker"
          :items="colorPickerItems"
          :selectedIndex="colorIndex"
          @selectedIndexChange="onColorChange"
        />

        <Label text="Входит в образы" class="field-label" :color="COLORS.profileText" />
        <StackLayout class="related-list">
          <Label
            v-for="outfit in relatedOutfits"
            :key="outfit.id"
            :text="outfit.name"
            class="related-item"
            :color="COLORS.mutedText"
          />
          <Label
            v-if="!relatedOutfits.length"
            text="Пока не используется"
            class="related-item"
            :color="COLORS.mutedText"
          />
        </StackLayout>

        <Label
          v-if="!canDelete"
          text="Удаление недоступно, пока вещь входит в один или несколько образов."
          class="delete-hint"
          :color="COLORS.profileText"
        />

        <GridLayout columns="*, *" class="action-row">
          <Button
            col="0"
            text="Сохранить"
            class="primary-button"
            :backgroundColor="COLORS.profileButton"
            :color="COLORS.profileText"
            @tap="saveChanges"
          />
          <Button
            col="1"
            text="Удалить"
            class="danger-button"
            :color="COLORS.profileText"
            :isEnabled="canDelete"
            :opacity="canDelete ? 1 : 0.5"
            @tap="removeClothing"
          />
        </GridLayout>

        <Button
          text="Закрыть"
          class="close-button"
          :backgroundColor="COLORS.cardBackground"
          :color="COLORS.profileText"
          @tap="emitClose"
        />
      </StackLayout>
    </ScrollView>
  </GridLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Clothing, Outfit } from '../model/Wardrobe';
import {
  CLOTHING_CATEGORY_LABELS,
  CLOTHING_CATEGORY_VALUES,
  COLOR_SCHEME_LABELS,
  COLOR_SCHEME_VALUES,
  SEASON_LABELS,
  SEASON_VALUES,
} from '../model/Wardrobe';
import { useWardrobeStore } from '../model/WardrobeStore';
import ClothingPreview from './ClothingPreview.vue';
import { COLORS } from './Colors';

const props = defineProps<{
  visible: boolean;
  clothing: Clothing | null;
  relatedOutfits: Outfit[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const wardrobeStore = useWardrobeStore();

const draftName = ref('');
const draftCategory = ref<Clothing['category']>('tops');
const draftSeason = ref<Clothing['season']>('summer');
const draftColorScheme = ref<Clothing['colorScheme']>('light');

const categoryPickerItems = CLOTHING_CATEGORY_VALUES.map((value) => CLOTHING_CATEGORY_LABELS[value]);
const seasonPickerItems = SEASON_VALUES.map((value) => SEASON_LABELS[value]);
const colorPickerItems = COLOR_SCHEME_VALUES.map((value) => COLOR_SCHEME_LABELS[value]);

const categoryIndex = computed(() => CLOTHING_CATEGORY_VALUES.indexOf(draftCategory.value));
const seasonIndex = computed(() => SEASON_VALUES.indexOf(draftSeason.value));
const colorIndex = computed(() => COLOR_SCHEME_VALUES.indexOf(draftColorScheme.value));
const canDelete = computed(() => props.relatedOutfits.length === 0);

watch(
  () => props.clothing,
  (nextClothing) => {
    if (!nextClothing) {
      return;
    }

    draftName.value = nextClothing.name;
    draftCategory.value = nextClothing.category;
    draftSeason.value = nextClothing.season;
    draftColorScheme.value = nextClothing.colorScheme;
  },
  { immediate: true }
);

function getPickerIndex(args: { object?: { selectedIndex?: number } }) {
  return args?.object?.selectedIndex ?? 0;
}

function onCategoryChange(args: { object?: { selectedIndex?: number } }) {
  draftCategory.value = CLOTHING_CATEGORY_VALUES[getPickerIndex(args)] ?? draftCategory.value;
}

function onSeasonChange(args: { object?: { selectedIndex?: number } }) {
  draftSeason.value = SEASON_VALUES[getPickerIndex(args)] ?? draftSeason.value;
}

function onColorChange(args: { object?: { selectedIndex?: number } }) {
  draftColorScheme.value = COLOR_SCHEME_VALUES[getPickerIndex(args)] ?? draftColorScheme.value;
}

async function saveChanges() {
  if (!props.clothing) {
    return;
  }

  await wardrobeStore.updateClothing(props.clothing.id, {
    name: draftName.value.trim() || props.clothing.name,
    category: draftCategory.value,
    season: draftSeason.value,
    colorScheme: draftColorScheme.value,
  });

  emitClose();
}

async function removeClothing() {
  if (!props.clothing || !canDelete.value) {
    return;
  }

  await wardrobeStore.deleteClothing(props.clothing.id);
  emitClose();
}

function emitClose() {
  emit('close');
}
</script>

<style scoped>
.modal-overlay {
  vertical-align: middle;
}

.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.28);
}

.modal-scroll {
  margin: 22;
  vertical-align: middle;
}

.modal-card {
  border-width: 1;
  border-color: #b87373;
  border-radius: 18;
  padding: 18 14;
}

.modal-title {
  font-size: 22;
  text-align: center;
  margin-bottom: 14;
}

.field-label {
  margin-top: 12;
  margin-bottom: 6;
  font-size: 14;
  font-weight: 600;
}

.field-input,
.field-picker {
  background-color: #ffffff;
  border-radius: 12;
}

.related-list {
  margin-top: 2;
}

.related-item {
  font-size: 13;
  margin-bottom: 4;
}

.delete-hint {
  font-size: 12;
  margin-top: 10;
}

.action-row {
  margin-top: 18;
  column-gap: 10;
}

.primary-button,
.danger-button,
.close-button {
  height: 40;
  border-radius: 20;
  text-transform: none;
}

.danger-button {
  background-color: #f1d8d8;
}

.close-button {
  margin-top: 10;
}
</style>
