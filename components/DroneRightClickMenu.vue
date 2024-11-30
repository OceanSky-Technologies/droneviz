<script lang="ts" setup>
import { onMounted } from "vue";
import { eventBus } from "~/utils/Eventbus";
import type { CSSProperties } from "vue";
import { Math, type Cartographic, type Entity } from "cesium";
import { droneCollection } from "./DroneCollection";
import * as egm96 from "egm96-universal";
import FlyToIcon from "@/components/icons/FlyTo.vue";
import ProgressButton from "@/components/ProgressButton.vue";

const visible = ref(false);

const menuPosition = ref({ x: 0, y: 0 });

let coordinates: Cartographic | undefined = undefined;

const popupStyle = computed<CSSProperties>(() => ({
  top: `${menuPosition.value.y}px`,
  left: `${menuPosition.value.x}px`,
}));

async function flyTo() {
  console.log("Fly to clicked");

  if (!coordinates) {
    showToast("Coordinates are null", ToastSeverity.Error);
    closeMenu();
    return;
  }

  const drone = droneCollection.getDrone(0);

  if (!drone) {
    showToast("Drone is not connected", ToastSeverity.Error);
    closeMenu();
    return;
  }

  try {
    await drone.doReposition(
      Math.toDegrees(coordinates.latitude),
      Math.toDegrees(coordinates.longitude),
      coordinates.height,
    );

    showToast(
      `Repositioning drone:\n- latitude: ${coordinates.latitude}\n- longitude: ${coordinates.longitude}\n- height: ${coordinates.height}`,
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

function showMenu(coords: { x: number; y: number }) {
  menuPosition.value = coords;
  visible.value = true;
}

const closeMenu = () => {
  visible.value = false;
};

function handleCesiumRightClick({
  entity,
  position,
  cartographic,
}: {
  entity: Entity | undefined;
  position: { x: number; y: number };
  cartographic: Cartographic;
}) {
  // don't show menu if no drone is selected
  if (!droneCollection.selectedEntity) return;

  // save new gps coordinates
  coordinates = cartographic;

  if (!entity) {
    showMenu({ x: position.x, y: position.y });
  } else {
    closeMenu();
  }
}

function formatCoordinates(coordinate?: number) {
  if (!coordinate) return "unknown";

  // 6 decimal places equal 10 cm resolution. 12 digits are maximum.
  return Math.toDegrees(coordinate).toFixed(6).padStart(12, " ") + "°";
}

function formatHeight(coordinates?: Cartographic) {
  if (!coordinates) return "unknown";

  return (
    egm96
      .meanSeaLevel(
        Math.toDegrees(coordinates.latitude),
        Math.toDegrees(coordinates.longitude),
      )
      .toFixed(2)
      .padStart(12, " ") + "m"
  );
}

onMounted(() => {
  eventBus.on("cesiumRightClick", handleCesiumRightClick);
  eventBus.on("cesiumLeftClick", closeMenu);
  eventBus.on("cesiumCameraMoveStart", closeMenu);

  eventBus.on("droneDisconnected", closeMenu);
  eventBus.on("allDronesDisconnected", closeMenu);
});

onBeforeUnmount(() => {
  eventBus.off("cesiumRightClick", handleCesiumRightClick);
  eventBus.off("cesiumLeftClick", closeMenu);
  eventBus.off("cesiumCameraMoveStart", closeMenu);

  eventBus.off("droneDisconnected", closeMenu);
  eventBus.off("allDronesDisconnected", closeMenu);
});
</script>

<template>
  <transition name="fade-slide">
    <div
      v-if="visible"
      :style="popupStyle"
      class="popup-menu shadow-lg"
      @click.self="closeMenu"
    >
      <!-- Arrow -->
      <div class="popup-arrow"></div>

      <!-- Content -->
      <div style="padding-bottom: 5px">
        <p>
          Latitude:
          {{ formatCoordinates(coordinates?.latitude) }}
        </p>
        <p>
          Longitude:
          {{ formatCoordinates(coordinates?.longitude) }}
        </p>
        <p>Height (MSL): {{ formatHeight(coordinates) }}</p>
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
  border-radius: 5px;
  z-index: 1000;
  padding: 10px;
  background-color: var(--p-content-background);
  border-color: var(--p-content-border-color);
  transform: translate(-50%, 8px);
  transform-origin: top center;
  transition:
    transform 0.2s ease-out,
    opacity 0.2s ease-out;
}

/* Arrow styles */
.popup-arrow {
  position: absolute;
  top: -8px; /* Adjust based on menu placement */
  left: calc(50% - 5px);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 8px solid white;
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
