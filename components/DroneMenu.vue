<script lang="ts" setup>
import { defined, Entity } from "cesium";
import { ref, onMounted } from "vue";
import { eventBus } from "~/utils/Eventbus";
import { selectedEntityHighlighter } from "./LeftClickHandler";
import {
  getCesiumViewer,
  trackedEntityHighlighter,
  updateRequestRenderMode,
} from "./CesiumViewerWrapper";
import { Button } from "primevue";
import { droneCollection } from "./DroneCollection";

const isMenuOpen = ref(false);
let selectedEntity: any = undefined;

const trackUntrackButtonLabel = ref("Track");
const trackUntrackButtonIcon = ref("pi pi-lock-open");

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

function handleCesiumClick(entity: Entity | undefined) {
  selectedEntity = entity;

  if (selectedEntity) {
    if (!selectedEntityHighlighter.contains(selectedEntity))
      isMenuOpen.value = false;
    else isMenuOpen.value = true;
  } else {
    isMenuOpen.value = false;
    selectedEntity = undefined;
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

function trackUntrack() {
  if (!trackUntrackButtonLabel.value) {
    console.log("trackUntrackButton not found.");
    return;
  }
  if (!trackUntrackButtonIcon.value) {
    console.log("trackUntrackButtonIcon not found.");
    return;
  }

  if (!defined(selectedEntity) || !defined(selectedEntity.id)) {
    console.log("No entity selected to track.");

    getCesiumViewer().trackedEntity = undefined;
    trackedEntityHighlighter.clear();
    trackUntrackButtonLabel.value = "Track";
    trackUntrackButtonIcon.value = "pi pi-lock-open";

    getCesiumViewer().scene.requestRender();
    updateRequestRenderMode();

    return;
  }

  console.log("Tracking entity:");
  console.log(selectedEntity);

  if (!trackedEntityHighlighter.contains(selectedEntity)) {
    getCesiumViewer().trackedEntity = selectedEntity.id;
    trackedEntityHighlighter.add(selectedEntity);
    trackUntrackButtonLabel.value = "Untrack";
    trackUntrackButtonIcon.value = "pi pi-lock";
  } else {
    // the same entity was already tracked, so remove tracking
    getCesiumViewer().trackedEntity = undefined;
    trackedEntityHighlighter.clear();
    trackUntrackButtonLabel.value = "Track";
    trackUntrackButtonIcon.value = "pi pi-lock-open";
  }

  getCesiumViewer().scene.requestRender();
  updateRequestRenderMode();
}

onMounted(() => {
  eventBus.on("cesiumLeftClick", handleCesiumClick);
  eventBus.on("droneDisconnected", closeMenu);
  eventBus.on("allDronesDisconnected", closeMenu);
});

onUnmounted(() => {
  eventBus.off("cesiumLeftClick", handleCesiumClick);
  eventBus.off("droneDisconnected", closeMenu);
  eventBus.off("allDronesDisconnected", closeMenu);
});
</script>

<template>
  <div
    class="menu-wrapper bg-white dark:bg-black"
    :class="{ open: isMenuOpen }"
  >
    <Button class="close-button" @click="toggleMenu">x</Button>
    <div class="menu">
      <Button label="Arm" @click="arm" />
      <Button label="Disarm" @click="disarm" />
      <Button label="Takeoff" @click="takeoff" />
      <Button label="Land" @click="land" />
      <Button label="Autotune" @click="autotune" />
      <CameraWindow />
      <Button
        :label="trackUntrackButtonLabel"
        :icon="trackUntrackButtonIcon"
        @click="trackUntrack"
        style="margin-top: auto"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.menu-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 300px;
  transform: translateX(100%); /* Hide by default */
  transition: transform 0.2s ease-in-out;
  z-index: 1000;
  overflow: hidden;
}

.menu-wrapper.open {
  transform: translateX(0); /* Slide in */
}

.menu {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-items: center;
  gap: 10px;
  padding-bottom: 50px;
  height: 100%;
  width: 100%;
  padding: 20px;
}

.close-button {
  /* background: none; */
  border: none;
  font-size: 15px;
  cursor: pointer;
  position: absolute;
  top: 5px;
  right: 5px;
  width: 30px;
  height: 30px;
}
</style>
