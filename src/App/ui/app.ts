import { createApp } from 'nativescript-vue';
import { createPinia } from 'pinia';
import { SVGView } from '@nativescript-community/ui-svg';
import App from '../model/App.vue';
import { useWardrobeStore } from '../../Shared/model/WardrobeStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.registerElement('SVGView', () => SVGView);

async function startApp() {
  try {
    const wardrobeStore = useWardrobeStore(pinia);
    await wardrobeStore.initialize();
  } catch (error) {
    console.error('Failed to initialize local wardrobe storage', error);
  }

  app.start();
}

void startApp();
