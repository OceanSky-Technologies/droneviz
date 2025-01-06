<script lang="ts" setup>
import "cesium/Build/Cesium/Widgets/widgets.css";
import { createViewerOptions } from "@/utils/CesiumViewerOptions";
import {
  getCesiumViewer,
  initCesium,
  destroyCesium,
  resetCameraToGeolocation,
} from "./CesiumViewerWrapper";
import { initDemo } from "@/demo/Demo";
import { Math, Cartesian3 } from "cesium";
import { onMounted } from "vue";
import type { Viewer, Cesium3DTileset } from "cesium";
import { settings } from "../utils/Settings";
import { init as initLeftClickHandler } from "./LeftClickHandler";
import { init as initDoubleClickHandler } from "./DoubleClickHandler";
import { init as initRightClickHandler } from "./RightClickHandler";
import { init as initMouseMoveHandler } from "./MouseMoveHandler";

export interface CesiumViewerProps {
  mockViewerOptions?: Viewer.ConstructorOptions | undefined;
  googleTilesetMock?: Cesium3DTileset | undefined;
}

const props = defineProps<CesiumViewerProps>();

/**
 * Initialize Cesium.
 */
async function init() {
  if (props.mockViewerOptions) {
    console.info("Cesium setup using mockViewerOptions");
    await initCesium(props.mockViewerOptions, props.googleTilesetMock);
  } else {
    await initCesium(await createViewerOptions(), props.googleTilesetMock);
  }

  initLeftClickHandler();
  initDoubleClickHandler();
  initRightClickHandler();
  initMouseMoveHandler();

  if (settings.demoMode.value == true) initDemo();
}

onMounted(async () => {
  try {
    await init();

    await resetCameraToGeolocation();
  } catch (e) {
    if (e instanceof Error) {
      console.error("Error initializing Cesium viewer:", e.message);
      console.error(e.stack);
    }
  }
});

onUnmounted(() => {
  destroyCesium();
});
</script>

<template>
  <div class="relative">
    <div id="cesiumContainer" />
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
