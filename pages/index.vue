<script lang="ts" setup>
import CesiumViewer from "~/components/CesiumViewer.vue";
import DarkToggle from "~/components/DarkToggle.vue";
import DroneMenu from "~/components/DroneMenu.vue";
import DroneRightClickMenu from "~/components/DroneRightClickMenu.vue";
import MainToolbar from "~/components/MainToolbar.vue";

// flag to indicate if Cesium is initialized. Used to delay mounting child components
const cesiumInitialized = ref(false);

eventBus.on("cesiumInitialized", () => {
  cesiumInitialized.value = true;
});
</script>

<template>
  <div class="h-full w-full bg-black">
    <CesiumViewer />

    <div
      id="toolbarTopLeft"
      style="display: flex; gap: 5px; position: absolute; top: 5px; left: 5px"
    >
      <DarkToggle />

      <div id="demoMenu" />
    </div>

    <DroneRightClickMenu style="position: absolute" />
    <MainToolbar v-if="cesiumInitialized" id="mainToolbar" />

    <div
      id="toolbarTopRight"
      style="display: flex; gap: 5px; position: absolute; top: 5px; right: 5px"
    ></div>

    <DroneMenu />
  </div>
</template>
