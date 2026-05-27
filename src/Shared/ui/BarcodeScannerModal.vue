<template>
  <Frame>
    <!-- Добавляем событие shownModally, чтобы сохранить ссылку на окно при его открытии -->
    <Page actionBarHidden="true">
      <GridLayout rows="*, auto" backgroundColor="#000000">
        <!-- Компонент камеры -->
        <MLKitView 
          row="0"
          detectionType="all" 
          cameraPosition="rear"
          @detection="onBarcodeDetected" />

        <!-- Панель управления -->
        <StackLayout row="1" class="p-4" backgroundColor="#ffffff">
          <Button text="Отмена" @tap="closeModal(null)" class="btn-cancel" />
        </StackLayout>
      </GridLayout>
    </Page>
  </Frame>
</template>

<script setup lang="ts">
import { ref, getCurrentInstance } from 'vue';

// Получаем доступ к текущему экземпляру Vue-компонента
const { proxy } = getCurrentInstance() as any;

let isProcessed = false;

function onBarcodeDetected(args: any) {
  if (isProcessed) return;

  // Проверяем все возможные свойства, куда MLKit может положить данные кодов
  const items = args.data || args.barcodes || args.objects;
  
  if (items && items.length > 0) {
    isProcessed = true;
    
    // Берем значение (value или text или rawValue) первого найденного кода
    const codeValue = items[0].value || items[0].text || items[0].rawValue; 
    
    if (codeValue) {
      console.log('Код успешно отсканирован:', codeValue);
      closeModal(codeValue);
    } else {
      isProcessed = false;
    }
  }
}


function closeModal(result: string | null) {
  // В NativeScript-Vue 3 у каждого модального окна на прокси доступен метод $modal.close
  if (proxy && proxy.$modal) {
    proxy.$modal.close(result);
  } else {
    console.log('Критическая ошибка: контекст модального окна не найден', result);
  }
}
</script>

<style scoped>
.p-4 {
  padding: 16;
}
.btn-cancel {
  height: 46;
  border-radius: 23;
  font-size: 16;
  background-color: #f0f0f0;
  color: #333333;
  text-transform: none;
}
</style>