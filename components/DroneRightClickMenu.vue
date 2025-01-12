<template>
  <transition name="fade-slide">
    <div
      v-show="visible"
      ref="menu"
      :key="animationKey"
      :style="popupStyle"
      class="popup-menu flex flex-col items-center gap-2 shadow-lg"
      @click.self="closeMenu"
    >
      <!-- Content -->
      <div>
        <p>
          {{
            formatCoordinate(
              Cesium.Math.toDegrees(positionCartographic.latitude),
            )
          }},
          {{
            formatCoordinate(
              Cesium.Math.toDegrees(positionCartographic.longitude),
            )
          }}
        </p>
        <p>
          Height (MSL):
          {{ positionCartographic.height.toFixed(2) + "m" }}
        </p>
      </div>

      <!-- Arrow -->
      <div class="popup-arrow"></div>

      <ProgressButton label="Fly here" @click="flyTo">
        <template #icon>
          <FlyToIcon />
        </template>
      </ProgressButton>

      <div
        class="flex w-72 flex-row flex-nowrap items-center justify-center gap-2"
      >
        <ProgressButton label="Orbit" @click="orbit">
          <template #icon>
            <MdiOrbitVariant />
          </template>
        </ProgressButton>

        <InputNumber
          id="radius"
          v-model="radius"
          :min="1"
          :max="1000"
          :step="1"
          mode="decimal"
          suffix=" m"
          show-buttons
          fluid
          style="padding: 0px !important"
        >
          <template #incrementicon>
            <span class="pi pi-plus" style="font-size: 0.6em" />
          </template>
          <template #decrementicon>
            <span class="pi pi-minus" style="font-size: 0.6em" />
          </template>
        </InputNumber>

        <SelectButton
          v-model="orbitDirectionValue"
          style="padding: 0px !important"
          :options="orbitDirectionOptions"
        />
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { eventBus } from "@/utils/Eventbus";
import type { CSSProperties } from "vue";
import * as Cesium from "cesium";
import { droneCollection } from "@/core/DroneCollection";
import FlyToIcon from "@/components/icons/FlyTo.vue";
import ProgressButton from "@/components/ProgressButton.vue";
import InputNumber from "primevue/inputnumber";
import MdiOrbitVariant from "~icons/mdi/orbit-variant";
import SelectButton from "primevue/selectbutton";

import {
  getCesiumViewer,
  waitUntilCesiumInitialized,
} from "./CesiumViewerWrapper";
import { AnimationFrameScheduler } from "~/utils/AnimationFrameScheduler";
import { formatCoordinate } from "~/utils/CoordinateUtils";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import { OrbitYawBehaviour } from "mavlink-mappings/dist/lib/common";

const visible = ref(false);
const orbitDirectionOptions = ref(["CW", "CCW"]);
const orbitDirectionValue = ref("CW");
const radius = ref(10);

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
let positionCartesian: Cesium.Cartesian3;
let positionCartographic: Cesium.Cartographic = new Cesium.Cartographic(); // the height is the drone MSL altitude

// remove callbacks for cesium listeners (destroyed when component is unmounted)
const cesiumListenerCbs: (() => void)[] = [];

const preCheck = () => {
  if (!droneCollection.selectedDrone.value) {
    showToast("Drone is not connected", ToastSeverity.Error);
    closeMenu();
    throw new Error("Drone is not connected");
  }

  if (
    positionCartographic.latitude === 0 &&
    positionCartographic.longitude === 0 &&
    positionCartographic.height === 0
  ) {
    showToast("Invalid coordinates", ToastSeverity.Error);
    closeMenu();
    throw new Error("Invalid coordinates");
  }
};

