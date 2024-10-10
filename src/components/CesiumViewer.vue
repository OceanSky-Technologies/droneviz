<script lang="ts" setup>
import CameraWindow from "./CameraWindow.vue";
import MainToolbar from "./MainToolbar.vue";
import { onMounted, onUnmounted, watch } from "vue";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { settings } from "@/components/Settings";
import { CesiumViewerImpl, Props } from "./CesiumViewerImpl";

let cesiumViewer: CesiumViewerImpl | undefined;

/**
 * Toggles the Google 3D tiles (on/off) when the settings value changed.
 */
watch(
  () => settings.google3DTilesEnabled.value,
  (newVal) => {
    if (newVal) cesiumViewer?.enableGoogleTiles();
    else cesiumViewer?.disableGoogleTiles();
  },
);

const props = withDefaults(defineProps<Props>(), {
  // add default values
});

defineExpose({
  // add variables / functions to define the interface
});

onMounted(() => {
  cesiumViewer = new CesiumViewerImpl(props);
});

onUnmounted(() => {
  cesiumViewer?.destroy();
});
</script>

<template>
  <div class="relative h-full w-full bg-black">
    <MainToolbar />

    <div id="cesiumContainer" />

    <div
      id="toolbar"
      style="background-color: #f0f9ff; border-radius: 5px; padding: 5px"
    >
      <div id="google-tiles">
        <input
          id="google-tiles-checkbox"
          v-model="settings.google3DTilesEnabled.value"
          type="checkbox"
        />

        <label for="google-tiles-checkbox" style="padding: 5px">
          Show 3D Google tiles
        </label>
      </div>

      <div id="demoMenu" />

      <CameraWindow />
    </div>
  </div>
</template>

<style scoped lang="postcss">
#cesiumContainer {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
