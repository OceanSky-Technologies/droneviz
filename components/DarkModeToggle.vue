<script setup lang="ts">
import Button from "primevue/button";
import { darkMode, toggleDarkMode } from "@/core/DarkMode";
import IcOutlineLightMode from "~icons/ic/outline-light-mode";
import IcOutlineDarkMode from "~icons/ic/outline-dark-mode";
</script>

<template>
  <div>
    <Button
      id="dark-mode-toggle-button"
      size="small"
      style="font-size: 1.2rem"
      @click="toggleDarkMode"
    >
      <template #icon>
        <IcOutlineDarkMode v-if="darkMode" />
        <IcOutlineLightMode v-else />
      </template>
    </Button>
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
