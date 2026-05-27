import { createApp } from 'nativescript-vue';
import { createPinia } from 'pinia';
import { watch } from 'vue';
import { SVGView } from '@nativescript-community/ui-svg';
import App from '../model/App.vue';
import { useAuthStore } from '../../Shared/model/AuthStore';
import { ensureAbortController } from '../../Shared/model/polyfills/ensureAbortController';
import { removePushTokenForUser, syncPushTokenForUser } from '../../Shared/model/PushNotifications';
import { useThemeStore } from '../../Shared/model/ThemeStore';
import { useWardrobeStore } from '../../Shared/model/WardrobeStore';

ensureAbortController();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.registerElement('SVGView', () => SVGView);

const themeStore = useThemeStore(pinia);
const authStore = useAuthStore(pinia);
const wardrobeStore = useWardrobeStore(pinia);

themeStore.initialize();

function syncWardrobeIfSignedIn() {
  if (!authStore.accessToken || authStore.isGuest) {
    return;
  }

  void wardrobeStore.syncWithServer(authStore.accessToken);
}

function syncPushIfSignedIn() {
  if (!authStore.accessToken || authStore.isGuest) {
    return;
  }

  void syncPushTokenForUser(authStore.accessToken);
}

wardrobeStore.setChangeSyncHandler(syncWardrobeIfSignedIn);

async function initializeStores() {
  try {
    await Promise.all([authStore.initialize(), wardrobeStore.initialize()]);
    syncWardrobeIfSignedIn();
    syncPushIfSignedIn();
  } catch (error) {
    console.error('Failed to initialize application state', error);
  }
}

watch(
  () => authStore.accessToken,
  (nextToken, previousToken) => {
    if (previousToken && !nextToken) {
      void removePushTokenForUser(previousToken);
    }
    syncWardrobeIfSignedIn();
    syncPushIfSignedIn();
  }
);

app.start();
void initializeStores();
