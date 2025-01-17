<template>
  <transition name="fade-slide">
    <div
      v-show="visible"
      ref="menu"
      :key="animationKey"
      :class="['popup-menu', isRepositioning ? 'popup-menu-repositioning' : '']"
      :style="popupStyle"
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
          Altitude (MSL):
          {{ altitudeMsl.toFixed(2) }}m
        </p>
      </div>

      <!-- Arrow -->
      <div class="popup-arrow"></div>

      <DroneRightClickMenuActions
        ref="droneRightClickMenuActionsRef"
        :position-cartesian="positionCartesian"
        :position-cartographic="positionCartographic"
        @position-update="overlayPositionTempChange"
        @call-close="closeMenu"
      />
    </div>
  </transition>
</template>

<script lang="ts" setup>
/* ------------- Imports ------------- */
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import type { CSSProperties } from "vue";

import * as Cesium from "cesium";
import { eventBus } from "@/utils/Eventbus";
import DroneRightClickMenuActions from "@/components/DroneRightClickMenuActions.vue";
import { droneManager } from "~/core/drone/DroneManager";
import {
  getCesiumViewer,
  waitUntilCesiumInitialized,
} from "./CesiumViewerWrapper";
import { formatCoordinate } from "~/utils/CoordinateUtils";
import { AnimationFrameScheduler } from "~/utils/AnimationFrameScheduler";
import * as egm96 from "egm96-universal";

/* ------------- State ------------- */
const visible = ref(false);
const menu = ref<HTMLDivElement | null>(null);

/** Tracks the current on-screen pixel position of the menu */
const menuPosition = reactive({ x: 0, y: 0 });

/**
 * When we want a 1-second slide from old to new position,
 * we set this to `true` for that duration
 */
const isRepositioning = ref(false);

const positionCartesian = ref<Cesium.Cartesian3>(Cesium.Cartesian3.ZERO);
const positionCartographic = ref<Cesium.Cartographic>(Cesium.Cartographic.ZERO);
const altitudeMsl = ref(0);

const droneRightClickMenuActionsRef = ref<InstanceType<
  typeof DroneRightClickMenuActions
> | null>(null);

/** Used to force the transition if the menu is already open */
const animationKey = ref(0);

/** We'll store camera move listeners for easy teardown. */
const cesiumListenerCbs: Array<() => void> = [];

/* ------------- Computed ------------- */
const popupStyle = computed<CSSProperties>(() => ({
  top: menuPosition.y + "px",
  left: menuPosition.x + "px",
}));

/** Animation frame scheduler to smoothly track camera moves. */
const animationFrameScheduler = new AnimationFrameScheduler(async () => {
  if (visible.value) updateOverlayPosition();
});

/* ------------- Lifecycle ------------- */
onMounted(async () => {
  // Listen for external events that should open/close the menu
  eventBus.on("cesiumRightClick", handleCesiumRightClick);
  eventBus.on("cesiumLeftClick", closeMenu);
  eventBus.on("droneDisconnected", closeMenu);
  eventBus.on("allDronesDisconnected", closeMenu);

  await waitUntilCesiumInitialized();
  const viewer = getCesiumViewer();
  if (!viewer) return;

  // Add camera move listeners to keep the menu pinned as we move the camera
  cesiumListenerCbs.push(
    viewer.camera.changed.addEventListener(() => {
      if (visible.value) updateOverlayPosition();
    }),
  );
  cesiumListenerCbs.push(
    viewer.camera.moveStart.addEventListener(() => {
      animationFrameScheduler.start();
    }),
  );
  cesiumListenerCbs.push(
    viewer.camera.moveEnd.addEventListener(() => {
      animationFrameScheduler.stop();
      updateOverlayPosition();
    }),
  );
});

onBeforeUnmount(() => {
  // Remove eventBus listeners
  eventBus.off("cesiumRightClick", handleCesiumRightClick);
  eventBus.off("cesiumLeftClick", closeMenu);
  eventBus.off("droneDisconnected", closeMenu);
  eventBus.off("allDronesDisconnected", closeMenu);

  // Remove Cesium camera listeners
  while (cesiumListenerCbs.length) {
    const cb = cesiumListenerCbs.pop();
    if (cb) cb();
  }

  animationFrameScheduler.stop();
});

