<template>
  <Page class="page">
    <ActionBar title="Мои образы" class="action-bar">
  <ActionItem @tap="showAddModal = true" iosPosition="right">
    <Label class="add-btn" text="+" />
  </ActionItem>
</ActionBar>

    <GridLayout class="content" rows="auto, *" columns="*">
      <!-- Фильтры -->
      <StackLayout class="filters" row="0">
        <GridLayout columns="*, *, *" gap="10">
          <StackLayout class="filter-group" col="0">
            <Label class="filter-label" text="Стиль:" />
            <ListPicker
              :selectedIndex="styleIndex"
              @selectedIndexChange="onStyleChange"
              :items="styleOptions"
              class="filter-picker"
            />
          </StackLayout>

          <StackLayout class="filter-group" col="1">
            <Label class="filter-label" text="Сезон:" />
            <ListPicker
              :selectedIndex="seasonIndex"
              @selectedIndexChange="onSeasonChange"
              :items="seasonOptions"
              class="filter-picker"
            />
          </StackLayout>

          <StackLayout class="filter-group" col="2">
            <Label class="filter-label" text="Гамма:" />
            <ListPicker
              :selectedIndex="colorIndex"
              @selectedIndexChange="onColorChange"
              :items="colorOptions"
              class="filter-picker"
            />
          </StackLayout>
        </GridLayout>
      </StackLayout>

      <!-- Контент -->
      <GridLayout row="1" rows="auto" columns="*">
        <!-- Loading -->
        <StackLayout v-if="state.matches('loading')" class="loading-container">
          <ActivityIndicator :busy="true" class="spinner" />
          <Label class="loading-text" text="Загрузка..." />
        </StackLayout>

        <!-- Error -->
        <StackLayout v-else-if="state.matches('error')" class="error-container">
          <Label class="error-text" :text="'Ошибка: ' + state.context.error" />
          <Button @tap="fetchOutfits" class="retry-btn" text="Повторить" />
        </StackLayout>

        <!-- List -->
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

      <!-- Overlay Modal -->
      <GridLayout
        v-if="showAddModal"
        row="0"
        rowSpan="2"
        col="0"
        class="modal-overlay"
      >
        <StackLayout class="modal-card">
          <Label class="modal-title" text="Новый образ" />

          <TextField v-model="newName" hint="Название" class="input" />
          <TextField v-model="newImageUrl" hint="URL картинки" class="input" />
          <TextField v-model="newItems" hint="items (через запятую)" class="input" />

          <GridLayout columns="*,*" columnGap="10" class="modal-actions">
            <Button text="Отмена" class="cancel-btn" @tap="closeModal" />
            <Button text="Добавить" class="save-btn" @tap="handleAddOutfit" />
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

// FIX: NativeScript picker
const onStyleChange = (args: any) => {
  send({ type: 'SET_FILTER', payload: { style: styleOptions[args.object.selectedIndex] } });
};

const onSeasonChange = (args: any) => {
  send({ type: 'SET_FILTER', payload: { season: seasonOptions[args.object.selectedIndex] } });
};

const onColorChange = (args: any) => {
  send({ type: 'SET_FILTER', payload: { colorScheme: colorOptions[args.object.selectedIndex] } });
};

const newName = ref('');
const newImageUrl = ref('');
const newItems = ref('');

const closeModal = () => {
  showAddModal.value = false;
};

const handleAddOutfit = () => {
  const outfit: Outfit = {
    id: Date.now().toString(),
    name: newName.value || 'Новый образ',
    items: newItems.value.split(',').map(i => i.trim()),
    style: 'casual',
    season: 'summer',
    colorScheme: 'neutral',
    imageUrl: newImageUrl.value || 'https://picsum.photos/300/300'
  };

  send({ type: 'ADD_OUTFIT', payload: outfit });
  closeModal();
};

const deleteOutfit = (id: string) => {
  send({ type: 'DELETE_OUTFIT', payload: id });
};

const fetchOutfits = () => {
  send({ type: 'FETCH_OUTFITS' });

  setTimeout(() => {
    send({
      type: 'FETCH_SUCCESS',
      outfits: [
        {
          id: '1',
          name: 'Образ 1',
          items: ['dress'],
          style: 'evening',
          season: 'winter',
          colorScheme: 'light',
          imageUrl: 'https://picsum.photos/id/1/300/300',
        }
      ]
    });
  }, 1000);
};

onMounted(fetchOutfits);
</script>

<style scoped>
.page { background-color: #faf8f5; }

.action-bar {
  background-color: #5c3d3d;
  color: white;
}

.add-btn { font-size: 24; color: white; }

.modal-overlay {
  background-color: rgba(0,0,0,0.5);
  padding: 20;
  vertical-align: middle;
}

.modal-card {
  background-color: white;
  border-radius: 12;
  padding: 16;
}

.input {
  margin-bottom: 10;
  background: #eee;
  border-radius: 6;
  padding: 8;
}

.save-btn { background: #5c3d3d; color: white; }
.cancel-btn { background: #ccc; }

.outfit-card {
  width: 47%;
  margin: 1.5%;
  background: white;
  border-radius: 12;
}
</style>