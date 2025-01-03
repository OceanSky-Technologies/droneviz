<script setup lang="ts">
import "primeicons/primeicons.css";
import Toast from "primevue/toast";
import { initDarkMode } from "@/core/DarkMode";

import { useRegisterSW } from "virtual:pwa-register/vue";
// import { useRegisterSW } from 'virtual:pwa-register/svelte'
// import { useRegisterSW } from 'virtual:pwa-register/react'

useRegisterSW();

initDarkMode();

onMounted(() => {
  window.addEventListener("storage", (event) => {
    if (event.key === "dark-mode") {
      const isDarkMode = event.newValue === "true";
      document.documentElement.classList.toggle("dark", isDarkMode);
    }
  });

  // if ("serviceWorker" in navigator) {
  //   navigator.serviceWorker
  //     .register(new URL("/sw.ts", import.meta.url), { type: "module" })
  //     .then((registration) => {
  //       console.log("[Service Worker] Registered:", registration);
  //     })
  //     .catch((error) => {
  //       console.error("[Service Worker] Registration failed:", error);
  //     });
  // }
});
</script>

<template>
  <Toast style="padding: 0 !important" />
  <NuxtPage />
</template>

<style>
html,
body {
  margin: 0 !important;
  padding: 0 !important;
}
</style>
