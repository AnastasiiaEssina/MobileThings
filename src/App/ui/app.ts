import { createApp } from 'nativescript-vue';
import { createPinia } from 'pinia';
import { SVGView } from '@nativescript-community/ui-svg';
import App from '../model/App.vue';
import { useAuthStore } from '../../Shared/model/AuthStore';
import { ensureAbortController } from '../../Shared/model/polyfills/ensureAbortController';
import { useWardrobeStore } from '../../Shared/model/WardrobeStore';

ensureAbortController();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.registerElement('SVGView', () => SVGView);

async function startApp() {
  try {
    const authStore = useAuthStore(pinia);
    const wardrobeStore = useWardrobeStore(pinia);
    await Promise.all([authStore.initialize(), wardrobeStore.initialize()]);
  } catch (error) {
    console.error('Failed to initialize application state', error);
  }

  app.start();
}

void startApp();
