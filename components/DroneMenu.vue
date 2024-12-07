<script lang="ts" setup>
import { defined } from "cesium";
import { ref, onMounted } from "vue";
import { eventBus } from "~/utils/Eventbus";
import {
  getCesiumViewer,
  trackedEntityHighlighter,
  updateRequestRenderMode,
} from "./CesiumViewerWrapper";
import { Button } from "primevue";
import Landing from "@/components/icons/Landing.vue";
import Takeoff from "@/components/icons/Takeoff.vue";
import Warning from "@/components/icons/Warning.vue";
import { useConfirm } from "primevue/useconfirm";
import { droneCollection } from "@/core/DroneCollection";

const confirm = useConfirm();

const isMenuOpen = ref(false);

const trackUntrackButtonLabel = ref("Track");
const trackUntrackButtonIcon = ref("pi pi-lock-open");

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function showMenu() {
  isMenuOpen.value = true;
}

function closeMenu() {
  isMenuOpen.value = false;
}

watch(droneCollection.selectedEntity, (newValue) => {
  if (newValue) {
    showMenu();
  } else {
    closeMenu();
  }
});

async function arm() {
  if (droneCollection.getNumDrones() === 0) {
    showToast("No drone connected", ToastSeverity.Error);
    return;
  }

  confirm.require({
    message:
      "Are you sure you want to arm the aircraft?\nPlease ensure the environment is safe, and all pre-flight checks are complete before proceeding.",
    header: "Arming",
    icon: markRaw(Warning) as any,
    rejectLabel: "Cancel",
    acceptLabel: "Arm",
    acceptClass: "p-button-danger",
    accept: async () => {
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
    },
  });
}

async function disarm() {
  if (droneCollection.getNumDrones() === 0) {
    showToast("No drone connected", ToastSeverity.Error);
    return;
  }

  confirm.require({
    message:
      "Are you sure you want to disarm the aircraft?\nDisarming while airborne will cause the aircraft to fall immediately. Proceed only if it is safe to do so.",
    header: "Disarming",
    icon: markRaw(Warning) as any,
    rejectLabel: "Cancel",
    acceptLabel: "Disarm",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        const drone = droneCollection.getDrone(0);
        await drone.disarm(true);
        showToast("Disarmed!", ToastSeverity.Info);
      } catch (e) {
        if (e instanceof Error) {
          showToast(e.message, ToastSeverity.Error);
        } else {
          showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
        }
      }
    },
  });
}

async function takeoff() {
  if (droneCollection.getNumDrones() === 0) {
    showToast("No drone connected", ToastSeverity.Error);
    return;
  }

  confirm.require({
    message: "Ensure that the takeoff area is clear.",
    header: "Takeoff",
    icon: markRaw(Takeoff) as any,
    rejectLabel: "Cancel",
    acceptLabel: "Takeoff",
    acceptClass: "p-button-success",
    accept: async () => {
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
    },
  });
}

async function land() {
  if (droneCollection.getNumDrones() === 0) {
    showToast("No drone connected", ToastSeverity.Error);
    return;
  }

  confirm.require({
    message: "Confirm that the landing area is safe and clear of obstacles.",
    header: "Land",
    icon: markRaw(Landing) as any,
    rejectLabel: "Cancel",
    acceptLabel: "Land",
    acceptClass: "p-button-success",
    accept: async () => {
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
    },
  });
}

async function autotune() {
  if (droneCollection.getNumDrones() === 0) {
    showToast("No drone connected", ToastSeverity.Error);
    return;
  }

  confirm.require({
    message:
      "Are you sure you want to start autotuning the flight controller?\nPlease ensure the aircraft can fly stable enough and you are ready to abort the autotuning process at any time.\nOnce autotuning is complete the aircraft will land automatically.\n\nMore infos: <a href='https://docs.px4.io/main/en/config/autotune_mc.html' target='_blank'>here</a>.",
    header: "Autotune",
    icon: markRaw(Warning) as any,
    rejectLabel: "Cancel",
    acceptLabel: "Start",
    acceptClass: "p-button-danger",
    accept: async () => {
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
    },
  });
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

  if (
    !defined(droneCollection.selectedEntity) ||
    !defined(droneCollection.selectedEntity.value)
  ) {
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
  console.log(droneCollection.selectedEntity.value);

  if (
    !trackedEntityHighlighter.contains(droneCollection.selectedEntity.value)
  ) {
    getCesiumViewer().trackedEntity = toRaw(
      droneCollection.selectedEntity.value.id,
    );

    trackedEntityHighlighter.add(droneCollection.selectedEntity.value);
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
  eventBus.on("droneDisconnected", closeMenu);
  eventBus.on("allDronesDisconnected", closeMenu);
});

onUnmounted(() => {
  eventBus.off("droneDisconnected", closeMenu);
  eventBus.off("allDronesDisconnected", closeMenu);
});
</script>

<template>
  <div class="menu-wrapper" :class="{ open: isMenuOpen }">
    <CustomConfirmDialog />

    <Button class="close-button" @click="toggleMenu">x</Button>
    <div class="menu">
      <div
        style="
          display: flex;
          flex-direction: row;
          gap: 10px;
          align-items: flex-start;
        "
      >
        <div style="display: flex; flex-direction: column; gap: 10px">
          <Button label="Arm" @click="arm" severity="danger" />
          <Button label="Disarm" @click="disarm" severity="danger" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px">
          <Button label="Takeoff" @click="takeoff" />
          <Button label="Land" @click="land" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px">
          <Button label="Autotune" @click="autotune" severity="warn" />
          <CameraWindow />
        </div>
      </div>
      <Button
        :label="trackUntrackButtonLabel"
        :icon="trackUntrackButtonIcon"
        @click="trackUntrack"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.menu-wrapper {
  position: fixed;
  bottom: 0; /* Element is positioned at the bottom but hidden via transform */
  left: 0;
  height: 300px;
  width: 100%;
  transform: translateY(100%); /* Start off-screen */
  transition: transform 0.2s ease-in-out; /* Smooth sliding effect */
  z-index: 1000;
  overflow: hidden;
  background-color: var(--p-content-background);
  border: 1px solid var(--p-content-border-color); /* Added solid border syntax */
}

.menu-wrapper.open {
  transform: translateY(0); /* Slide in */
}

.menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
