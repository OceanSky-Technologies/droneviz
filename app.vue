<script setup lang="ts">
import "primeicons/primeicons.css";
import Toast from "primevue/toast";
import { initDarkMode } from "@/core/DarkMode";

initDarkMode();

window.addEventListener("storage", (event) => {
  if (event.key === "dark-mode") {
    const isDarkMode = event.newValue === "true";
    document.documentElement.classList.toggle("dark", isDarkMode);
  }
});
</script>

<template>
  <VitePwaManifest />
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
