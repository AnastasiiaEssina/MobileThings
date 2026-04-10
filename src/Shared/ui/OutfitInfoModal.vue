<template>
  <GridLayout
    v-if="visible && outfit"
    rows="*"
    columns="*"
    class="modal-overlay"
  >
    <StackLayout class="modal-backdrop" @tap="emitClose" />

    <ScrollView class="modal-scroll">
      <StackLayout class="modal-card" :backgroundColor="COLORS.profileBackground">
        <Label text="Информация об образе" class="modal-title" :color="COLORS.profileText" />

        <OutfitPreview :items="outfitItems" variant="large" />

        <Label text="Название" class="field-label" :color="COLORS.profileText" />
        <TextField v-model="draftName" class="field-input" />

        <Label text="Стиль" class="field-label" :color="COLORS.profileText" />
        <ListPicker
          class="field-picker"
          :items="stylePickerItems"
          :selectedIndex="styleIndex"
          @selectedIndexChange="onStyleChange"
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

        <Label text="Состоит из" class="field-label" :color="COLORS.profileText" />
        <StackLayout class="related-list">
          <Label
            v-for="item in outfitItems"
            :key="item.id"
            :text="item.name"
            class="related-item"
            :color="COLORS.mutedText"
          />
          <Label
            v-if="!outfitItems.length"
            text="В образе пока нет вещей"
            class="related-item"
            :color="COLORS.mutedText"
          />
        </StackLayout>

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
            @tap="removeOutfit"
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
  COLOR_SCHEME_LABELS,
  COLOR_SCHEME_VALUES,
  OUTFIT_STYLE_LABELS,
  OUTFIT_STYLE_VALUES,
  SEASON_LABELS,
  SEASON_VALUES,
} from '../model/Wardrobe';
import { useWardrobeStore } from '../model/WardrobeStore';
import { COLORS } from './Colors';
import OutfitPreview from './OutfitPreview.vue';

const props = defineProps<{
  visible: boolean;
  outfit: Outfit | null;
  outfitItems: Clothing[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const wardrobeStore = useWardrobeStore();

const draftName = ref('');
const draftStyle = ref<Outfit['style']>('casual');
const draftSeason = ref<Outfit['season']>('summer');
const draftColorScheme = ref<Outfit['colorScheme']>('light');

const stylePickerItems = OUTFIT_STYLE_VALUES.map((value) => OUTFIT_STYLE_LABELS[value]);
const seasonPickerItems = SEASON_VALUES.map((value) => SEASON_LABELS[value]);
const colorPickerItems = COLOR_SCHEME_VALUES.map((value) => COLOR_SCHEME_LABELS[value]);

const styleIndex = computed(() => OUTFIT_STYLE_VALUES.indexOf(draftStyle.value));
const seasonIndex = computed(() => SEASON_VALUES.indexOf(draftSeason.value));
const colorIndex = computed(() => COLOR_SCHEME_VALUES.indexOf(draftColorScheme.value));

watch(
  () => props.outfit,
  (nextOutfit) => {
    if (!nextOutfit) {
      return;
    }

    draftName.value = nextOutfit.name;
    draftStyle.value = nextOutfit.style;
    draftSeason.value = nextOutfit.season;
    draftColorScheme.value = nextOutfit.colorScheme;
  },
  { immediate: true }
);

function getPickerIndex(args: { object?: { selectedIndex?: number } }) {
  return args?.object?.selectedIndex ?? 0;
}

function onStyleChange(args: { object?: { selectedIndex?: number } }) {
  draftStyle.value = OUTFIT_STYLE_VALUES[getPickerIndex(args)] ?? draftStyle.value;
}

function onSeasonChange(args: { object?: { selectedIndex?: number } }) {
  draftSeason.value = SEASON_VALUES[getPickerIndex(args)] ?? draftSeason.value;
}

function onColorChange(args: { object?: { selectedIndex?: number } }) {
  draftColorScheme.value = COLOR_SCHEME_VALUES[getPickerIndex(args)] ?? draftColorScheme.value;
}

async function saveChanges() {
  if (!props.outfit) {
    return;
  }

  await wardrobeStore.updateOutfit(props.outfit.id, {
    name: draftName.value.trim() || props.outfit.name,
    style: draftStyle.value,
    season: draftSeason.value,
    colorScheme: draftColorScheme.value,
  });

  emitClose();
}

async function removeOutfit() {
  if (!props.outfit) {
    return;
  }

  await wardrobeStore.deleteOutfit(props.outfit.id);
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
