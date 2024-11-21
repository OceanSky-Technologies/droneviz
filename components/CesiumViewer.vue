<script lang="ts" setup>
import "cesium/Build/Cesium/Widgets/widgets.css";
import { createViewerOptions } from "~/utils/CesiumViewerOptions";
import { getCesiumViewer, initCesium } from "./CesiumViewerWrapper";
import { initDemo } from "~/demo/Demo";
import { Math, Cartesian3 } from "cesium";
import { onMounted, ref } from "vue";
import CesiumMouseHandler from "./CesiumMouseHandler";
import MainToolbar from "./MainToolbar.vue";
import type { Viewer, Cesium3DTileset } from "cesium";
import { settings } from "../utils/Settings";

export interface CesiumViewerProps {
  mockViewerOptions?: Viewer.ConstructorOptions | undefined;
  googleTilesetMock?: Cesium3DTileset | undefined;
}

const props = defineProps<CesiumViewerProps>();

// flag to indicate if Cesium is initialized. Used to delay mounting child components
const cesiumInitialized = ref(false);

defineExpose({
  // add variables / functions to define the interface
});
/**
 * Cesium container class.
 */
class CesiumViewerImpl {
  mouseHandlers: CesiumMouseHandler | undefined;

  /**
   * Initialize Cesium.
   */
  async init() {
    if (props.mockViewerOptions) {
      console.info("Cesium setup using mockViewerOptions");
      await initCesium(props.mockViewerOptions, props.googleTilesetMock);
    } else {
      await initCesium(createViewerOptions(), props.googleTilesetMock);
    }

    cesiumInitialized.value = true;

    this.mouseHandlers = new CesiumMouseHandler();

    if (settings.demoMode.value == true) initDemo();

    this.resetCamera();
  }

  /**
   * Resets the camera.
   */
  async resetCamera() {
    // wait for Cesium to initialize for a smooth transition
    await new Promise((r) => setTimeout(r, 1000));

    getCesiumViewer().scene.requestRender();
    const options = {
      enableHighAccuracy: true,
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
}

const cesiumViewerImpl: CesiumViewerImpl = new CesiumViewerImpl();

onMounted(async () => {
  try {
    await cesiumViewerImpl?.init();
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

    <MainToolbar v-if="cesiumInitialized" id="mainToolbar" />
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

#mainToolbar {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 10;
}
</style>
