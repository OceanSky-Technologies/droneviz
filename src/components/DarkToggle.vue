<script setup lang="ts">
import "primeicons/primeicons.css";
import Button from "primevue/button";
import { ref } from "vue";

let darkMode = ref(false);

// only on client side
// get system scheme
if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  darkMode.value = true;
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

<style scoped>
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
