<script lang="ts" setup>
import IconCommunity from "./icons/IconCommunity.vue";
import { onMounted, onUnmounted, Ref, ref } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { Cartesian3, Viewer } from "cesium";
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
import { System } from "/mavlink-ts/src/System";

// async function run() {
//   // create a new drone instance
//   console.log("Establishing connection");

//   const drone = new System("http://172.27.96.1", 8080);

//   await new Promise((rrr) => {
//     setTimeout(rrr, 1000);
//   });

//   drone.telemetry.connect();

//   await new Promise((rrr) => {
//     setTimeout(rrr, 1000);
//   });

//   console.log("Reading data");

//   // subscribe to telemetry/position data
//   console.log("Subscribing to position data");
//   for await (let position of drone.telemetry.position.responses) {
//     console.log("New data received:\n" + JSON.stringify(position));

//     console.log(position.position.longitudeDeg);

//     console.log("now1");
//     if (position.position.longitudeDeg) {
//       console.log("now2");

//       viewer.entities!.getById("aircraft-in-san-francisco")!.position = {
//         ...Cartesian3.fromDegrees(
//           position.position.longitudeDeg,
//           position.position.latitudeDeg,
//           position.position.absoluteAltitudeM,
//         ),
//       };

//       viewer.scene.requestRender();
//     }
//   }
// drone.telemetry.subscribePosition({
//   dataCallback: (position: any) => {
//     console.log("New data received:\n" + JSON.stringify(position));
//   },
//   statusCallback: (status: any) => {
//     console.log("Connection status changed:\n" + JSON.stringify(status));
//   },
//   errorCallback: (error: any) => {
//     console.error("Connection error occurred:" + JSON.stringify(error));
//   },
//   autoReconnect: true, // automatically reconnect if connection was lost
// });
// wait some time
// await new Promise((rrr) => {
//   setTimeout(rrr, 10000);
// });
// console.log("shutdown");
// drone.disconnectAll();
// }

// run();

interface Props {
  googleTilesEnabledInitial: boolean;

  // eslint-disable-next-line vue/require-default-prop
  webGLMock?: () => Viewer.ConstructorOptions;
}

const props = withDefaults(defineProps<Props>(), {
  googleTilesEnabledInitial: false,
});

const googleTilesEnabled: Ref<boolean> = ref(props.googleTilesEnabledInitial);
const visible = ref(false); // TEST DIALOG
defineExpose({
  googleTilesEnabled,
  toggleGoogleTiles,
  visible, // TEST
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

  // run();
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

    <h1 class="text-3xl font-bold underline">Hello world!</h1>

    <IconCommunity />
    <div id="demoMenu" />

    <!-- TEST -->
    <Button label="Show" @click="visible = true" />

    <Dialog
      v-model:visible="visible"
      modal
      header="Edit Profile"
      :style="{ width: '25rem' }"
    >
      <span class="mb-8·block·text-surface-500·dark:text-surface-400">
        Update your information.
      </span>

      <div class="mb-4 flex items-center gap-4">
        <label for="username" class="w-24 font-semibold">Username</label>
        <InputText id="username" class="flex-auto" autocomplete="off" />
      </div>
      <div class="mb-8 flex items-center gap-4">
        <label for="email" class="w-24 font-semibold">Email</label>
        <InputText id="email" class="flex-auto" autocomplete="off" />
      </div>
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          @click="visible = false"
        ></Button>
        <Button type="button" label="Save" @click="visible = false"></Button>
      </div>
    </Dialog>
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
