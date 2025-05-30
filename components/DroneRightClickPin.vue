<template>
  <transition name="fade-slide">
    <div
      v-show="visible"
      ref="menu"
      :key="animationKey"
      :class="['popup-menu', isRepositioning ? 'popup-menu-repositioning' : '']"
      :style="popupStyle"
      @click.stop="close"
    >
      <IcOutlineInfo style="font-size: 1.5em; color: var(--color-dark-grey)" />

      <!-- Arrow -->
      <div class="popup-arrow"></div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
/* ------------- Imports ------------- */
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import type { CSSProperties } from "vue";
import IcOutlineInfo from "~icons/ic/outline-info";
import * as Cesium from "cesium";
import { eventBus } from "@/utils/Eventbus";
import {
  getCesiumViewer,
  waitUntilCesiumInitialized,
} from "./CesiumViewerWrapper";
import { AnimationFrameScheduler } from "~/utils/AnimationFrameScheduler";

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

/** Used to force the transition if the menu is already open */
const animationKey = ref(0);

/** We'll store camera move listeners for easy teardown. */
const cesiumListenerCbs: Array<() => void> = [];

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
  eventBus.on("droneDisconnected", close);
  eventBus.on("allDronesDisconnected", close);
  eventBus.on("droneRightClickMenu:close", handleCloseSignal);

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
  eventBus.off("droneDisconnected", close);
  eventBus.off("allDronesDisconnected", close);
  eventBus.off("droneRightClickMenu:close", handleCloseSignal);

  // Remove Cesium camera listeners
  while (cesiumListenerCbs.length) {
    const cb = cesiumListenerCbs.pop();
    if (cb) cb();
  }

  animationFrameScheduler.stop();
});

/* ------------- Methods ------------- */

function handleCesiumRightClick({
  cartesian3,
}: {
  entity?: Cesium.Entity;
  cartesian3: Cesium.Cartesian3;
}) {
  positionCartesian.value = cartesian3;
  updateOverlayPosition();
  show();
}

function show() {
  visible.value = true;
  animationKey.value++;
}

function handleCloseSignal() {
  visible.value = false;
}

function close() {
  visible.value = false;

  eventBus.emit("droneRightClickMenu:close");
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
</script>

<style scoped lang="postcss">
.popup-menu {
  position: absolute;
  text-align: center;
  white-space: nowrap;
  min-width: max-content;
  min-height: fit-content;
  overflow: visible;
  border-radius: 10px;
  z-index: 1000;
  padding: 5px;
  background-color: var(--color-gold);
  border: 1px solid var(--color-gold);

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

/* Arrow styles */
.popup-arrow {
  position: absolute;
  bottom: -16px;
  left: calc(50% - 10px);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 17px solid var(--color-gold);
  z-index: 999;
}

/* Adjust dark mode arrow */
.dark .popup-arrow {
  border-top-color: var(--color-gold);
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
