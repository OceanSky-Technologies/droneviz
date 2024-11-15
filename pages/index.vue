<script lang="ts" setup>
import CesiumViewer from "~/components/CesiumViewer.vue";
import DarkToggle from "~/components/DarkToggle.vue";
import { droneCollection } from "~/components/DroneCollection";

function connect() {
  droneCollection.connectAll();
}
</script>

<template>
  <div class="h-full w-full bg-black">
    <CesiumViewer />

    <div
      id="toolbarTopLeft"
      style="display: flex; gap: 5px; position: absolute; top: 5px; left: 5px"
    >
      <DarkToggle />
      <Button label="Connect" @click="connect" />
      <CameraWindow />

      <div id="demoMenu" />
    </div>

    <div
      id="toolbarTopRight"
      style="display: flex; gap: 5px; position: absolute; top: 5px; right: 5px"
    ></div>
  </div>
</template>
