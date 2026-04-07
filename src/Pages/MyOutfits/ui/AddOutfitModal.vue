<!-- src/Pages/MyOutfits/ui/AddOutfitModal.vue -->
<template>
  <modal-page>
    <grid-layout class="modal-container" rows="auto, *, auto" columns="*">
      <stack-layout class="modal-header" row="0">
        <label class="modal-title" text="Добавить образ" />
        <button @tap="$emit('close')" class="close-btn" text="✕" />
      </stack-layout>

      <scroll-view row="1">
        <stack-layout class="modal-content">
          <stack-layout class="form-group">
            <label class="form-label">Название:</label>
            <text-field 
              v-model="form.name" 
              class="form-input"
              hint="Введите название образа"
            />
          </stack-layout>
          
          <stack-layout class="form-group">
            <label class="form-label">Стиль:</label>
            <list-picker
              v-model="form.style"
              :items="styleOptions"
              class="form-picker"
            />
          </stack-layout>

          <stack-layout class="form-group">
            <label class="form-label">Сезон:</label>
            <list-picker
              v-model="form.season"
              :items="seasonOptions"
              class="form-picker"
            />
          </stack-layout>

          <stack-layout class="form-group">
            <label class="form-label">Гамма:</label>
            <list-picker
              v-model="form.colorScheme"
              :items="colorOptions"
              class="form-picker"
            />
          </stack-layout>

          <stack-layout class="form-group">
            <label class="form-label">URL изображения:</label>
            <text-field 
              v-model="form.imageUrl" 
              class="form-input"
              hint="https://example.com/image.jpg"
            />
          </stack-layout>
        </stack-layout>
      </scroll-view>

      <grid-layout row="2" columns="*, *" class="modal-actions" gap="12">
        <button @tap="$emit('close')" class="cancel-btn" text="Отмена" />
        <button @tap="submit" class="submit-btn" text="Добавить" />
      </grid-layout>
    </grid-layout>
  </modal-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Outfit } from '~/Shared/model/FilterTypes';

const emit = defineEmits<{
  close: [];
  add: [outfit: Outfit];
}>();

const styleOptions = [
  { text: 'Повседневный', value: 'casual' },
  { text: 'Деловой', value: 'business' },
  { text: 'Спортивный', value: 'sport' },
  { text: 'Вечерний', value: 'evening' }
];

const seasonOptions = [
  { text: 'Весна', value: 'spring' },
  { text: 'Лето', value: 'summer' },
  { text: 'Осень', value: 'autumn' },
  { text: 'Зима', value: 'winter' }
];

const colorOptions = [
  { text: 'Светлая', value: 'light' },
  { text: 'Темная', value: 'dark' },
  { text: 'Нейтральная', value: 'neutral' },
  { text: 'Яркая', value: 'bright' }
];

const form = ref({
  name: '',
  style: 'casual',
  season: 'spring',
  colorScheme: 'light',
  imageUrl: 'https://picsum.photos/id/100/300/300'
});

const submit = () => {
  if (!form.value.name.trim()) {
    console.log('Пожалуйста, введите название образа');
    return;
  }
  
  const newOutfit: Outfit = {
    id: Date.now().toString(),
    name: form.value.name,
    items: [],
    style: form.value.style as any,
    season: form.value.season as any,
    colorScheme: form.value.colorScheme as any,
    imageUrl: form.value.imageUrl,
  };
  
  emit('add', newOutfit);
  emit('close');
};
</script>

<style scoped>
.modal-container {
  background-color: white;
  border-radius: 12;
  margin: 20;
  height: 500;
}

.modal-header {
  padding: 16;
  background-color: #a8b5a8;
  border-top-left-radius: 12;
  border-top-right-radius: 12;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18;
  font-weight: bold;
  color: #5c3d3d;
}

.close-btn {
  background-color: transparent;
  color: #5c3d3d;
  font-size: 20;
  padding: 0;
}

.modal-content {
  padding: 16;
}

.form-group {
  margin-bottom: 16;
}

.form-label {
  font-size: 14;
  font-weight: bold;
  color: #5c3d3d;
  margin-bottom: 6;
}

.form-input {
  background-color: #f5f5f5;
  border-width: 1;
  border-color: #ddd;
  border-radius: 6;
  padding: 8;
  font-size: 14;
}

.form-picker {
  background-color: #f5f5f5;
  border-width: 1;
  border-color: #ddd;
  border-radius: 6;
  height: 40;
}

.modal-actions {
  padding: 16;
  border-top-width: 1;
  border-top-color: #e0e0e0;
}

.cancel-btn {
  background-color: #ddd;
  color: #666;
  border-radius: 6;
  padding: 10;
}

.submit-btn {
  background-color: #a8b5a8;
  color: #5c3d3d;
  border-radius: 6;
  padding: 10;
}
</style>