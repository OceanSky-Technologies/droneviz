<script lang="ts" setup>
import CesiumViewer from "~/components/CesiumViewer.vue";
import DarkToggle from "~/components/DarkToggle.vue";
</script>

<template>
  <div class="h-full w-full bg-black">
    <CesiumViewer />

    <DarkToggle style="position: absolute; right: 200px; top: 5px" />
  </div>
</template>
