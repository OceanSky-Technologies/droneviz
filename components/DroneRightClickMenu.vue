<script lang="ts" setup>
import { onMounted } from "vue";
import { eventBus } from "@/utils/Eventbus";
import type { CSSProperties } from "vue";
import {
  Cartesian3,
  Cartographic,
  Math,
  SceneTransforms,
  type Entity,
} from "cesium";
import { droneCollection } from "@/core/DroneCollection";
import FlyToIcon from "@/components/icons/FlyTo.vue";
import ProgressButton from "@/components/ProgressButton.vue";
import {
  getCesiumViewer,
  waitUntilCesiumInitialized,
} from "./CesiumViewerWrapper";

const visible = ref(false);
const menu = ref(null);
const menuPosition = reactive({ x: 0, y: 0 });

const animationKey = ref(0); // Used to force the transition if the menu is already open

// Animation frame scheduler: used to update the overlay position smoothly
const animationFrameScheduler = new AnimationFrameScheduler(async () => {
  if (visible.value) updateOverlayPosition();
});

// computed style for the popup menu
const popupStyle = computed<CSSProperties>(() => ({
  top: `${menuPosition.y}px`,
  left: `${menuPosition.x}px`,
}));

// coordinates of the right-clicked position
let positionCartesian: Cartesian3;
let positionCartographic: Cartographic = new Cartographic(); // the height is the drone MSL altitude

// remove callbacks for cesium listeners (destroyed when component is unmounted)
let cesiumListenerCbs: (() => void)[] = [];

async function flyTo() {
  if (
    positionCartographic.latitude === 0 &&
    positionCartographic.longitude === 0 &&
    positionCartographic.height === 0
  ) {
    showToast("Invalid coordinates", ToastSeverity.Error);
    closeMenu();
    return;
  }

  if (!droneCollection.selectedDrone.value) {
    showToast("Drone is not connected", ToastSeverity.Error);
    closeMenu();
    return;
  }

  try {
    await droneCollection.selectedDrone.value.doReposition(
      Math.toDegrees(positionCartographic.latitude),
      Math.toDegrees(positionCartographic.longitude),
      positionCartographic.height,
    );

    showToast(
      `Repositioning drone:\n- latitude: ${formatCoordinate(Math.toDegrees(positionCartographic.latitude))}\n- longitude: ${formatCoordinate(Math.toDegrees(positionCartographic.longitude))}\n- height: ${positionCartographic.height.toFixed(2)}m`,
      ToastSeverity.Success,
    );
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }
  }
  closeMenu();
}

function showMenu() {
  visible.value = true;
  animationKey.value++;
}

const closeMenu = () => {
  visible.value = false;
};

function handleCesiumRightClick({
  entity,
  cartesian3,
}: {
  entity: Entity | undefined;
  cartesian3: Cartesian3;
  position: { x: number; y: number };
}) {
  // don't show menu if no drone is selected
  if (!droneCollection.selectedDrone.value) return;

  // right click somewhere on the map (but not on an entity) to show the menu
  if (!entity) {
    // save new gps coordinates of the right clicked location
    positionCartesian = cartesian3;
    positionCartographic = Cartographic.fromCartesian(cartesian3);

    // get drone altitude and update the position (height)
    if (!droneCollection.selectedDrone.value) {
      showToast("Drone is not connected", ToastSeverity.Error);
      closeMenu();
      return;
    }

    const currentAltitude =
      droneCollection.selectedDrone.value.lastMessages.altitude;
    if (!currentAltitude || !currentAltitude.message.altitudeAmsl) {
      showToast("Drone altitude is unknown", ToastSeverity.Error);
      closeMenu();
      return;
    }

    positionCartographic.height = currentAltitude.message.altitudeAmsl;

    updateOverlayPosition();

    showMenu();
  } else {
    closeMenu();
  }
}

