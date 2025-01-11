<script setup lang="ts">
import "primeicons/primeicons.css";
import Toast from "primevue/toast";
import { initDarkMode } from "@/core/DarkMode";
import { onMounted } from "vue";

// If the page was hard-refreshed the service worker isn't controlling the page.
// Workaround: detect that a worker should be used but isn't currently. Then reload the page to use it.
// See https://stackoverflow.com/a/62596701
// navigator.serviceWorker.getRegistration().then(function (reg) {
//   // There's an active SW, but no controller for this tab.
//   if (reg?.active && !navigator.serviceWorker.controller) {
//     // Perform a soft reload to load everything from the SW and get
//     // a consistent set of resources.
//     showToast(
//       "Service worker isn't controlling this page. Reloading!",
//       ToastSeverity.Warn,
//     );
//     window.location.reload();
//   }
// });

initDarkMode();

onMounted(() => {
  window.addEventListener("storage", (event) => {
    if (event.key === "dark-mode") {
      const isDarkMode = event.newValue === "true";
      document.documentElement.classList.toggle("dark", isDarkMode);
    }
  });
});
</script>

<template>
  <NuxtPwaManifest />
  <Toast style="padding: 0 !important" />
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
html,
body {
  margin: 0 !important;
  padding: 0 !important;
}
</style>