async function flyTo() {
  preCheck();

  try {
    await droneCollection.selectedDrone.value!.doReposition(
      Cesium.Math.toDegrees(positionCartographic.latitude),
      Cesium.Math.toDegrees(positionCartographic.longitude),
      positionCartographic.height,
    );

    showToast(
      `Repositioning drone:
      - latitude: ${formatCoordinate(Cesium.Math.toDegrees(positionCartographic.latitude))}
      - longitude: ${formatCoordinate(Cesium.Math.toDegrees(positionCartographic.longitude))}
      - height: ${positionCartographic.height.toFixed(2)}m`,
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

async function orbit() {
  preCheck();

  if (!radius.value) {
    showToast("Invalid radius", ToastSeverity.Error);
    closeMenu();
    return;
  }

  if (!orbitDirectionValue.value) {
    showToast("Invalid orbit direction", ToastSeverity.Error);
    closeMenu();
    return;
  }

  try {
    await droneCollection.selectedDrone.value!.doOrbit(
      Cesium.Math.toDegrees(positionCartographic.latitude),
      Cesium.Math.toDegrees(positionCartographic.longitude),
      positionCartographic.height,
      orbitDirectionValue.value === "CCW" ? -1 * radius.value : radius.value,
      OrbitYawBehaviour.HOLD_FRONT_TANGENT_TO_CIRCLE,
      10,
      0,
    );

    showToast(
      `Orbitting position:
      - latitude: ${formatCoordinate(Cesium.Math.toDegrees(positionCartographic.latitude))}
      - longitude: ${formatCoordinate(Cesium.Math.toDegrees(positionCartographic.longitude))}
      - height: ${positionCartographic.height.toFixed(2)}m
      - radius: ${radius.value}m
      - direction: ${orbitDirectionValue.value}`,
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

/**
 *
 */
function showMenu() {
  visible.value = true;
  animationKey.value++;
}

const closeMenu = () => {
  visible.value = false;
};

/**
 *
 */
function handleCesiumRightClick({
  entity,
  cartesian3,
}: {
  entity: Cesium.Entity | undefined;
  cartesian3: Cesium.Cartesian3;
  position: { x: number; y: number };
}) {
  // don't show menu if no drone is selected
  if (!droneCollection.selectedDrone.value) return;

  // right click somewhere on the map (but not on an entity) to show the menu
  if (!entity) {
    // save new gps coordinates of the right clicked location
    positionCartesian = cartesian3;
    positionCartographic = Cesium.Cartographic.fromCartesian(cartesian3);

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

/**
 *
 */
function updateOverlayPosition() {
  if (!getCesiumViewer() || !menu.value || !positionCartesian) return;

  // Convert WGS84 position to screen coordinates
  const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
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
}

onMounted(async () => {
  eventBus.on("cesiumRightClick", handleCesiumRightClick);
  eventBus.on("cesiumLeftClick", closeMenu);

  eventBus.on("droneDisconnected", closeMenu);
  eventBus.on("allDronesDisconnected", closeMenu);

  await waitUntilCesiumInitialized();

  // Add a camera move listeners to update the overlay position
  cesiumListenerCbs.push(
    getCesiumViewer().camera.changed.addEventListener(() => {
      if (visible.value) updateOverlayPosition();
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

<style scoped lang="postcss">
.popup-menu {
  pointer-events: none;
  position: absolute;
  text-align: center;
  white-space: nowrap;
  min-width: max-content;
  min-height: fit-content;
  overflow: visible;
  border-radius: 10px;
  z-index: 1000;
  padding: 10px;
  background-color: var(--p-content-background);
  border-color: var(--p-content-border-color);
  transform: translate(-50%, -100%) translateY(-16px); /* Start above */
  transform-origin: top center; /* Change origin to top for entering from above */
  transition:
    transform 0.2s ease-out,
    opacity 0.2s ease-out;
}

/* Enable Interaction with Specific Elements */
.popup-menu :is(button, input, select, textarea, a) {
  pointer-events: auto;
}

/* Arrow styles */
.popup-arrow {
  position: absolute;
  bottom: -16px; /* Adjust based on menu placement */
  left: calc(50% - 10px);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 17px solid white;
  z-index: 999;
}

/* Adjust dark mode arrow */
.dark .popup-arrow {
  border-top-color: var(--p-content-background);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, -150%); /* Appear from above the element */
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -150%); /* Disappear moving further up */
}
</style>
