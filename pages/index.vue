<script lang="ts" setup>
import CesiumViewer from "~/components/CesiumViewer.vue";
import DarkToggle from "~/components/DarkToggle.vue";
import DroneMenu from "~/components/DroneMenu.vue";
import DroneRightClickMenu from "~/components/DroneRightClickMenu.vue";
import MainToolbar from "~/components/MainToolbar.vue";
import { cesiumInitialized } from "~/components/CesiumViewerWrapper";
import { Drone } from "~/components/Drone";
import { droneCollection } from "~/components/DroneCollection";
import { UdpOptions } from "~/types/DroneConnectionOptions";

const connectDisconnectRef =
  useTemplateRef<ComponentPublicInstance>("connectDisconnect");

async function connectDisconnect() {
  if (!connectDisconnectRef.value || !connectDisconnectRef.value.$el) {
    showToast("connectDisconnectRef button not found", ToastSeverity.Error);
    return;
  }

  try {
    if (droneCollection.getNumDrones() === 0) {
      const drone = droneCollection.addDrone(new Drone(new UdpOptions()));

      await droneCollection.connectAll();

      showToast(
        `Connected! (sysid: ${drone.sysid}, compid: ${drone.compid})`,
        ToastSeverity.Success,
      );

      connectDisconnectRef.value.$el.textContent = "Disconnect";

      eventBus.emit("droneConnected", drone);
    } else {
      await droneCollection.disconnectAll();
      droneCollection.removeAllDrones();

      showToast("Disconnected!", ToastSeverity.Success);

      connectDisconnectRef.value.$el.textContent = "Connect";

      eventBus.emit("allDronesDisconnected");
    }
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }
  }
}
</script>

<template>
  <div class="h-full w-full bg-black">
    <CesiumViewer />

    <div
      id="toolbarTopLeft"
      style="
        display: flex;
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
        position: absolute;
        top: 5px;
        left: 5px;
      "
    >
      <DarkToggle />
      <Button
        label="Connect"
        @click="connectDisconnect"
        ref="connectDisconnect"
      />

      <div id="demoMenu" />
    </div>

    <DroneRightClickMenu />
    <MainToolbar v-if="cesiumInitialized" id="mainToolbar" />

    <div
      id="toolbarTopRight"
      style="display: flex; gap: 5px; position: absolute; top: 5px; right: 5px"
    ></div>

    <DroneMenu />
  </div>
</template>
