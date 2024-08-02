import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import Lara from "./presets/primevue-tailwind-presets-4.0.0.rc.1/presets/lara";
import "./pwa";

const app = createApp(App);

app.use(PrimeVue, {
  unstyled: true,
  pt: Lara,
  options: {
    darkModeSelector: "system",
  },
});

app.config.errorHandler = (err) => {
  console.error("Caught error: " + err);
};

app.mount("#app");
