<script lang="ts" setup>
import { defined, Entity, HeadingPitchRange, Math } from "cesium";
import { ref, onMounted } from "vue";
import { eventBus } from "~/utils/Eventbus";
import { droneCollection, DroneEntity } from "~/components/Drone";
import { UdpOptions } from "~/types/DroneConnectionOptions";
import { selectedEntityHighlighter } from "./LeftClickHandler";
import {
  getCesiumViewer,
  trackedEntityHighlighter,
  updateRequestRenderMode,
} from "./CesiumViewerWrapper";
import { Button } from "primevue";

const isMenuOpen = ref(false);
let selectedEntity: any = undefined;

const trackUntrackButtonLabel = ref("Track");
const trackUntrackButtonIcon = ref("pi pi-lock-open");

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
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

function connect() {
  // add a single drone for now
  // droneCollection.addDrone(new DroneEntity(new TcpOptions("127.0.0.1", 55555)));
  droneCollection.addDrone(new DroneEntity(new UdpOptions()));

  droneCollection.connectAll();
}

function disconnect() {
  droneCollection.disconnectAll();

  droneCollection.removeAllDrones();
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
  eventBus.on("cesiumLeftClick", (value: Entity | undefined) =>
    handleCesiumClick(value),
  );
});
</script>

<template>
  <div
    class="menu-wrapper bg-white dark:bg-black"
    :class="{ open: isMenuOpen }"
  >
    <Button class="close-button" @click="toggleMenu">x</Button>
    <div class="menu">
      <Button label="Connect" @click="connect" />
      <Button label="Disconnect" @click="disconnect" />
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
