<script setup lang="ts">
import "primeicons/primeicons.css";
import Button from "primevue/button";
import { ref } from "vue";
import { DarkMode, settings } from "../utils/Settings";

let darkMode: Ref<boolean>;

if (settings.darkMode.value === DarkMode.System) {
  // get system scheme
  if (import.meta.client) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      darkMode = ref(true);
    } else {
      darkMode = ref(false);
    }
  } else {
    darkMode = ref(true);
  }
} else {
  darkMode = ref(settings.darkMode.value === DarkMode.Dark);
}

if (darkMode.value) {
  document.documentElement.classList.add("dark");
}

const toggleDarkMode = () => {
  document.documentElement.classList.toggle("dark");
  darkMode.value = !darkMode.value;

  if (darkMode.value) {
    console.log("Dark mode enabled");
  } else {
    console.log("Dark mode disabled");
  }
};
</script>

<template>
  <div>
    <Button
      id="dark-mode-toggle-button"
      :icon="darkMode.valueOf() ? 'pi pi-moon' : 'pi pi-sun'"
      size="small"
      style="font-size: 1.2rem"
      @click="toggleDarkMode"
    />
  </div>
</template>

<style scoped lang="postcss">
button {
  padding-top: 5px !important;
  padding-bottom: 5px !important;
}

.toggle-icon:before {
  content: "\e9c8";
}

:root[class="dark"] .toggle-icon:before {
  content: "\e9c7";
}
</style>
