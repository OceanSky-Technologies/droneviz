<script lang="ts" setup>
import CesiumViewer from "@/components/CesiumViewer.vue";
import DarkToggle from "@/components/DarkToggle.vue";
import DroneMenu from "@/components/DroneMenu.vue";
import DroneRightClickMenu from "@/components/DroneRightClickMenu.vue";
import MainToolbar from "@/components/MainToolbar.vue";
import { cesiumInitialized } from "@/components/CesiumViewerWrapper";
import { Drone } from "@/core/Drone";
import { droneCollection } from "@/core/DroneCollection";
import { SerialOptions, UdpOptions } from "@/types/DroneConnectionOptions";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import { useTemplateRef, type ComponentPublicInstance } from "vue";
import { eventBus } from "~/utils/Eventbus";

const connectDisconnectRef =
  useTemplateRef<ComponentPublicInstance>("connectDisconnect");

async function connectDisconnect() {
  if (!connectDisconnectRef.value || !connectDisconnectRef.value.$el) {
    showToast("connectDisconnectRef button not found", ToastSeverity.Error);
    return;
  }

  try {
    connectDisconnectRef.value.$el.disabled = true;

    if (droneCollection.getNumDrones() === 0) {
      showToast(`Connecting ...`, ToastSeverity.Info);

      const drone = droneCollection.addDrone(new Drone(new UdpOptions()));
      // const drone = droneCollection.addDrone(
      //   new Drone(new SerialOptions("COM3", 57600)),
      // );

      await droneCollection.connectAll();

      showToast(
        `Connected! (sysid: ${drone.getSysId()}, compid: ${drone.getCompId()})`,
        ToastSeverity.Success,
      );

      connectDisconnectRef.value.$el.textContent = "Disconnect";

      eventBus.emit("droneConnected", drone);
      connectDisconnectRef.value.$el.disabled = false;
    } else {
      await droneCollection.disconnectAll();
      droneCollection.removeAllDrones();

      showToast("Disconnected!", ToastSeverity.Success);

      connectDisconnectRef.value.$el.textContent = "Connect";

      eventBus.emit("allDronesDisconnected");
      connectDisconnectRef.value.$el.disabled = false;
    }
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }

    connectDisconnectRef.value.$el.disabled = false;
    droneCollection.disconnectAll();
    droneCollection.removeAllDrones();
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
        flex-direction: row;
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
