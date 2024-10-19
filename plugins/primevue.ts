import { defineNuxtPlugin } from "#app";
import ToastService from "primevue/toastservice";

export default defineNuxtPlugin((nuxtApp) => {
  // Register ToastService
  nuxtApp.vueApp.use(ToastService);

  // Expose ToastService globally
  nuxtApp.provide(
    "toastService",
    nuxtApp.vueApp.config.globalProperties.$toast,
  );
});
