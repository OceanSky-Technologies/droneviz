<template>
  <div>
    <Button @click="toggleDarkMode">
      <div class="icon-container">
        <IcOutlineDarkMode v-if="darkMode" class="icon" />
        <IcOutlineLightMode v-else class="icon" />
      </div>
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import { darkMode, toggleDarkMode } from "@/core/DarkMode";
import IcOutlineLightMode from "~icons/ic/outline-light-mode";
import IcOutlineDarkMode from "~icons/ic/outline-dark-mode";
</script>

<style scoped>
.icon-container {
  width: 20px;
  height: 20px;
  position: relative;
  overflow: visible;
}

.icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.3);
  transform-origin: center center;
}
</style>
