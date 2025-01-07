<script lang="ts" setup>
import "cesium/Build/Cesium/Widgets/widgets.css";
import { createViewerOptions } from "@/utils/CesiumViewerOptions";
import {
  getCesiumViewer,
  initCesium,
  destroyCesium,
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
import { getGeolocationAsync } from "~/utils/geolocation";
import { updateEgoPosition } from "~/core/EgoPosition";

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

  // try to get the camera location a few times before giving up
  // workaround solution because with tauri the first few attempts seem to fail
  let errorMessage;
  for (let i = 0; i < 5; i++) {
    try {
      const position = await getGeolocationAsync();
      console.log("initial position:", position);

      updateEgoPosition(position);

      getCesiumViewer().camera.flyTo({
        destination: Cartesian3.fromDegrees(
          position.coords.longitude,
          position.coords.latitude,
          400,
        ),
        orientation: {
          heading: Math.toRadians(0.0),
          pitch: Math.toRadians(-90.0),
        },
        complete: () => {
          // the sphere position uses globe.getHeight which might not be ready yet so update again after the camera has flown
          updateEgoPosition(position);
        },
      });

      break; // success
    } catch (e) {
      if (e instanceof Error) {
        errorMessage = e.message;
      } else {
        errorMessage = "Could not get geolocation: " + e;
      }
      await new Promise((f) => setTimeout(f, 1000));
    }
  }
  if (errorMessage) showToast(errorMessage, ToastSeverity.Error);

  watchHomePositionUpdates();
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
