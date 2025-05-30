<template>
  <div class="menu-wrapper" :class="{ open: isMenuOpen }">
    <CustomConfirmDialog />

    <Button class="close-button" @click="closeMenu">
      <IcBaselineClose />
    </Button>

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
          <Button label="Arm" severity="danger" @click="arm" />
          <Button label="Disarm" severity="danger" @click="disarm" />
          <Button
            label="Disarm (force)"
            severity="danger"
            @click="disarmForce"
          />
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px">
          <Button label="Takeoff" @click="takeoff" />
          <Button label="Land" @click="land" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px">
          <Button label="Autotune" severity="warn" @click="autotune" />
          <!-- <CameraWindow /> -->
          <Button @click="openVideo">Open Video</Button>
        </div>
      </div>
      <Button
        :label="trackUntrackButtonLabel"
        :icon="trackUntrackButtonIcon"
        @click="trackUntrack"
      />

      <DroneTelemetry style="width: 50%" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defined } from "cesium";
import { ref, onMounted, toRaw, markRaw, watch, onUnmounted } from "vue";
import { eventBus } from "@/utils/Eventbus";
import {
  getCesiumViewer,
  updateRequestRenderMode,
} from "./CesiumViewerWrapper";
import { Button } from "primevue";
import Landing from "@/components/icons/Landing.vue";
import Takeoff from "@/components/icons/Takeoff.vue";
import IcBaselineWarningAmber from "~icons/ic/baseline-warning-amber";
import IcBaselineClose from "~icons/ic/baseline-close";
import DroneTelemetry from "@/components/DroneTelemetry.vue";
import { useConfirm } from "primevue/useconfirm";
import { droneManager } from "~/core/drone/DroneManager";

import { isTauri } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import { DroneCommands } from "../core/drone/DroneCommand";

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

watch(droneManager.selectedDrone, (newValue) => {
  if (newValue) {
    showMenu();
  } else {
    closeMenu();
  }
});

