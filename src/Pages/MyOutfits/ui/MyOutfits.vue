<!-- src/Pages/MyOutfits/ui/MyOutfits.vue -->
<template>
  <page class="page">
    <action-bar title="Мои образы" class="action-bar">
      <action-item @tap="showAddModal = true" ios.position="right">
        <label class="add-btn" text="+"></label>
      </action-item>
    </action-bar>

    <grid-layout class="content" rows="auto, *" columns="*">
      <!-- Фильтры -->
      <stack-layout class="filters" row="0">
        <grid-layout columns="*, *, *" gap="10">
          <stack-layout class="filter-group" col="0">
            <label class="filter-label">Стиль:</label>
            <list-picker
              :selectedIndex="styleIndex"
              @selectedIndexChange="onStyleChange"
              :items="styleOptions"
              class="filter-picker"
            />
          </stack-layout>

          <stack-layout class="filter-group" col="1">
            <label class="filter-label">Сезон:</label>
            <list-picker
              :selectedIndex="seasonIndex"
              @selectedIndexChange="onSeasonChange"
              :items="seasonOptions"
              class="filter-picker"
            />
          </stack-layout>

          <stack-layout class="filter-group" col="2">
            <label class="filter-label">Гамма:</label>
            <list-picker
              :selectedIndex="colorIndex"
              @selectedIndexChange="onColorChange"
              :items="colorOptions"
              class="filter-picker"
            />
          </stack-layout>
        </grid-layout>
      </stack-layout>

      <!-- Состояния загрузки/ошибки/контент -->
      <grid-layout row="1" rows="auto" columns="*">
        <!-- Загрузка -->
        <stack-layout v-if="state.matches('loading')" class="loading-container">
          <activity-indicator :busy="true" class="spinner" />
          <label class="loading-text" text="Загрузка..." />
        </stack-layout>

        <!-- Ошибка -->
        <stack-layout v-else-if="state.matches('error')" class="error-container">
          <label class="error-text" :text="'Ошибка: ' + state.context.error" />
          <button @tap="fetchOutfits" class="retry-btn" text="Повторить" />
        </stack-layout>

        <!-- Список образов -->
        <scroll-view v-else class="outfits-scroll">
          <wrap-layout class="outfits-grid">
            <stack-layout
              v-for="outfit in state.context.filteredOutfits"
              :key="outfit.id"
              class="outfit-card"
            >
              <image 
                :src="outfit.imageUrl" 
                class="outfit-image"
                placeholder="~/assets/images/placeholder.png"
                stretch="aspectFill"
              />
              <stack-layout class="outfit-info">
                <label class="outfit-name" :text="outfit.name" />
                <button 
                  @tap="deleteOutfit(outfit.id)" 
                  class="delete-btn" 
                  text="Удалить"
                />
              </stack-layout>
            </stack-layout>
          </wrap-layout>
        </scroll-view>
      </grid-layout>
    </grid-layout>

    <!-- Модальное окно добавления -->
    <modal-page v-if="showAddModal" @close="showAddModal = false">
      <AddOutfitModal
        @close="showAddModal = false"
        @add="handleAddOutfit"
      />
    </modal-page>
  </page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useActor } from '@xstate/vue';
import { outfitsMachine } from '../model/Machine';
import type { Outfit, FilterState } from '~/Shared/model/FilterTypes';
import AddOutfitModal from './AddOutfitModal.vue';

// Инициализация машины состояний - используем useActor вместо useMachine
const {snapshot: state, send } = useActor(outfitsMachine);

// Локальное состояние
const showAddModal = ref(false);

// Опции для фильтров
const styleOptions = ['all', 'casual', 'business', 'sport', 'evening'];
const seasonOptions = ['all', 'spring', 'summer', 'autumn', 'winter'];
const colorOptions = ['all', 'light', 'dark', 'neutral', 'bright'];

// Текущие индексы для picker'ов
const styleIndex = computed(() => {
  return styleOptions.indexOf(state.value.context.filters.style);
});

const seasonIndex = computed(() => {
  return seasonOptions.indexOf(state.value.context.filters.season);
});

const colorIndex = computed(() => {
  return colorOptions.indexOf(state.value.context.filters.colorScheme);
});

// Обработчики фильтров
const onStyleChange = (args: any) => {
  const style = styleOptions[args.value];
  send({ type: 'SET_FILTER', payload: { style } });
};

const onSeasonChange = (args: any) => {
  const season = seasonOptions[args.value];
  send({ type: 'SET_FILTER', payload: { season } });
};

const onColorChange = (args: any) => {
  const colorScheme = colorOptions[args.value];
  send({ type: 'SET_FILTER', payload: { colorScheme } });
};

// Загрузка образов
const fetchOutfits = () => {
  send({ type: 'FETCH_OUTFITS' });
  
  // Имитация API запроса
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

// Добавление образа
const handleAddOutfit = (outfit: Outfit) => {
  send({ type: 'ADD_OUTFIT', payload: outfit });
  showAddModal.value = false;
};

// Удаление образа
const deleteOutfit = (id: string) => {
  send({ type: 'DELETE_OUTFIT', payload: id });
};

// Загрузка при монтировании
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

.filter-label {
  font-size: 12;
  color: #5c3d3d;
  margin-bottom: 4;
  font-weight: bold;
}

.filter-picker {
  background-color: white;
  height: 36;
  border-radius: 8;
}

.loading-container, .error-container {
  padding: 40;
  text-align: center;
}

.spinner {
  margin-bottom: 10;
}

.loading-text, .error-text {
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
</style>