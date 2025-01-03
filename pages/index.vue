<script lang="ts" setup>
import CesiumViewer from "@/components/CesiumViewer.vue";
import DarkModeToggle from "@/components/DarkModeToggle.vue";
import DroneMenu from "@/components/DroneMenu.vue";
import DroneRightClickMenu from "@/components/DroneRightClickMenu.vue";
import MainToolbar from "@/components/MainToolbar.vue";
import { cesiumInitialized } from "@/components/CesiumViewerWrapper";
import { Drone } from "@/core/Drone";
import { droneCollection } from "@/core/DroneCollection";
import { SerialOptions, UdpOptions } from "@/types/DroneConnectionOptions";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import { useTemplateRef, type ComponentPublicInstance, onMounted } from "vue";
import { eventBus } from "~/utils/Eventbus";
import { getCacheStatistics, clearCache } from "~/utils/cache-utils";

const cacheQuota = ref(0);
const cacheTotalUsed = ref(0);
const cacheUsedPercent = ref(0);
const cacheDetails = ref<CacheStatistics[]>([]);

const connectDisconnectRef =
  useTemplateRef<ComponentPublicInstance>("connectDisconnect");

async function connectDisconnect() {
  if (!connectDisconnectRef.value || !connectDisconnectRef.value.$el) {
    showToast("connectDisconnectRef button not found", ToastSeverity.Error);
    return;
  }

  try {
    connectDisconnectRef.value.$el.disabled = true;

    if (droneCollection.getNumDrones() === 0) {
      showToast(`Connecting ...`, ToastSeverity.Info);

      const drone = droneCollection.addDrone(new Drone(new UdpOptions()));
      // const drone = droneCollection.addDrone(
      //   new Drone(new SerialOptions("COM3", 57600)),
      // );

      await droneCollection.connectAll();

      showToast(
        `Connected! (sysid: ${drone.getSysId()}, compid: ${drone.getCompId()})`,
        ToastSeverity.Success,
      );

      connectDisconnectRef.value.$el.textContent = "Disconnect";

      eventBus.emit("droneConnected", drone);
      connectDisconnectRef.value.$el.disabled = false;
    } else {
      await droneCollection.disconnectAll();
      droneCollection.removeAllDrones();

      showToast("Disconnected!", ToastSeverity.Success);

      connectDisconnectRef.value.$el.textContent = "Connect";

      eventBus.emit("allDronesDisconnected");
      connectDisconnectRef.value.$el.disabled = false;
    }
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }

    connectDisconnectRef.value.$el.disabled = false;
    droneCollection.disconnectAll();
    droneCollection.removeAllDrones();
  }
}

onMounted(() => {
  try {
    getCacheStatistics().then((stats) => {
      cacheQuota.value = stats.cacheQuota;
      cacheTotalUsed.value = stats.totalUsedCache;
      cacheUsedPercent.value = stats.cachePercentageUsed;
      cacheDetails.value = stats.cacheDetails;
    });

    // refresh stats every second
    setInterval(() => {
      getCacheStatistics().then((stats) => {
        cacheQuota.value = stats.cacheQuota;
        cacheTotalUsed.value = stats.totalUsedCache;
        cacheUsedPercent.value = stats.cachePercentageUsed;
        cacheDetails.value = stats.cacheDetails;
      });
    }, 1_000);
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }
  }
});
</script>

<template>
  <div class="h-full w-full bg-black">
    <CesiumViewer />

    <div
      id="toolbarTopLeft"
      style="
        display: flex;
        align-items: flex-start;
        flex-direction: row;
        gap: 5px;
        position: absolute;
        top: 5px;
        left: 5px;
      "
    >
      <DarkModeToggle />
      <Button
        label="Connect"
        @click="connectDisconnect"
        ref="connectDisconnect"
      />

      <div>
        <button @click="clearCache">Clear cache</button>
        <p>Available cache quota: {{ formatBytes(cacheQuota) }}</p>
        <p>Total cache size: {{ formatBytes(cacheTotalUsed) }}</p>
        <p>
          Cache usage:
          {{ (Math.round(cacheUsedPercent * 100) / 100).toFixed(2) }}%
        </p>

        <div
          v-for="cache in cacheDetails"
          :key="cache.cacheName"
          style="border: 1px solid black"
        >
          <h3>{{ cache.cacheName }}</h3>
          <p>Number of cached requests: {{ cache.requestCount }}</p>
        </div>
      </div>

      <div id="demoMenu" />
    </div>

    <DroneRightClickMenu />
    <MainToolbar v-if="cesiumInitialized" id="mainToolbar" />

    <div
      id="toolbarTopRight"
      style="display: flex; gap: 5px; position: absolute; top: 5px; right: 5px"
    ></div>

    <DroneMenu />
  </div>
</template>
