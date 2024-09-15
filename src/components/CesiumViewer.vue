<script lang="ts" setup>
import IconCommunity from "./icons/IconCommunity.vue";
import { onMounted, onUnmounted, Ref, ref } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { Cartesian3, HeadingPitchRoll, Transforms, Viewer, Math } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  googleTileset,
  initGoogleTileset,
  initMouseHandlers,
  initViewer,
  resetCamera,
  viewer,
} from "./CesiumViewer";
import * as egm96 from "egm96-universal";
import { initDemo } from "../demo/Demo";
import { System } from "../../mavlink-ts/src/System";
import {
  AltitudeResponse,
  AttitudeAngularVelocityBodyResponse,
  DistanceSensorResponse,
  HeadingResponse,
  PositionResponse,
} from "mavlink-ts/protobuf-gen/telemetry/telemetry";

async function run() {
  // create a new drone instance
  console.log("Establishing connection");

  viewer.entities!.getById("aircraft-in-san-francisco")!.model!.scale = 0.1;

  const drone = new System("http://127.0.0.1", 60000);
  drone.telemetry.connect();

  console.log("Reading data");

  let lastAltitudeLocalM = 0;

  let lastHeading = 0;

  drone.telemetry.altitude?.responses.onMessage(
    (altitude: AltitudeResponse) => {
      console.log("New altitude received:\n" + JSON.stringify(altitude));

      lastAltitudeLocalM = altitude!.altitude!.altitudeLocalM!;
    },
  );

  drone.telemetry.position?.responses.onMessage(
    (position: PositionResponse) => {
      // console.log("New position received:\n" + JSON.stringify(position));

      if (position.position) {
        const altitude =
          lastAltitudeLocalM +
          egm96.meanSeaLevel(
            position.position.latitudeDeg,
            position.position.longitudeDeg,
          ) +
          egm96.egm96ToEllipsoid(
            position.position.latitudeDeg,
            position.position.longitudeDeg,
            0,
          );
        console.log(altitude);

        viewer.entities!.getById("aircraft-in-san-francisco")!.position = {
          ...Cartesian3.fromDegrees(
            position.position.longitudeDeg,
            position.position.latitudeDeg,
            altitude,
          ),
        };

        viewer.scene.requestRender();
      }
    },
  );

  drone.telemetry.heading?.responses.onMessage((heading: HeadingResponse) => {
    lastHeading = heading.headingDeg!.headingDeg;
  });

  drone.telemetry.attitudeAngularVelocityBody?.responses.onMessage(
    (attitudeAngularVelocityBody: AttitudeAngularVelocityBodyResponse) => {
      // console.log(
      //   "New attitudeAngularVelocityBody received:\n" +
      //     JSON.stringify(attitudeAngularVelocityBody),
      // );

      if (
        attitudeAngularVelocityBody.attitudeAngularVelocityBody &&
        viewer.entities?.getById("aircraft-in-san-francisco")?.position
      ) {
        viewer.entities!.getById("aircraft-in-san-francisco")!.orientation =
          Transforms.headingPitchRollQuaternion(
            viewer
              .entities!.getById("aircraft-in-san-francisco")!
              .position!.getValue()!,
            new HeadingPitchRoll(
              Math.toRadians(lastHeading + 270),
              // attitudeAngularVelocityBody.attitudeAngularVelocityBody.yawRadS,
              attitudeAngularVelocityBody.attitudeAngularVelocityBody.pitchRadS,
              attitudeAngularVelocityBody.attitudeAngularVelocityBody.rollRadS,
            ),
          );

        viewer.scene.requestRender();
      }
    },
  );

  drone.telemetry.position?.responses.onComplete(() => {
    console.log("Stream complete");
  });

  drone.telemetry.position?.responses.onError((error: Error) => {
    console.log("Stream error: " + error);
  });
}

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

  run();
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
