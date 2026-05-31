<template>
  <div v-if="drones.length > 0" id="droneListPanel" class="toolbar">
    <h3 class="drone-list-title">Detected Drones</h3>
    <Button
      v-for="drone in drones"
      :key="drone.key"
      class="drone-list-entry"
      :severity="drone.selected ? 'primary' : 'secondary'"
      @click="selectAndFlyTo(drone)"
    >
      <span class="drone-list-entry-label">
        Drone {{ drone.sysId }}-{{ drone.compId }}
      </span>
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { ref, toRaw, onMounted, onUnmounted } from "vue";
import { Entity, HeadingPitchRange } from "cesium";
import { Button } from "primevue";
import { droneManager } from "~/core/drone/DroneManager";
import { getCesiumViewer } from "@/components/CesiumViewerWrapper";
import { eventBus } from "@/utils/Eventbus";
import { showToast, ToastSeverity } from "@/utils/ToastService";

interface DroneListEntry {
  key: string;
  sysId: number;
  compId: number;
  selected: boolean;
}

const drones = ref<DroneListEntry[]>([]);

let pollInterval: ReturnType<typeof setInterval> | undefined;

/**
 * Refresh the list from the (non-reactive) drone collection. Polled because the
 * underlying drones Map intentionally holds no Vue reactivity.
 */
function refresh() {
  const selectedKey = droneManager.selectedDrone.value
    ? `${droneManager.selectedDrone.value.sysId}-${droneManager.selectedDrone.value.compId}`
    : undefined;

  drones.value = droneManager.allDrones.map((d) => ({
    key: `${d.sysId}-${d.compId}`,
    sysId: d.sysId,
    compId: d.compId,
    selected: `${d.sysId}-${d.compId}` === selectedKey,
  }));
}

/**
 * Select a drone and move the Cesium camera to it.
 * @param {DroneListEntry} entry The clicked list entry.
 */
async function selectAndFlyTo(entry: DroneListEntry) {
  droneManager.selectDrone(entry.sysId, entry.compId);
  refresh();

  const drone = droneManager.connection.getDrone(entry.sysId, entry.compId);
  if (!drone || !(drone.entity instanceof Entity)) {
    showToast("Drone has no position yet", ToastSeverity.Warn);
    return;
  }

  try {
    // Keep the current view angle, just move to the drone.
    const offset = new HeadingPitchRange(
      getCesiumViewer().camera.heading,
      getCesiumViewer().camera.pitch,
      300,
    );
    await getCesiumViewer().flyTo(toRaw(drone.entity), {
      duration: 1.0,
      offset,
    });
    getCesiumViewer().scene.requestRender();
  } catch (e) {
    showToast(
      `Could not move camera to drone: ${e instanceof Error ? e.message : JSON.stringify(e)}`,
      ToastSeverity.Error,
    );
  }
}

/**
 * Clear all entries (hides the panel since it renders only when non-empty).
 */
function clear() {
  drones.value = [];
}

onMounted(() => {
  refresh();
  pollInterval = setInterval(refresh, 1_000);
  eventBus.on("allDronesDisconnected", clear);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
  eventBus.off("allDronesDisconnected", clear);
});
</script>

<style scoped>
#droneListPanel {
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: absolute;
  top: 50%;
  left: 5px;
  transform: translateY(-50%);
  z-index: 500;
  padding: 10px;
  background-color: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: 10px;
  max-height: 80%;
  overflow-y: auto;
}

.drone-list-title {
  margin: 0 0 5px 0;
  font-size: 14px;
  text-align: center;
}

.drone-list-entry {
  min-width: 140px;
}

.drone-list-entry-label {
  white-space: nowrap;
}
</style>
