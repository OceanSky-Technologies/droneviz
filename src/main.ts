import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import Aura from "./presets/primevue-tailwind-presets-4.0.0.rc.1/presets/aura";
import "./pwa";

const app = createApp(App);

app.use(PrimeVue, {
  unstyled: true,
  pt: Aura,
});

app.config.errorHandler = (err) => {
  console.error("Caught error: " + err);
};

app.mount("#app");
