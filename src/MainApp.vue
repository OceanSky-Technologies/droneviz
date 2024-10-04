<script lang="ts" setup>
import CesiumViewer from "./components/CesiumViewer.vue";
import DarkToggle from "./components/DarkToggle.vue";
</script>

<template>
  <body>
    <div>
      <CesiumViewer />

      <DarkToggle style="position: absolute; right: 200px; top: 5px" />
    </div>
  </body>
</template>

<style lang="postcss">
@import "./assets/style.css";
</style>
