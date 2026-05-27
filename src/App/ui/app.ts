import { createApp } from 'nativescript-vue';
import { createPinia } from 'pinia';
import { watch } from 'vue';
import { SVGView } from '@nativescript-community/ui-svg';
import App from '../model/App.vue';
import { useAuthStore } from '../../Shared/model/AuthStore';
import { ensureAbortController } from '../../Shared/model/polyfills/ensureAbortController';
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
let wardrobeSyncTimer: ReturnType<typeof setInterval> | null = null;

themeStore.initialize();

function syncWardrobeIfOnline() {
  if (!authStore.accessToken || authStore.isGuest) {
    return;
  }

  void wardrobeStore.syncWithServer(authStore.accessToken);
}

function startWardrobeSyncLoop() {
  if (wardrobeSyncTimer) {
    return;
  }

  wardrobeSyncTimer = setInterval(syncWardrobeIfOnline, 45_000);
}

async function initializeStores() {
  try {
    await Promise.all([authStore.initialize(), wardrobeStore.initialize()]);
    syncWardrobeIfOnline();
    startWardrobeSyncLoop();
  } catch (error) {
    console.error('Failed to initialize application state', error);
  }
}

watch(
  () => authStore.accessToken,
  () => {
    syncWardrobeIfOnline();
  }
);

app.start();
void initializeStores();
