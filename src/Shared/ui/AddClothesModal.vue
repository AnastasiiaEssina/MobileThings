<template>
  <GridLayout
    v-if="visible"
    rows="*"
    columns="*"
    class="modal-overlay"
  >
    <StackLayout
      row="0"
      col="0"
      class="modal-backdrop"
      @tap="emitClose"
    />

    <StackLayout
      row="0"
      col="0"
      class="modal-card"
      :backgroundColor="COLORS.profileBackground"
    >
      <Label text="Мои вещи" class="title" :color="COLORS.profileText" />

      <GridLayout class="scrollbar-track">
        <StackLayout class="scrollbar-thumb" :backgroundColor="COLORS.cardBackground" />
      </GridLayout>

      <ScrollView orientation="horizontal" scrollBarIndicatorVisible="false">
        <StackLayout orientation="horizontal" class="categories-row">
          <Button
            v-for="category in categories"
            :key="category.value"
            :text="category.label"
            class="category-chip"
            :class="{ active: selectedCategory === category.value }"
            :backgroundColor="selectedCategory === category.value ? COLORS.profileText : COLORS.profileButton"
            :color="selectedCategory === category.value ? COLORS.background : COLORS.profileText"
            @tap="selectedCategory = category.value"
          />
        </StackLayout>
      </ScrollView>

      <WrapLayout class="items-grid">
        <GridLayout
          v-for="item in filteredStandardClothes"
          :key="item.id"
          class="item-card"
          :backgroundColor="COLORS.cardBackground"
          :borderColor="COLORS.profileText"
          @tap="addClothing(item.id)"
        >
          <Image
            v-if="item.imageUrl"
            :src="item.imageUrl"
            loadMode="async"
            stretch="aspectFit"
            class="item-image"
          />
          <GridLayout
            v-else
            class="placeholder-card"
            :backgroundColor="item.fillColor || COLORS.cardBackground"
          >
            <Label :text="item.emoji || '👕'" class="placeholder-emoji" />
          </GridLayout>
        </GridLayout>
      </WrapLayout>

      <Button
        text="Загрузить свое"
        class="upload-button"
        :backgroundColor="COLORS.profileButton"
        :color="COLORS.profileText"
      />
    </StackLayout>
  </GridLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import type { ClothingCategory } from '../model/Wardrobe';
import { COLORS } from './Colors';
import { useWardrobeStore } from '../model/WardrobeStore';

type Category = 'all' | ClothingCategory;

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const wardrobeStore = useWardrobeStore();
const { standardClothes } = storeToRefs(wardrobeStore);
const selectedCategory = ref<Category>('all');

const categories = [
  { value: 'all' as const, label: 'Все' },
  { value: 'tops' as const, label: 'Топы' },
  { value: 'pants' as const, label: 'Брюки' },
  { value: 'shoes' as const, label: 'Обувь' },
];

const filteredStandardClothes = computed(() => {
  if (selectedCategory.value === 'all') {
    return standardClothes.value;
  }

  return standardClothes.value.filter((item) => item.category === selectedCategory.value);
});

async function addClothing(id: string) {
  await wardrobeStore.addClothingToMyWardrobe(id);
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

.modal-card {
  margin: 22;
  border-width: 1;
  border-color: #b87373;
  padding: 14 10 18 10;
  vertical-align: middle;
}

.title {
  font-size: 22;
  text-align: center;
  margin-bottom: 14;
}

.scrollbar-track {
  margin: 0 10 14 10;
  height: 6;
  border-radius: 3;
  background-color: #d9d5cf;
}

.scrollbar-thumb {
  width: 14;
  height: 6;
  border-radius: 3;
  horizontal-align: left;
}

.categories-row {
  padding: 0 4 14 4;
}

.category-chip {
  height: 36;
  min-width: 62;
  margin-right: 10;
  border-radius: 18;
  font-size: 14;
  padding: 0 16;
  text-transform: none;
}

.category-chip.active {
  font-weight: 700;
}

.items-grid {
  padding: 0 2 12 2;
}

.item-card {
  width: 64;
  height: 64;
  margin: 6;
  border-width: 1;
  border-radius: 14;
}

.item-image {
  width: 56;
  height: 56;
  horizontal-align: center;
  vertical-align: middle;
}

.placeholder-card {
  width: 56;
  height: 56;
  border-radius: 12;
  horizontal-align: center;
  vertical-align: middle;
}

.placeholder-emoji {
  font-size: 30;
  horizontal-align: center;
  vertical-align: middle;
}

.upload-button {
  height: 42;
  border-radius: 21;
  font-size: 16;
  padding: 0;
  text-transform: none;
}
</style>
