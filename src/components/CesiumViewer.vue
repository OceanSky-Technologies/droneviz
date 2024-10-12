<script lang="ts" setup>
import CameraWindow from "./CameraWindow.vue";
import MainToolbar from "./MainToolbar.vue";
import { onMounted, ref } from "vue";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { Viewer, Cesium3DTileset, Math, Cartesian3 } from "cesium";
import { initDemo } from "@/demo/Demo";
import CesiumMouseHandler from "./CesiumMouseHandler";
import { run } from "./EntityHandler";
import { getCesiumViewer, initCesium } from "./CesiumViewerWrapper";
import { createViewerOptions } from "@/helpers/CesiumViewerOptions";

export interface CesiumViewerProps {
  mockViewerOptions?: Viewer.ConstructorOptions | undefined;
  googleTilesetMock?: Cesium3DTileset | undefined;
}

const props = defineProps<CesiumViewerProps>();

// flag to indicate if Cesium is initialized. Used to delay mounting child components
const cesiumInitialized = ref(false);

const maintoolbar = ref<InstanceType<typeof MainToolbar> | null>(null);

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

    initDemo();

    this.resetCamera();

    run();
  }

  /**
   * Resets the camera.
   */
  resetCamera() {
    // fly the camera to San Francisco
    getCesiumViewer().camera.flyTo({
      destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
      orientation: {
        heading: Math.toRadians(0.0),
        pitch: Math.toRadians(-15.0),
      },
    });
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
  <div class="relative h-full w-full bg-black">
    <MainToolbar v-if="cesiumInitialized" ref="maintoolbar" />

    <div id="cesiumContainer" />

    <div
      id="toolbar"
      style="
        background-color: #f0f9ff;
        border-radius: 5px;
        padding: 5px;
        display: block;
        position: absolute;
        top: 5px;
        left: 5px;
      "
    >
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
