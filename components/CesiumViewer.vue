<template>
  <div class="relative">
    <div id="cesiumContainer" />
    <GeolocationPin />
  </div>
</template>

<script lang="ts" setup>
import "cesium/Build/Cesium/Widgets/widgets.css";
import GeolocationPin from "~/components/GeolocationPin.vue";
import { createViewerOptions } from "@/utils/CesiumViewerOptions";
import { initCesium } from "./CesiumViewerWrapper";
import { initDemo } from "@/demo/Demo";
import { onMounted } from "vue";
import type { Viewer, Cesium3DTileset } from "cesium";
import { settings } from "../utils/Settings";
import { init as initLeftClickHandler } from "./LeftClickHandler";
import { init as initDoubleClickHandler } from "./DoubleClickHandler";
import { init as initRightClickHandler } from "./RightClickHandler";
import { init as initMouseMoveHandler } from "./MouseMoveHandler";
import { watchHomePositionUpdates } from "~/core/Geolocation";

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
  } catch (e) {
    if (e instanceof Error) {
      console.error("Error initializing Cesium viewer:", e.message);
    }
  }

  watchHomePositionUpdates();
});
</script>

<style scoped lang="postcss">
#cesiumContainer {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
