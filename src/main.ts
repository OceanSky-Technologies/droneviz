import MainApp from "@/MainApp.vue";
import Lara from "@presets/primevue-tailwind-presets-0.4.0/lara";
import PrimeVue from "primevue/config";
import { App, createApp } from "vue";

import { registerSW } from "virtual:pwa-register";

export let app: App<Element>;

/**
 * Start the app.
 */
export function main() {
  registerSW({
    immediate: true,
  });

  app = createApp(MainApp);

  app.use(PrimeVue, {
    unstyled: true,
    pt: Lara,
    options: {
      darkModeSelector: "system",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.config.errorHandler = (error: any) => {
    if (error instanceof Error) {
      console.error("Caught error:", error.message);
      console.error("Stack trace:", error.stack);
    } else {
      console.error("Unknown error:", error);
    }
  };

  app.mount("#app");
}

main();
