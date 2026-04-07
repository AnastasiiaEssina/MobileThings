<template>
  <Page class="page">
    <ActionBar title="Мои образы" class="action-bar">
      <ActionItem @tap="openAddModal" ios.position="right">
        <Label class="add-btn" text="+" />
      </ActionItem>
    </ActionBar>

    <GridLayout class="content" rows="auto,*" columns="*">
      <StackLayout class="filters" row="0">
        <GridLayout columns="*,*,*" gap="10">
          <StackLayout class="filter-group" col="0">
            <Label class="filter-label" text="Стиль:" />
            <ListPicker
              :items="styleOptions"
              :selectedIndex="styleIndex"
              @selectedIndexChange="onStyleChange"
              class="filter-picker"
            />
          </StackLayout>

          <StackLayout class="filter-group" col="1">
            <Label class="filter-label" text="Сезон:" />
            <ListPicker
              :items="seasonOptions"
              :selectedIndex="seasonIndex"
              @selectedIndexChange="onSeasonChange"
              class="filter-picker"
            />
          </StackLayout>

          <StackLayout class="filter-group" col="2">
            <Label class="filter-label" text="Гамма:" />
            <ListPicker
              :items="colorOptions"
              :selectedIndex="colorIndex"
              @selectedIndexChange="onColorChange"
              class="filter-picker"
            />
          </StackLayout>
        </GridLayout>
      </StackLayout>

      <GridLayout row="1" rows="auto" columns="*">
        <StackLayout v-if="state.matches('loading')" class="loading-container">
          <ActivityIndicator :busy="true" class="spinner" />
          <Label class="loading-text" text="Загрузка..." />
        </StackLayout>

        <StackLayout v-else-if="state.matches('error')" class="error-container">
          <Label class="error-text" :text="'Ошибка: ' + state.context.error" />
          <Button @tap="fetchOutfits" class="retry-btn" text="Повторить" />
        </StackLayout>

        <ScrollView v-else class="outfits-scroll">
          <WrapLayout class="outfits-grid">
            <StackLayout
              v-for="outfit in state.context.filteredOutfits"
              :key="outfit.id"
              class="outfit-card"
            >
              <Image
                :src="outfit.imageUrl"
                class="outfit-image"
                stretch="aspectFill"
              />
              <StackLayout class="outfit-info">
                <Label class="outfit-name" :text="outfit.name" />
                <Button
                  @tap="deleteOutfit(outfit.id)"
                  class="delete-btn"
                  text="Удалить"
                />
              </StackLayout>
            </StackLayout>
          </WrapLayout>
        </ScrollView>
      </GridLayout>

      <GridLayout
        v-if="showAddModal"
        row="0"
        rowSpan="2"
        col="0"
        class="modal-overlay"
      >
        <StackLayout class="modal-card">
          <Label class="modal-title" text="Новый образ" />

          <Label class="field-label" text="Название" />
          <TextField v-model="newName" class="field-input" hint="Например, Образ на вечер" />

          <Label class="field-label" text="Ссылка на изображение" />
          <TextField v-model="newImageUrl" class="field-input" hint="https://..." />

          <Label class="field-label" text="Стиль" />
          <ListPicker
            :items="styleOptions"
            :selectedIndex="newStyleIndex"
            @selectedIndexChange="onNewStyleChange"
            class="field-picker"
          />

          <Label class="field-label" text="Сезон" />
          <ListPicker
            :items="seasonOptions"
            :selectedIndex="newSeasonIndex"
            @selectedIndexChange="onNewSeasonChange"
            class="field-picker"
          />

          <Label class="field-label" text="Гамма" />
          <ListPicker
            :items="colorOptions"
            :selectedIndex="newColorIndex"
            @selectedIndexChange="onNewColorChange"
            class="field-picker"
          />

          <Label class="field-label" text="Предметы через запятую" />
          <TextField v-model="newItems" class="field-input" hint="dress, boots" />

          <GridLayout columns="*,*" columnGap="10" class="modal-actions">
            <Button col="0" class="cancel-btn" text="Отмена" @tap="closeAddModal" />
            <Button col="1" class="save-btn" text="Добавить" @tap="handleAddOutfit" />
          </GridLayout>
        </StackLayout>
      </GridLayout>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useActor } from '@xstate/vue';
import { outfitsMachine } from '../model/Machine';
import type { Outfit } from '../../../Shared/model/FilterTypes';

const { snapshot: state, send } = useActor(outfitsMachine);

const showAddModal = ref(false);

const styleOptions = ['all', 'casual', 'business', 'sport', 'evening'];
const seasonOptions = ['all', 'spring', 'summer', 'autumn', 'winter'];
const colorOptions = ['all', 'light', 'dark', 'neutral', 'bright'];

const styleIndex = computed(() =>
  styleOptions.indexOf(state.value.context.filters.style)
);
const seasonIndex = computed(() =>
  seasonOptions.indexOf(state.value.context.filters.season)
);
const colorIndex = computed(() =>
  colorOptions.indexOf(state.value.context.filters.colorScheme)
);

const newName = ref('');
const newImageUrl = ref('');
const newItems = ref('');
const newStyleIndex = ref(0);
const newSeasonIndex = ref(0);
const newColorIndex = ref(0);

function getPickerIndex(args: any) {
  return args?.object?.selectedIndex ?? args?.value ?? 0;
}

