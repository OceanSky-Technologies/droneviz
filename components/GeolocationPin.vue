<template>
  <transition name="fade-slide">
    <div
      v-show="visible"
      ref="menu"
      :key="animationKey"
      :style="popupStyle"
      class="popup-menu shadow-lg"
      @dblclick="handleDoubleClick"
    >
      <!-- Content -->
      <div>
        <IcBaselinePerson
          style="font-size: 1.5em; color: var(--p-content-background)"
        />
      </div>

      <!-- Arrow -->
      <div class="popup-arrow"></div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import type { CSSProperties } from "vue";
import { Cartesian3, SceneTransforms, Math as CesiumMath } from "cesium";
import {
  getCesiumViewer,
  waitUntilCesiumInitialized,
} from "./CesiumViewerWrapper";
import { AnimationFrameScheduler } from "~/utils/AnimationFrameScheduler";
import IcBaselinePerson from "~icons/ic/baseline-person";
import { geolocation, updateGeolocation } from "@/core/Geolocation";

const visible = ref(false);
const menu = ref<HTMLElement | null>(null);
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

// remove callbacks for cesium listeners (destroyed when component is unmounted)
const cesiumListenerCbs: (() => void)[] = [];

function updateOverlayPosition() {
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
}

// Watch for changes to geolocation
watch(geolocation, async (newPosition: Cartesian3 | undefined) => {
  if (!newPosition) return;
  visible.value = true;
  positionCartesian = newPosition;
  updateOverlayPosition();
});

onMounted(async () => {
  await waitUntilCesiumInitialized();

  if (geolocation.value) {
    visible.value = true;
    positionCartesian = geolocation.value;
    updateOverlayPosition();
  }

  // Add camera listeners to update the overlay position
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
  // unregister all cesium listeners
  while (cesiumListenerCbs.length > 0) {
    const cb = cesiumListenerCbs.pop();
    if (cb) cb();
  }
  animationFrameScheduler.stop();
});

async function handleDoubleClick() {
  // Example: if you want to fly to the last known position
  if (!positionCartesian) return;

  const viewer = getCesiumViewer();
  if (!viewer) return;

  // Convert cartesian3 to lat/lon/height
  const cartographic =
    viewer.scene.globe.ellipsoid.cartesianToCartographic(positionCartesian);
  const longitude = CesiumMath.toDegrees(cartographic.longitude);
  const latitude = CesiumMath.toDegrees(cartographic.latitude);
  const height = cartographic.height || 400;

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(longitude, latitude, height),
    orientation: {
      heading: CesiumMath.toRadians(0.0),
      pitch: CesiumMath.toRadians(-90.0),
    },
    duration: 1,
    complete: async () => {
      updateGeolocation();
      console.log("Camera flight complete!");
    },
  });
}
</script>

<style scoped lang="postcss">
.popup-menu {
  pointer-events: none; /* Allows events to pass through */
  position: absolute;
  text-align: center;
  white-space: nowrap; /* Prevent text wrapping */
  min-width: max-content; /* Ensure the width accommodates the content */
  min-height: fit-content; /* Ensure the height accommodates the content */
  overflow: visible; /* Prevent clipping */
  border-radius: 10px;
  z-index: 1000;
  padding: 5px;
  background-color: var(--color-dark-blue);
  border-color: var(--p-content-border-color);
  transform: translate(-50%, -100%) translateY(-16px);
  transform-origin: bottom center;
  transition:
    transform 0.2s ease-out,
    opacity 0.2s ease-out;
}

/* Arrow styles */
.popup-arrow {
  pointer-events: none;
  position: absolute;
  bottom: -16px; /* Adjust based on menu placement */
  left: calc(50% - 10px);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 17px solid white;
  z-index: 999;
  border-top-color: var(--color-dark-blue);
}

/* Enable Interaction with Specific Elements */
.popup-menu :is(button, input, select, textarea, a) {
  pointer-events: auto;
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
