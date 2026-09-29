import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import { createHead } from '@unhead/vue'
// Styles Tailwind CSS
import './assets/main.css';

// Initialisation de l'application
const app = createApp(App);
const pinia = createPinia();
const head = createHead()

app.use(pinia);
app.use(router);
app.use(head)

// Montage
app.mount('#app');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
