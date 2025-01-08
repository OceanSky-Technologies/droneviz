import { defineNuxtPlugin } from "#app";
import { rotate } from "@/core/directives/rotate";

export default defineNuxtPlugin({
  parallel: true,
  async setup(nuxtApp) {
    nuxtApp.vueApp.directive("rotate", rotate);
  },
});