async function arm() {
  if (!droneManager.selectedDrone.value) {
    showToast("No drone selected", ToastSeverity.Error);
    return;
  }

  confirm.require({
    message:
      "Are you sure you want to arm the aircraft?\nPlease ensure the environment is safe, and all pre-flight checks are complete before proceeding.",
    header: "Arming",
    icon: markRaw(IcBaselineWarningAmber) as any,
    rejectLabel: "Cancel",
    acceptLabel: "Arm",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        if (!droneManager.selectedDrone.value) {
          showToast("No drone selected", ToastSeverity.Error);
          return;
        }

        await new DroneCommands(droneManager.selectedDrone.value).arm();
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
  if (!droneManager.selectedDrone.value) {
    showToast("No drone selected", ToastSeverity.Error);
    return;
  }

  confirm.require({
    message: "Are you sure you want to disarm the aircraft?",
    header: "Disarming",
    icon: markRaw(IcBaselineWarningAmber) as any,
    rejectLabel: "Cancel",
    acceptLabel: "Disarm",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        if (!droneManager.selectedDrone.value) {
          showToast("No drone selected", ToastSeverity.Error);
          return;
        }

        await new DroneCommands(droneManager.selectedDrone.value).disarm();
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

async function disarmForce() {
  if (!droneManager.selectedDrone.value) {
    showToast("No drone selected", ToastSeverity.Error);
    return;
  }

  confirm.require({
    message:
      "Are you sure you want to disarm the aircraft?\nDisarming while airborne will cause the aircraft to fall immediately. Proceed only if it is safe to do so.",
    header: "Disarming (force)",
    icon: markRaw(IcBaselineWarningAmber) as any,
    rejectLabel: "Cancel",
    acceptLabel: "Disarm",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        if (!droneManager.selectedDrone.value) {
          showToast("No drone selected", ToastSeverity.Error);
          return;
        }

        await new DroneCommands(droneManager.selectedDrone.value).disarm(true);
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
  if (!droneManager.selectedDrone.value) {
    showToast("No drone selected", ToastSeverity.Error);
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
        if (!droneManager.selectedDrone.value) {
          showToast("No drone selected", ToastSeverity.Error);
          return;
        }

        await new DroneCommands(droneManager.selectedDrone.value).takeoff();
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
  if (!droneManager.selectedDrone.value) {
    showToast("No drone selected", ToastSeverity.Error);
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
        if (!droneManager.selectedDrone.value) {
          showToast("No drone selected", ToastSeverity.Error);
          return;
        }

        await new DroneCommands(droneManager.selectedDrone.value).land();
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
  if (!droneManager.selectedDrone.value) {
    showToast("No drone selected", ToastSeverity.Error);
    return;
  }

  confirm.require({
    message:
      "Are you sure you want to start autotuning the flight controller?\nPlease ensure the aircraft can fly stable enough and you are ready to abort the autotuning process at any time.\nOnce autotuning is complete the aircraft will land automatically.\n\nMore infos: <a href='https://docs.px4.io/main/en/config/autotune_mc.html' target='_blank'>here</a>.",
    header: "Autotune",
    icon: markRaw(IcBaselineWarningAmber) as any,
    rejectLabel: "Cancel",
    acceptLabel: "Start",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        if (!droneManager.selectedDrone.value) {
          showToast("No drone selected", ToastSeverity.Error);
          return;
        }

        showToast("Autotuning...", ToastSeverity.Info);

        await new DroneCommands(droneManager.selectedDrone.value).autotune();
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

  if (!defined(droneManager.selectedDrone.value?.entity)) {
    console.log("No entity selected to track.");

    getCesiumViewer().trackedEntity = undefined;
    trackUntrackButtonLabel.value = "Track";
    trackUntrackButtonIcon.value = "pi pi-lock-open";

    getCesiumViewer().scene.requestRender();
    updateRequestRenderMode();

    return;
  }

  console.log("Tracking drone:");
  console.log(droneManager.selectedDrone.value);

  if (!getCesiumViewer().trackedEntity) {
    getCesiumViewer().trackedEntity = toRaw(
      droneManager.selectedDrone.value?.entity,
    );

    trackUntrackButtonLabel.value = "Untrack";
    trackUntrackButtonIcon.value = "pi pi-lock";
  } else {
    // the same entity was already tracked, so remove tracking
    getCesiumViewer().trackedEntity = undefined;
    trackUntrackButtonLabel.value = "Track";
    trackUntrackButtonIcon.value = "pi pi-lock-open";
  }

  getCesiumViewer().scene.requestRender();
  updateRequestRenderMode();
}

async function openVideo() {
  try {
    if (isTauri()) {
      const webview = new WebviewWindow(
        "/video-ai-" +
          droneManager.selectedDrone.value?.sysId +
          "-" +
          droneManager.selectedDrone.value?.compId,
        {
          url: "/video-ai",
          title: "Droneviz - Video AI",
          width: 1920,
          height: 1080,
          devtools: true,
        },
      );

      webview.once("tauri://error", function (e) {
        if (e.payload && (e.payload as string).includes("already exists")) {
          showToast(
            "Video AI window for this drone is already open",
            ToastSeverity.Info,
          );
        } else {
          showToast(
            "Error opening video window: " + JSON.stringify(e),
            ToastSeverity.Error,
          );
        }
      });
    } else {
      // Browser fallback: Open a new browser tab/window
      const newWindow = window.open(
        "/video-ai",
        "_blank",
        "width=1920,height=1080,resizable",
      );

      if (!newWindow) {
        showToast("Error opening video window", ToastSeverity.Error);
        return;
      }
    }
  } catch (error) {
    showToast("Error opening video window: " + error, ToastSeverity.Error);
  }
}

onMounted(() => {
  eventBus.on("droneDisconnected", closeMenu);
  eventBus.on("allDronesDisconnected", closeMenu);

  if (droneManager.selectedDrone.value) {
    showMenu();
  }
});

onUnmounted(() => {
  eventBus.off("droneDisconnected", closeMenu);
  eventBus.off("allDronesDisconnected", closeMenu);
});
</script>

<style scoped lang="postcss">
.menu-wrapper {
  position: fixed;
  bottom: 0; /* Element is positioned at the bottom but hidden via transform */
  left: 50%;
  width: 900px;
  height: 260px;
  transform: translate(-50%, 100%); /* Start off-screen */
  transition: transform 0.2s ease-in-out; /* Smooth sliding effect */
  z-index: 1000;
  overflow: hidden;
  background-color: var(--p-content-background);
  border: 1px solid var(--p-content-border-color); /* Added solid border syntax */
  border-bottom: 0;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.menu-wrapper.open {
  transform: translate(-50%, 0);
}

.menu {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  width: 100%;
  padding: 10px;
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
