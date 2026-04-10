<template>
  <Frame>
    <Page v-if="!isReady">
      <ActionBar visibility="collapse" />
      <GridLayout rows="*" columns="*">
        <Label text="Загрузка..." horizontalAlignment="center" verticalAlignment="middle" />
      </GridLayout>
    </Page>

    <Login v-else-if="!isAuthenticated" />
    <MyOutfits v-else />
  </Frame>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import Login from '../../Pages/login/ui/Login.vue';
import MyOutfits from '../../Pages/MyOutfits/ui/MyOutfits.vue';
import { useAuthStore } from '../../Shared/model/AuthStore';

const authStore = useAuthStore();
const { isHydrated, isAuthenticated } = storeToRefs(authStore);

const isReady = computed(() => isHydrated.value);
</script>
