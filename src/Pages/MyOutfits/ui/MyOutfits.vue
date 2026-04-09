<template>
  <Page class="page">
    <GridLayout rows="auto, auto, auto, *">

      <!-- Заголовок -->
      <StackLayout row="0" class="header">
        <Label text="Мои образы" class="title" />
      </StackLayout>

      <!-- Кнопка + -->
      <StackLayout row="1" class="add-container">
        <Button text="+" class="add-button" @tap="openModal" />
      </StackLayout>

      <!-- Фильтры -->
      <StackLayout row="2" class="filters">
        <GridLayout columns="*,*,*" gap="10">

          <StackLayout col="0">
            <Label text="Стиль:" class="filter-label" />
            <ListPicker
              :items="styleOptions"
              :selectedIndex="styleIndex"
              @selectedIndexChange="onStyleChange"
              class="picker"
            />
          </StackLayout>

          <StackLayout col="1">
            <Label text="Сезон:" class="filter-label" />
            <ListPicker
              :items="seasonOptions"
              :selectedIndex="seasonIndex"
              @selectedIndexChange="onSeasonChange"
              class="picker"
            />
          </StackLayout>

          <StackLayout col="2">
            <Label text="Гамма:" class="filter-label" />
            <ListPicker
              :items="colorOptions"
              :selectedIndex="colorIndex"
              @selectedIndexChange="onColorChange"
              class="picker"
            />
          </StackLayout>

        </GridLayout>
      </StackLayout>

      <!-- Список -->
      <ScrollView row="3">
        <WrapLayout class="grid">
          <StackLayout
            v-for="outfit in state.context.filteredOutfits"
            :key="outfit.id"
            class="card"
          >
            <Image class="rounded-4xl" width="350" src="../../../assets/ррр.jpg" />     ааааааааааааааа
            <Label :text="outfit.name" class="card-title"/>
            <Button text="Удалить" @tap="deleteOutfit(outfit.id)" />
          </StackLayout>
        </WrapLayout>
      </ScrollView>

      <!-- Модалка -->
      <GridLayout
        v-if="showAddModal"
        class="modal-overlay"
      >
        <StackLayout class="modal-card">
          <Label text="Новый образ" />

          <TextField v-model="newName" hint="Название" />
          <TextField v-model="newImageUrl" hint="URL картинки" />
          <TextField v-model="newItems" hint="items" />

          <Button text="Добавить" @tap="handleAddOutfit" />
          <Button text="Отмена" @tap="closeModal" />
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

// ✅ модалка
const showAddModal = ref<boolean>(false);

const openModal = () => {
  showAddModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
};

// ✅ фильтры
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

// ✅ обработчики (важно!)
const onStyleChange = (args: any) => {
  send({
    type: 'SET_FILTER',
    payload: { style: styleOptions[args.object.selectedIndex] }
  });
};

const onSeasonChange = (args: any) => {
  send({
    type: 'SET_FILTER',
    payload: { season: seasonOptions[args.object.selectedIndex] }
  });
};

const onColorChange = (args: any) => {
  send({
    type: 'SET_FILTER',
    payload: { colorScheme: colorOptions[args.object.selectedIndex] }
  });
};

// ✅ форма
const newName = ref('');
const newImageUrl = ref('');
const newItems = ref('');

// ✅ добавление
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

// ✅ удаление
const deleteOutfit = (id: string) => {
  send({ type: 'DELETE_OUTFIT', payload: id });
};

// ✅ загрузка
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