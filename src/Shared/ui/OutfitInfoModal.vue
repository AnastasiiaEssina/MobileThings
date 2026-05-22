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

        <GridLayout rows="auto, auto, auto" columns="auto, *" class="metadata-summary">
          <Label row="0" col="0" text="Стиль" class="summary-label" :color="COLORS.profileText" />
          <Label row="0" col="1" :text="styleLabel" class="summary-value" :color="COLORS.mutedText" />

          <Label row="1" col="0" text="Сезон" class="summary-label" :color="COLORS.profileText" />
          <Label row="1" col="1" :text="seasonLabel" class="summary-value" :color="COLORS.mutedText" />

          <Label row="2" col="0" text="Гамма" class="summary-label" :color="COLORS.profileText" />
          <Label row="2" col="1" :text="colorLabel" class="summary-value" :color="COLORS.mutedText" />
        </GridLayout>

        <Button
          :text="isEditingMetadata ? 'Скрыть параметры' : 'Изменить параметры'"
          class="metadata-button"
          :backgroundColor="COLORS.cardBackground"
          :color="COLORS.profileText"
          @tap="isEditingMetadata = !isEditingMetadata"
        />

        <StackLayout v-if="isEditingMetadata" class="metadata-fields">
          <Label text="Стиль" class="field-label" :color="COLORS.profileText" />
          <WrapLayout class="choice-grid">
            <Button
              v-for="option in styleOptions"
              :key="option.value"
              :text="option.label"
              class="choice-button"
              :class="{ active: draftStyle === option.value }"
              :backgroundColor="draftStyle === option.value ? COLORS.profileText : COLORS.cardBackground"
              :color="draftStyle === option.value ? COLORS.background : COLORS.profileText"
              @tap="draftStyle = option.value"
            />
          </WrapLayout>

          <Label text="Сезон" class="field-label" :color="COLORS.profileText" />
          <WrapLayout class="choice-grid">
            <Button
              v-for="option in seasonOptions"
              :key="option.value"
              :text="option.label"
              class="choice-button"
              :class="{ active: draftSeason === option.value }"
              :backgroundColor="draftSeason === option.value ? COLORS.profileText : COLORS.cardBackground"
              :color="draftSeason === option.value ? COLORS.background : COLORS.profileText"
              @tap="draftSeason = option.value"
            />
          </WrapLayout>

          <Label text="Гамма" class="field-label" :color="COLORS.profileText" />
          <WrapLayout class="choice-grid">
            <Button
              v-for="option in colorOptions"
              :key="option.value"
              :text="option.label"
              class="choice-button"
              :class="{ active: draftColorScheme === option.value }"
              :backgroundColor="draftColorScheme === option.value ? COLORS.profileText : COLORS.cardBackground"
              :color="draftColorScheme === option.value ? COLORS.background : COLORS.profileText"
              @tap="draftColorScheme = option.value"
            />
          </WrapLayout>
        </StackLayout>

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
const isEditingMetadata = ref(false);

const styleOptions = OUTFIT_STYLE_VALUES.map((value) => ({
  value,
  label: OUTFIT_STYLE_LABELS[value],
}));
const seasonOptions = SEASON_VALUES.map((value) => ({
  value,
  label: SEASON_LABELS[value],
}));
const colorOptions = COLOR_SCHEME_VALUES.map((value) => ({
  value,
  label: COLOR_SCHEME_LABELS[value],
}));
const styleLabel = computed(() => OUTFIT_STYLE_LABELS[draftStyle.value]);
const seasonLabel = computed(() => SEASON_LABELS[draftSeason.value]);
const colorLabel = computed(() => COLOR_SCHEME_LABELS[draftColorScheme.value]);

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
    isEditingMetadata.value = false;
  },
  { immediate: true }
);

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

.field-input {
  background-color: #ffffff;
  border-radius: 12;
}

.metadata-summary {
  margin-top: 14;
  padding: 10 12;
  border-radius: 12;
  background-color: #ffffff;
}

.summary-label,
.summary-value {
  font-size: 13;
  margin: 3 0;
}

.summary-label {
  font-weight: 600;
  margin-right: 12;
}

.summary-value {
  text-align: right;
}

.metadata-button {
  height: 38;
  margin-top: 10;
  border-radius: 19;
  font-size: 14;
  text-transform: none;
}

.metadata-fields {
  margin-top: 2;
}

.choice-grid {
  margin: 0 -4 2 -4;
}

.choice-button {
  width: 122;
  height: 34;
  margin: 4;
  border-radius: 17;
  font-size: 12;
  padding: 0 6;
  text-transform: none;
}

.choice-button.active {
  font-weight: 700;
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
