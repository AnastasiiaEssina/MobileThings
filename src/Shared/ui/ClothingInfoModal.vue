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
        <TextField
          v-model="draftName"
          class="field-input"
          :backgroundColor="COLORS.cardBackground"
          :color="COLORS.profileText"
        />

        <GridLayout
          rows="auto, auto, auto"
          columns="auto, *"
          class="metadata-summary"
          :backgroundColor="COLORS.cardBackground"
        >
          <Label row="0" col="0" text="Категория" class="summary-label" :color="COLORS.profileText" />
          <Label row="0" col="1" :text="categoryLabel" class="summary-value" :color="COLORS.mutedText" />

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
          <Label text="Категория" class="field-label" :color="COLORS.profileText" />
          <WrapLayout class="choice-grid">
            <Button
              v-for="option in categoryOptions"
              :key="option.value"
              :text="option.label"
              class="choice-button"
              :class="{ active: draftCategory === option.value }"
              :backgroundColor="draftCategory === option.value ? COLORS.profileText : COLORS.cardBackground"
              :color="draftCategory === option.value ? COLORS.background : COLORS.profileText"
              @tap="draftCategory = option.value"
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
          v-if="deleteHint"
          :text="deleteHint"
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
            :backgroundColor="COLORS.dangerButton"
            :color="COLORS.dangerText"
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
const isEditingMetadata = ref(false);

const categoryOptions = CLOTHING_CATEGORY_VALUES.map((value) => ({
  value,
  label: CLOTHING_CATEGORY_LABELS[value],
}));
const seasonOptions = SEASON_VALUES.map((value) => ({
  value,
  label: SEASON_LABELS[value],
}));
const colorOptions = COLOR_SCHEME_VALUES.map((value) => ({
  value,
  label: COLOR_SCHEME_LABELS[value],
}));
const categoryLabel = computed(() => CLOTHING_CATEGORY_LABELS[draftCategory.value]);
const seasonLabel = computed(() => SEASON_LABELS[draftSeason.value]);
const colorLabel = computed(() => COLOR_SCHEME_LABELS[draftColorScheme.value]);
const isStandardClothing = computed(() => props.clothing?.source === 'standard');
const canDelete = computed(() => !isStandardClothing.value && props.relatedOutfits.length === 0);
const deleteHint = computed(() => {
  if (isStandardClothing.value) {
    return 'Базовые вещи из каталога не удаляются.';
  }

  if (props.relatedOutfits.length > 0) {
    return 'Удаление недоступно, пока вещь входит в один или несколько образов.';
  }

  return '';
});

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
    isEditingMetadata.value = false;
  },
  { immediate: true }
);

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

.field-input {
  border-radius: 12;
}

.metadata-summary {
  margin-top: 14;
  padding: 10 12;
  border-radius: 12;
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

.close-button {
  margin-top: 10;
}
</style>
