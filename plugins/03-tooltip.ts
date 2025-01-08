import { defineNuxtPlugin } from "#app";
import Tooltip from "primevue/tooltip";

export default defineNuxtPlugin({
  parallel: true,
  async setup(nuxtApp) {
    nuxtApp.vueApp.directive("tooltip", Tooltip);
  },
});
