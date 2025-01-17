<template>
  <div class="h-full w-full bg-black">
    <CesiumViewer style="z-index: 0" />

    <!-- Top Left Toolbar -->
    <div id="toolbarTopLeft" class="toolbar">
      <DarkModeToggle />

      <Button
        ref="connectDisconnectRef"
        :label="connectDisconnectText"
        :disabled="connectDisconnectDisabled"
        :severity="
          connectDisconnectText.toLowerCase() === 'disconnect'
            ? 'danger'
            : 'primary'
        "
        @click="handleConnectDisconnect"
      >
        <template #icon>
          <Wifi
            v-if="connectDisconnectText.toLowerCase() === 'connect'"
            ref="connectedIconRef"
            v-rotate
          />
          <WifiOff v-else />
        </template>
      </Button>

      <div>
        <Button @click="clearCache">Clear cache</Button>
        <p>Available cache quota: {{ formatBytes(cacheQuota) }}</p>
        <p>Total cache size: {{ formatBytes(cacheTotalUsed) }}</p>
        <p>Cache usage: {{ cacheUsedPercent.toFixed(2) }}%</p>
        <p>Cache details:</p>
        <div
          v-for="cache in cacheDetails"
          :key="cache.cacheName"
          class="cache-detail"
        >
          <h3>{{ cache.cacheName }}</h3>
          <p>Number of cached requests: {{ cache.requestCount }}</p>
        </div>
      </div>

      <div id="demoMenu" />
    </div>

    <!-- Right Click Menu -->
    <DroneRightClickMenu />

    <!-- Main Toolbar -->
    <MainToolbar v-if="cesiumInitialized" id="mainToolbar" />

    <!-- Top Right Toolbar -->
    <div id="toolbarTopRight" class="toolbar">
      <NetworkIndicator />
      <GeolocationButton />
    </div>

    <!-- Drone Menu -->
    <DroneMenu />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, type ComponentPublicInstance } from "vue";
import {
  cesiumInitialized,
  getCesiumViewer,
  waitUntilCesiumInitialized,
} from "@/components/CesiumViewerWrapper";
import { droneManager } from "~/core/drone/DroneManager";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import { eventBus } from "~/utils/Eventbus";
import {
  getCacheStatistics,
  clearCache,
  type CacheStatistics,
  formatBytes,
} from "~/utils/CacheUtils";
import CesiumViewer from "@/components/CesiumViewer.vue";
import DarkModeToggle from "@/components/DarkModeToggle.vue";
import DroneMenu from "@/components/DroneMenu.vue";
import DroneRightClickMenu from "@/components/DroneRightClickMenu.vue";
import MainToolbar from "@/components/MainToolbar.vue";
import GeolocationButton from "@/components/GeolocationButton.vue";
import NetworkIndicator from "@/components/NetworkIndicator.vue";
import Button from "primevue/button";
import Wifi from "~icons/mdi/wifi";
import WifiOff from "~icons/mdi/wifi-off";

// Reactive state
const cacheQuota = ref(0);
const cacheTotalUsed = ref(0);
const cacheUsedPercent = ref(0);
const cacheDetails = ref<CacheStatistics[]>([]);
const connectDisconnectRef = ref<ComponentPublicInstance | null>(null);
const connectDisconnectDisabled = ref(false);
const connectDisconnectText = ref("Connect");
const connectedIconRef = ref<ComponentPublicInstance | null>(null);

/**
 * Handles connecting and disconnecting from drones.
 */
async function handleConnectDisconnect() {
  if (!connectDisconnectRef.value) {
    showToast("connectDisconnectRef button not found", ToastSeverity.Error);
    return;
  }

  try {
    connectDisconnectDisabled.value = true;

    if (!droneManager.connection.connected) {
      // workaround: force disconnect before connecting to make sure every connection succeeds
      try {
        await droneManager.disconnect(true); // force
        droneManager.destroyAllDrones();
      } catch (e) {}

      showToast("Connecting...", ToastSeverity.Info);
      connectedIconRef.value?.$el.startRotation(true);

      await droneManager.connect();

      connectedIconRef.value?.$el.stopRotation(true);

      // showToast(
      //   `Connected! (sysid: ${drone.sysId}, compid: ${drone.compId})`,
      //   ToastSeverity.Success,
      // );
      // eventBus.emit("droneConnected", drone);

      connectDisconnectText.value = "Disconnect";
    } else {
      await droneManager.disconnect();
      droneManager.destroyAllDrones();

      connectedIconRef.value?.$el.stopRotation();
      connectedIconRef.value?.$el.rotationStopped();

      showToast("Disconnected!", ToastSeverity.Success);
      connectDisconnectText.value = "Connect";

      eventBus.emit("allDronesDisconnected");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : `Unknown error: ${JSON.stringify(error)}`;
    showToast(errorMessage, ToastSeverity.Error);

    // Cleanup on failure
    await droneManager.disconnect(true); // force
    droneManager.destroyAllDrones();
    connectedIconRef.value?.$el.stopRotation();
    connectedIconRef.value?.$el.rotationStopped();
  } finally {
    connectDisconnectDisabled.value = false;
    getCesiumViewer().scene.requestRender();
  }
}

/**
 * Initializes cache statistics and sets up periodic updates.
 */
function initializeCacheStats() {
  const updateCacheStats = async () => {
    try {
      const stats = await getCacheStatistics();
      cacheQuota.value = stats.cacheQuota;
      cacheTotalUsed.value = stats.totalUsedCache;
      cacheUsedPercent.value = stats.cachePercentageUsed;
      cacheDetails.value = stats.cacheDetails;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Unknown error: ${JSON.stringify(error)}`;
      showToast(errorMessage, ToastSeverity.Error);
    }
  };

  // Initial stats load
  updateCacheStats();

  // Periodically refresh cache stats
  setInterval(updateCacheStats, 1_000);
}

// Lifecycle hooks
onMounted(async () => {
  await waitUntilCesiumInitialized();
  initializeCacheStats();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 5px;
  position: absolute;
}

#toolbarTopLeft {
  align-items: flex-start;
  flex-direction: column;
  top: 5px;
  left: 5px;
}

#toolbarTopRight {
  top: 5px;
  right: 5px;
}

.cache-detail {
  border: 1px solid black;
  padding: 5px;
}
</style>