/* ------------- Methods ------------- */
function showMenu() {
  // Clear any temporary flight trajectories in the child component
  droneRightClickMenuActionsRef.value?.clear();

  visible.value = true;
  animationKey.value++;
}

function closeMenu() {
  visible.value = false;
  droneRightClickMenuActionsRef.value?.clear();
}

/**
 * This is called via an eventBus signal on right-click in Cesium.
 * We only show the menu if there's a selected drone and no entity is under the cursor.
 */
function handleCesiumRightClick({
  entity,
  cartesian3,
}: {
  entity?: Cesium.Entity;
  cartesian3: Cesium.Cartesian3;
}) {
  // If no drone is selected, do nothing.
  if (!droneManager.selectedDrone.value) return;

  // If the user right-clicked empty space (no entity), show the menu
  if (!entity) {
    positionCartesian.value = cartesian3;
    positionCartographic.value = Cesium.Cartographic.fromCartesian(cartesian3);

    // get MSL altitude of the terrain
    altitudeMsl.value = egm96.meanSeaLevel(
      Cesium.Math.toDegrees(positionCartographic.value.latitude),
      Cesium.Math.toDegrees(positionCartographic.value.longitude),
    );

    updateOverlayPosition();
    showMenu();
  } else {
    // Right-clicked some entity => close the menu
    closeMenu();
  }
}

/**
 * Compute the screen (pixel) position of our current "world" location.
 * If it's off-screen, we hide it via offscreen coords for cleanliness.
 */
function updateOverlayPosition() {
  const viewer = getCesiumViewer();
  if (!viewer || !menu.value || !positionCartesian.value) return;

  const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
    viewer.scene,
    positionCartesian.value,
  );

  if (screenPosition) {
    menuPosition.x = screenPosition.x;
    menuPosition.y = screenPosition.y;
  } else {
    // If off-screen, push it out of sight
    menuPosition.x = -9999;
    menuPosition.y = -9999;
  }
}

/**
 * Called by the child component (DroneRightClickMenuActions) when it wants
 * to reposition the menu to a new cartographic coordinate in a *smooth* way.
 */
function overlayPositionTempChange(
  newPosition: Cesium.Cartesian3,
  targetAltitudeMsl: number,
) {
  // Update the altitude
  altitudeMsl.value = targetAltitudeMsl;

  // Convert old pixel location to a local variable for reference
  const oldX = menuPosition.x;
  const oldY = menuPosition.y;

  // Update the underlying cartographic references
  positionCartesian.value = newPosition;
  positionCartographic.value = Cesium.Cartographic.fromCartesian(newPosition);

  // First do a *hard* recompute of the final new position
  updateOverlayPosition();
  const finalX = menuPosition.x;
  const finalY = menuPosition.y;

  // Move us back to the old position *immediately* so that a CSS transition
  // can animate from old -> new over 1s.
  menuPosition.x = oldX;
  menuPosition.y = oldY;

  // Apply the "repositioning" class for 1 second
  isRepositioning.value = true;
  setTimeout(() => {
    isRepositioning.value = false;
  }, 1000);

  // Let Vue update the DOM. The final X/Y will be set on next tick,
  // and because `.popup-menu-repositioning` is active,
  // it will animate from oldX/oldY to finalX/finalY.
  nextTick(() => {
    menuPosition.x = finalX;
    menuPosition.y = finalY;
  });
}
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
  border: 1px solid var(--p-content-border-color);

  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  /* Keep transitions for fade-in/out from the <transition name="fade-slide"> block. */
  transform: translate(-50%, -100%) translateY(-16px);
  transform-origin: top center;
}

/* When we specifically want to animate top/left changes in 1s. */
.popup-menu-repositioning {
  transition:
    top 0.2s ease,
    left 0.2s ease;
}

/* If you want a more dramatic "slide," you can also animate `transform`. */

/* Allow click events on child elements like buttons or inputs */
.popup-menu :is(button, input, select, textarea, a) {
  pointer-events: auto;
}

/* Arrow styles */
.popup-arrow {
  position: absolute;
  bottom: -16px;
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

/* Transition classes for fade-slide */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, -150%);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -150%);
}
</style>
