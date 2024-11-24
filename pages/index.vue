<script lang="ts" setup>
import CesiumViewer from "~/components/CesiumViewer.vue";
import DarkToggle from "~/components/DarkToggle.vue";
import { DroneEntity } from "~/components/Drone";
import Button from "primevue/button";
import type { ComponentPublicInstance } from "vue";
import { TcpOptions, UdpOptions } from "~/types/DroneConnectionOptions";
import { droneCollection } from "~/components/DroneCollection";

const connectDisconnectRef =
  useTemplateRef<ComponentPublicInstance>("connectDisconnect");

async function connectDisconnect() {
  if (!connectDisconnectRef.value || !connectDisconnectRef.value.$el) {
    showToast("connectDisconnectRef button not found", ToastSeverity.Error);
    return;
  }

  try {
    if (droneCollection.getNumDrones() === 0) {
      const drone = droneCollection.addDrone(new DroneEntity(new UdpOptions()));

      await droneCollection.connectAll();

      showToast(
        `Connected! (sysid: ${drone.sysid}, compid: ${drone.compid})`,
        ToastSeverity.Success,
      );

      connectDisconnectRef.value.$el.textContent = "Disconnect";
    } else {
      await droneCollection.disconnectAll();
      droneCollection.removeAllDrones();

      showToast("Disconnected!", ToastSeverity.Success);

      connectDisconnectRef.value.$el.textContent = "Connect";
    }
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }
  }
}

async function arm() {
  if (droneCollection.getNumDrones() === 0) {
    showToast("No drone connected", ToastSeverity.Error);
    return;
  }

  try {
    const drone = droneCollection.getDrone(0);
    await drone.arm();
    showToast("Armed!", ToastSeverity.Info);
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }
  }
}

async function disarm() {
  if (droneCollection.getNumDrones() === 0) {
    showToast("No drone connected", ToastSeverity.Error);
    return;
  }

  try {
    const drone = droneCollection.getDrone(0);
    await drone.disarm();
    showToast("Disarmed!", ToastSeverity.Info);
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }
  }
}

async function takeoff() {
  if (droneCollection.getNumDrones() === 0) {
    showToast("No drone connected", ToastSeverity.Error);
    return;
  }

  try {
    const drone = droneCollection.getDrone(0);
    await drone.takeoff();
    showToast("Takeoff!", ToastSeverity.Info);
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }
  }
}

async function land() {
  if (droneCollection.getNumDrones() === 0) {
    showToast("No drone connected", ToastSeverity.Error);
    return;
  }

  try {
    const drone = droneCollection.getDrone(0);
    await drone.land();
    showToast("Landing!", ToastSeverity.Info);
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }
  }
}

async function autotune() {
  if (droneCollection.getNumDrones() === 0) {
    showToast("No drone connected", ToastSeverity.Error);
    return;
  }

  try {
    const drone = droneCollection.getDrone(0);
    showToast("Autotuning...", ToastSeverity.Info);
    await drone.autotune();
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
      <Button label="Arm" @click="arm" />
      <Button label="Disarm" @click="disarm" />
      <Button label="Takeoff" @click="takeoff" />
      <Button label="Land" @click="land" />
      <Button label="Autotune" @click="autotune" />
      <CameraWindow />

      <div id="demoMenu" />
    </div>

    <div
      id="toolbarTopRight"
      style="display: flex; gap: 5px; position: absolute; top: 5px; right: 5px"
    ></div>
  </div>
</template>
