<script lang="ts" setup>
import IconCommunity from "./icons/IconCommunity.vue";
import { onMounted, onUnmounted, Ref, ref } from "vue";
import { Viewer } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  googleTileset,
  initGoogleTileset,
  initMouseHandlers,
  initViewer,
  resetCamera,
  viewer,
} from "./CesiumViewer";
import { initDemo } from "../demo/Demo";

interface Props {
  googleTilesEnabledInitial: boolean;

  // eslint-disable-next-line vue/require-default-prop
  webGLMock?: () => Viewer.ConstructorOptions;
}

const props = withDefaults(defineProps<Props>(), {
  googleTilesEnabledInitial: false,
});

const googleTilesEnabled: Ref<boolean> = ref(props.googleTilesEnabledInitial);

defineExpose({
  googleTilesEnabled,
  toggleGoogleTiles,
});

/**
 * Enable/disable the Google 3D tiles.
 */
function toggleGoogleTiles() {
  if (googleTileset) {
    if (googleTilesEnabled.value) {
      googleTileset.show = true;
      viewer.scene.requestRender();
      viewer.scene.globe.show = false;
      console.log("3D Google tiles enabled");
    } else {
      googleTileset.show = false;
      viewer.scene.globe.show = true;
      viewer.scene.requestRender();
      console.log("3D Google tiles disabled");
    }
  } else {
    console.error("Google Tiles are undefined");
  }
}

onMounted(() => {
  if (!props.webGLMock) initViewer();
  else {
    console.info("Cesium setup using webGL mock");
    initViewer(props.webGLMock as unknown as () => Viewer.ConstructorOptions);
  }

  initMouseHandlers();

  if (googleTilesEnabled.value) {
    console.info("Google Tiles enabled");
    initGoogleTileset();
  }

  initDemo(viewer);

  resetCamera();
});

onUnmounted(() => {
  viewer.entities.removeAll();
  viewer.destroy();
});
</script>

<template>
  <div id="cesiumContainer" />
  <div
    id="toolbar"
    style="background-color: #f0f9ff; border-radius: 5px; padding: 5px"
  >
    <div id="google-tiles">
      <input
        id="google-tiles-checkbox"
        v-model="googleTilesEnabled"
        type="checkbox"
        @change="toggleGoogleTiles"
      />

      <label for="google-tiles-checkbox" style="padding: 5px">
        Show 3D Google tiles
      </label>
    </div>

    <IconCommunity />
  </div>
</template>

<style scoped>
#cesiumContainer {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
