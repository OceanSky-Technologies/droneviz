import "./assets/tailwind.css";
import "./assets/style.css";
import "primeicons/primeicons.css"; // Icons

import MainApp from "@/MainApp.vue";
import Aura from "@primevue/themes/aura";
import PrimeVue from "primevue/config";
import { App, createApp } from "vue";

import { registerSW } from "virtual:pwa-register";
import { definePreset } from "@primevue/themes";

export let app: App<Element>;

const ColorPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "{sky.50}",
      100: "{sky.100}",
      200: "{sky.200}",
      300: "{sky.300}",
      400: "{sky.400}",
      500: "{sky.500}",
      600: "{sky.600}",
      700: "{sky.700}",
      800: "{sky.800}",
      900: "{sky.900}",
      950: "{sky.950}",
    },
    colorScheme: {
      dark: {
        surface: {
          0: "#ffffff",
          50: "{neutral.50}",
          100: "{neutral.100}",
          200: "{neutral.200}",
          300: "{neutral.300}",
          400: "{neutral.400}",
          500: "{neutral.500}",
          600: "{neutral.600}",
          700: "{neutral.700}",
          800: "{neutral.800}",
          900: "{neutral.900}",
          950: "{neutral.950}",
        },
      },
    },
  },
});

/**
 * Start the app.
 */
export async function main() {
  registerSW({
    immediate: true,
  });

  app = createApp(MainApp);

  app.use(PrimeVue, {
    theme: {
      preset: ColorPreset,
      options: {
        darkModeSelector: ".dark",
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.config.errorHandler = (error: any) => {
    console.error("Unknown error:", error);
  };

  app.mount("#app");
}

main();
