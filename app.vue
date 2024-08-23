<script lang="ts" setup>
import CesiumViewer from "./src/components/CesiumViewer.vue";
import DarkToggle from "./src/components/DarkToggle.vue";
</script>

<template>
  <body>
    <div>
      <CesiumViewer google-tiles-enabled-initial />

      <!-- <DarkToggle style="position: absolute; right: 200px; top: 5px" /> -->
    </div>
  </body>
</template>

<style lang="postcss">
@import "./src/assets/style.css";
</style>
