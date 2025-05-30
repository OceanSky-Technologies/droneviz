<!-- DroneRightClickMenu.vue -->
<template>
  <!-- Slide in from the right side -->
  <transition name="slide-from-right">
    <div v-if="visible" class="drone-actions-panel">
      <Button class="close-button" @click="close">
        <IcBaselineClose />
      </Button>

      <!-- Content -->
      <div>
        <p>
          Lat:
          {{
            positionCartographic
              ? formatCoordinate(
                  Cesium.Math.toDegrees(positionCartographic.latitude),
                )
              : "N/A"
          }}
        </p>
        <p>
          Lon:
          {{
            positionCartographic
              ? formatCoordinate(
                  Cesium.Math.toDegrees(positionCartographic.longitude),
                )
              : "N/A"
          }}
        </p>
        <p>
          Alt (MSL):
          {{
            positionAltitudeMsl ? positionAltitudeMsl.toFixed(2) + "m" : "N/A"
          }}
        </p>
      </div>

      <!-- The actual DroneRightClickMenuActions content here -->
      <transition name="collapse-fade">
        <div v-if="droneManager.selectedDrone.value" class="actions-collapse">
          <DroneRightClickMenuActions
            v-if="droneManager.selectedDrone.value"
            ref="droneRightClickMenuActions"
            :position-cartesian="positionCartesian"
            :position-cartographic="positionCartographic"
          />
        </div>
      </transition>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { eventBus } from "@/utils/Eventbus";
import * as Cesium from "cesium";
import DroneRightClickMenuActions from "@/components/DroneRightClickMenuActions.vue";
import { formatCoordinate } from "~/utils/CoordinateUtils";
import * as egm96 from "egm96-universal";
import { droneManager } from "~/core/drone/DroneManager";
import IcBaselineClose from "~icons/ic/baseline-close";

// Local state to show/hide the panel
const visible = ref(false);

const droneRightClickMenuActions = ref<InstanceType<
  typeof DroneRightClickMenuActions
> | null>(null);

// We store the same values that are passed from DroneRightClickMenu
const positionCartesian: Ref<Cesium.Cartesian3 | undefined> = ref(undefined);
const positionCartographic: Ref<Cesium.Cartographic | undefined> =
  ref(undefined);
const positionAltitudeMsl: Ref<number | undefined> = ref(undefined);

function show() {
  visible.value = true;

  // clear on open ensures that if it's already open and we right-click again,
  // the menu is refreshed
  droneRightClickMenuActions.value?.clear();
}

function handleCloseSignal() {
  visible.value = false;
}

function close() {
  visible.value = false;

  droneRightClickMenuActions.value?.clear();

  eventBus.emit("droneRightClickMenu:close");
}

function handleCesiumRightClick({
  cartesian3,
}: {
  entity?: Cesium.Entity;
  cartesian3: Cesium.Cartesian3;
}) {
  positionCartesian.value = cartesian3;
  positionCartographic.value = Cesium.Cartographic.fromCartesian(cartesian3);

  // get MSL altitude of the terrain
  positionAltitudeMsl.value = egm96.ellipsoidToEgm96(
    Cesium.Math.toDegrees(positionCartographic.value.latitude),
    Cesium.Math.toDegrees(positionCartographic.value.longitude),
    positionCartographic.value.height,
  );

  show();
}

onMounted(() => {
  eventBus.on("cesiumRightClick", handleCesiumRightClick);
  eventBus.on("droneDisconnected", close);
  eventBus.on("allDronesDisconnected", close);
  eventBus.on("droneRightClickMenu:close", handleCloseSignal);
});

onBeforeUnmount(() => {
  eventBus.off("cesiumRightClick", handleCesiumRightClick);
  eventBus.off("droneDisconnected", close);
  eventBus.off("allDronesDisconnected", close);
  eventBus.off("droneRightClickMenu:close", handleCloseSignal);
});
</script>

<style scoped lang="postcss">
.drone-actions-panel {
  position: fixed;
  top: 50%;
  right: 0;
  width: 250px;
  transform: translateY(-50%); /* Start off-screen */
  background-color: var(--p-content-background);
  border: 1px solid var(--p-content-border-color); /* Added solid border syntax */
  border-right: 0;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  z-index: 1000;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

/* Transition to slide in/out from the right side */
.slide-from-right-enter-active,
.slide-from-right-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.slide-from-right-enter-from {
  transform: translate(100%, -50%);
  opacity: 0;
}
.slide-from-right-leave-to {
  transform: translate(100%, -50%);
  opacity: 0;
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

/* collapse the actions panel when no drone is selected */
.actions-collapse {
  /* Hide overflow so we can "clip" by max-height */
  overflow: hidden;
}

/* Run the transitions over 0.3s, adjust to taste */
.collapse-fade-enter-active,
.collapse-fade-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
}

/* Starting/ending states */
.collapse-fade-enter-from,
.collapse-fade-leave-to {
  max-height: 0;
  opacity: 0;
}
.collapse-fade-enter-to,
.collapse-fade-leave-from {
  /* Pick a max-height safely larger than your content's height */
  max-height: 200px;
  opacity: 1;
}
</style>
