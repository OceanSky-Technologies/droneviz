<script lang="ts" setup>
import "cesium/Build/Cesium/Widgets/widgets.css";
import { createViewerOptions } from "@/utils/CesiumViewerOptions";
import { getCesiumViewer, initCesium } from "./CesiumViewerWrapper";
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
    await initCesium(createViewerOptions(), props.googleTilesetMock);
  }

  initLeftClickHandler();
  initDoubleClickHandler();
  initRightClickHandler();
  initMouseMoveHandler();

  if (settings.demoMode.value == true) initDemo();

  resetCamera();
}

/**
 * Resets the camera.
 */
async function resetCamera() {
  getCesiumViewer().scene.requestRender();
  const options = {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 0,
  };

  navigator.geolocation.getCurrentPosition(
    // position successfully obtained
    (pos) => {
      const crd = pos.coords;

      getCesiumViewer().camera.flyTo({
        destination: Cartesian3.fromDegrees(crd.longitude, crd.latitude, 400),
        orientation: {
          heading: Math.toRadians(0.0),
          pitch: Math.toRadians(-90.0),
        },
      });
    },
    // position successfully obtained
    (err) => {
      showToast(
        "Couldn't get your location. Please enable location services and make sure you're connected to the internet. " +
          JSON.stringify(err),
        ToastSeverity.Info,
      );

      // fly the camera to San Francisco
      getCesiumViewer().camera.flyTo({
        destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
        orientation: {
          heading: Math.toRadians(0.0),
          pitch: Math.toRadians(-15.0),
        },
      });
    },
    options,
  );
}

onMounted(async () => {
  try {
    await init();
  } catch (e) {
    if (e instanceof Error) {
      console.error("Error initializing Cesium viewer:", e.message);
      console.error(e.stack);
    }
  }
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