const updateOverlayPosition = () => {
  if (!getCesiumViewer() || !menu.value || !positionCartesian) return;

  // Convert WGS84 position to screen coordinates
  const screenPosition = SceneTransforms.worldToWindowCoordinates(
    getCesiumViewer().scene,
    positionCartesian,
  );

  if (screenPosition) {
    menuPosition.x = screenPosition.x;
    menuPosition.y = screenPosition.y;
  } else {
    // Hide the overlay if the position is off-screen
    menuPosition.x = -9999;
    menuPosition.y = -9999;
  }
};

onMounted(async () => {
  eventBus.on("cesiumRightClick", handleCesiumRightClick);
  eventBus.on("cesiumLeftClick", closeMenu);

  eventBus.on("droneDisconnected", closeMenu);
  eventBus.on("allDronesDisconnected", closeMenu);

  await waitUntilCesiumInitialized();

  // Add a camera move listeners to update the overlay position
  cesiumListenerCbs.push(
    getCesiumViewer().camera.changed.addEventListener(() => {
      if (visible.value) updateOverlayPosition;
    }),
  );
  cesiumListenerCbs.push(
    getCesiumViewer().camera.moveStart.addEventListener(() => {
      animationFrameScheduler.start();
    }),
  );
  cesiumListenerCbs.push(
    getCesiumViewer().camera.moveEnd.addEventListener(() => {
      animationFrameScheduler.stop();
      updateOverlayPosition();
    }),
  );
});

onBeforeUnmount(() => {
  eventBus.off("cesiumRightClick", handleCesiumRightClick);
  eventBus.off("cesiumLeftClick", closeMenu);

  eventBus.off("droneDisconnected", closeMenu);
  eventBus.off("allDronesDisconnected", closeMenu);

  // unregister all cesium listeners
  while (cesiumListenerCbs.length > 0) {
    const cb = cesiumListenerCbs.pop();
    if (cb) cb();
  }

  animationFrameScheduler.stop();
});
</script>

<template>
  <transition name="fade-slide">
    <div
      v-show="visible"
      ref="menu"
      :style="popupStyle"
      :key="animationKey"
      class="popup-menu shadow-lg"
      @click.self="closeMenu"
    >
      <!-- Arrow -->
      <div class="popup-arrow"></div>

      <!-- Content -->
      <div style="padding-bottom: 5px">
        <p>
          Latitude:
          {{ formatCoordinate(Math.toDegrees(positionCartographic.latitude)) }}
        </p>
        <p>
          Longitude:
          {{ formatCoordinate(Math.toDegrees(positionCartographic.longitude)) }}
        </p>
        <p>
          Height (MSL):
          {{ positionCartographic.height.toFixed(2) + "m" }}
        </p>
      </div>

      <ProgressButton label="Fly to this location" @click="flyTo">
        <template #icon>
          <FlyToIcon />
        </template>
      </ProgressButton>
    </div>
  </transition>
</template>

<style scoped lang="postcss">
.popup-menu {
  position: absolute;
  text-align: center;
  white-space: nowrap; /* Prevent text wrapping */
  min-width: max-content; /* Ensure the width accommodates the content */
  min-height: fit-content; /* Ensure the height accommodates the content */
  overflow: visible; /* Prevent clipping */
  border-radius: 10px;
  z-index: 1000;
  padding: 10px;
  background-color: var(--p-content-background);
  border-color: var(--p-content-border-color);
  transform: translate(-50%, 16px);
  transform-origin: top center;
  transition:
    transform 0.2s ease-out,
    opacity 0.2s ease-out;
}

/* Arrow styles */
.popup-arrow {
  position: absolute;
  top: -16px; /* Adjust based on menu placement */
  left: calc(50% - 10px);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 16px solid white;
  z-index: 999;
}

/* Adjust dark mode arrow */
.dark .popup-arrow {
  border-bottom-color: var(--p-content-background);
}

/* Fade and slide animation */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, -10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