const onStyleChange = (args: any) => {
  const index = getPickerIndex(args);
  send({ type: 'SET_FILTER', payload: { style: styleOptions[index] } });
};

const onSeasonChange = (args: any) => {
  const index = getPickerIndex(args);
  send({ type: 'SET_FILTER', payload: { season: seasonOptions[index] } });
};

const onColorChange = (args: any) => {
  const index = getPickerIndex(args);
  send({ type: 'SET_FILTER', payload: { colorScheme: colorOptions[index] } });
};

const onNewStyleChange = (args: any) => {
  newStyleIndex.value = getPickerIndex(args);
};

const onNewSeasonChange = (args: any) => {
  newSeasonIndex.value = getPickerIndex(args);
};

const onNewColorChange = (args: any) => {
  newColorIndex.value = getPickerIndex(args);
};

const fetchOutfits = () => {
  send({ type: 'FETCH_OUTFITS' });

  setTimeout(() => {
    const mockOutfits: Outfit[] = [
      {
        id: '1',
        name: 'Образ 1',
        items: ['dress', 'boots'],
        style: 'evening',
        season: 'winter',
        colorScheme: 'light',
        imageUrl: 'https://picsum.photos/id/1/300/300',
      },
      {
        id: '2',
        name: 'Образ 2',
        items: ['jacket', 'boots', 'tshirt'],
        style: 'casual',
        season: 'autumn',
        colorScheme: 'dark',
        imageUrl: 'https://picsum.photos/id/2/300/300',
      },
      {
        id: '3',
        name: 'Образ 3',
        items: ['suit', 'shirt'],
        style: 'business',
        season: 'spring',
        colorScheme: 'neutral',
        imageUrl: 'https://picsum.photos/id/3/300/300',
      },
    ];

    send({ type: 'FETCH_SUCCESS', outfits: mockOutfits });
  }, 1000);
};

const openAddModal = () => {
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
};

const handleAddOutfit = () => {
  const outfit: Outfit = {
    id: Date.now().toString(),
    name: newName.value.trim() || 'Новый образ',
    items: newItems.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    style: styleOptions[newStyleIndex.value] as Outfit['style'],
    season: seasonOptions[newSeasonIndex.value] as Outfit['season'],
    colorScheme: colorOptions[newColorIndex.value] as Outfit['colorScheme'],
    imageUrl: newImageUrl.value.trim() || 'https://picsum.photos/300/300',
  };

  send({ type: 'ADD_OUTFIT', payload: outfit });

  newName.value = '';
  newImageUrl.value = '';
  newItems.value = '';
  newStyleIndex.value = 0;
  newSeasonIndex.value = 0;
  newColorIndex.value = 0;
  showAddModal.value = false;
};

const deleteOutfit = (id: string) => {
  send({ type: 'DELETE_OUTFIT', payload: id });
};

onMounted(() => {
  fetchOutfits();
});
</script>

<style scoped>
.page {
  background-color: #faf8f5;
}

.action-bar {
  background-color: #5c3d3d;
  color: white;
}

.add-btn {
  font-size: 24;
  font-weight: bold;
  color: white;
}

.content {
  padding: 16;
}

.filters {
  background-color: #a8b5a8;
  border-radius: 12;
  padding: 12;
  margin-bottom: 16;
}

.filter-group {
  padding: 4;
}

.filter-label,
.field-label {
  font-size: 12;
  color: #5c3d3d;
  margin-bottom: 4;
  font-weight: bold;
}

.filter-picker,
.field-input,
.field-picker {
  background-color: white;
  height: 36;
  border-radius: 8;
}

.loading-container,
.error-container {
  padding: 40;
  text-align: center;
}

.spinner {
  margin-bottom: 10;
}

.loading-text,
.error-text {
  font-size: 16;
  color: #5c3d3d;
}

.retry-btn {
  background-color: #a8b5a8;
  color: #5c3d3d;
  border-radius: 8;
  padding: 8 16;
  margin-top: 12;
}

.outfits-scroll {
  height: 100%;
}

.outfits-grid {
  padding: 4;
}

.outfit-card {
  width: 47%;
  margin: 1.5%;
  background-color: white;
  border-radius: 12;
  overflow: hidden;
  box-shadow: 0 2 8 rgba(0, 0, 0, 0.1);
}

.outfit-image {
  height: 200;
  width: 100%;
}

.outfit-info {
  padding: 12;
}

.outfit-name {
  font-size: 14;
  font-weight: bold;
  color: #5c3d3d;
  margin-bottom: 8;
  text-align: center;
}

.delete-btn {
  background-color: #ff6b6b;
  color: white;
  border-radius: 6;
  padding: 6 12;
  font-size: 12;
}

.modal-overlay {
  background-color: rgba(0, 0, 0, 0.45);
  padding: 20;
  vertical-align: middle;
}

.modal-card {
  background-color: white;
  border-radius: 16;
  padding: 16;
}

.modal-title {
  font-size: 18;
  font-weight: bold;
  color: #5c3d3d;
  margin-bottom: 12;
  text-align: center;
}

.field-input,
.field-picker {
  margin-bottom: 10;
}

.modal-actions {
  margin-top: 8;
}

.cancel-btn {
  background-color: #ddd;
  color: #333;
  border-radius: 8;
}

.save-btn {
  background-color: #5c3d3d;
  color: white;
  border-radius: 8;
}
</style>