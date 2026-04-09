import { createApp } from 'nativescript-vue';
import { SVGView } from '@nativescript-community/ui-svg';
import App from '../model/App.vue';

const app = createApp(App);

app.registerElement('SVGView', () => SVGView);
app.start();
