<template>
  <div class="h-full w-full bg-black">
    <CesiumViewer />

    <div
      id="toolbarTopLeft"
      style="
        display: flex;
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
        position: absolute;
        top: 5px;
        left: 5px;
      "
    >
      <DarkModeToggle />

      <Button
        :label="connectDisconnectText"
        :disabled="connectDisconnectDisabled"
        @click="connectDisconnect"
        ref="connectDisconnectRef"
        :severity="
          connectDisconnectText.toLowerCase() === 'disconnect'
            ? 'danger'
            : 'primary'
        "
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
        <p>
          Cache usage:
          {{ (Math.round(cacheUsedPercent * 100) / 100).toFixed(2) }}%
        </p>
        <p>Cache details:</p>
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
    >
      <NetworkIndicator />

      <Button @click="flyToGeolocation">
        <IcOutlinePersonPinCircle ref="geolocationIconRef" v-rotate />
      </Button>
    </div>

    <DroneMenu />
  </div>
</template>

<script lang="ts" setup>
import CesiumViewer from "@/components/CesiumViewer.vue";
import DarkModeToggle from "@/components/DarkModeToggle.vue";
import DroneMenu from "@/components/DroneMenu.vue";
import DroneRightClickMenu from "@/components/DroneRightClickMenu.vue";
import MainToolbar from "@/components/MainToolbar.vue";
import NetworkIndicator from "@/components/NetworkIndicator.vue";
import {
  cesiumInitialized,
  getCesiumViewer,
} from "@/components/CesiumViewerWrapper";
import Button from "primevue/button";
import { Drone } from "@/core/Drone";
import { droneCollection } from "@/core/DroneCollection";
import { SerialOptions, UdpOptions } from "@/types/DroneConnectionOptions";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import { onMounted, ref, type ComponentPublicInstance } from "vue";
import { eventBus } from "~/utils/Eventbus";
import {
  getCacheStatistics,
  clearCache,
  type CacheStatistics,
  formatBytes,
} from "~/utils/CacheUtils";
import { Cartesian3, Math as CesiumMath } from "cesium";
import { getGeolocationAsync } from "~/core/Geolocation";
import { updateEgoPosition } from "~/core/EgoPosition";
import Wifi from "~icons/mdi/wifi";
import WifiOff from "~icons/mdi/wifi-off";
import IcOutlinePersonPinCircle from "~icons/ic/outline-person-pin-circle";

const cacheQuota = ref(0);
const cacheTotalUsed = ref(0);
const cacheUsedPercent = ref(0);
const cacheDetails = ref<CacheStatistics[]>([]);

const connectDisconnectRef = ref("connectDisconnectRef");
const connectDisconnectDisabled = ref(false);
const connectDisconnectText = ref("Connect");
const connectedIconRef = ref<ComponentPublicInstance | null>(null);

const geolocationIconRef = ref<ComponentPublicInstance | null>(null);

async function connectDisconnect() {
  if (!connectDisconnectRef.value) {
    showToast("connectDisconnectRef button not found", ToastSeverity.Error);
    return;
  }

  try {
    connectDisconnectDisabled.value = true;

    if (droneCollection.getNumDrones() === 0) {
      showToast(`Connecting ...`, ToastSeverity.Info);
      connectedIconRef.value?.$el.startRotation(true);

      const drone = droneCollection.addDrone(new Drone(new UdpOptions()));
      // const drone = droneCollection.addDrone(
      //   new Drone(new SerialOptions("COM3", 57600)),
      // );

      await droneCollection.connectAll();

      await connectedIconRef.value?.$el.stopRotation(true);

      showToast(
        `Connected! (sysid: ${drone.getSysId()}, compid: ${drone.getCompId()})`,
        ToastSeverity.Success,
      );

      connectDisconnectText.value = "Disconnect";

      eventBus.emit("droneConnected", drone);
      connectDisconnectDisabled.value = false;
    } else {
      await droneCollection.disconnectAll();
      droneCollection.removeAllDrones();

      await connectedIconRef.value?.$el.stopRotation();
      await connectedIconRef.value?.$el.rotationStopped();

      showToast("Disconnected!", ToastSeverity.Success);

      connectDisconnectText.value = "Connect";

      eventBus.emit("allDronesDisconnected");
      connectDisconnectDisabled.value = false;
    }
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }

    connectDisconnectDisabled.value = false;
    droneCollection.disconnectAll();
    droneCollection.removeAllDrones();

    await connectedIconRef.value?.$el.stopRotation();
    await connectedIconRef.value?.$el.rotationStopped();
  }

  getCesiumViewer().scene.requestRender();
}

onMounted(() => {
  flyToGeolocation();

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

async function flyToGeolocation() {
  try {
    geolocationIconRef.value?.$el.startRotation(true);
    const position = await getGeolocationAsync();

    showToast("Camera moving to ego position.", ToastSeverity.Info);

    getCesiumViewer().camera.flyTo({
      destination: Cartesian3.fromDegrees(
        position.coords.longitude,
        position.coords.latitude,
        400,
      ),
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: CesiumMath.toRadians(-90.0),
      },
      duration: 1,
      cancel: async () => {
        await geolocationIconRef.value?.$el.stopRotation();
        await geolocationIconRef.value?.$el.rotationStopped();
        updateEgoPosition(position, true);
      },
      complete: async () => {
        await geolocationIconRef.value?.$el.stopRotation();
        await geolocationIconRef.value?.$el.rotationStopped();
        updateEgoPosition(position, true);
      },
    });
  } catch (e) {
    if (e instanceof Error) {
      showToast(
        `Could not retrieve geolocation: ${e.message}`,
        ToastSeverity.Error,
      );
    } else {
      showToast(
        `Could not retrieve geolocation: : ${JSON.stringify(e)}`,
        ToastSeverity.Error,
      );
    }
    await geolocationIconRef.value?.$el.stopRotation();
    await geolocationIconRef.value?.$el.rotationStopped();
  }
}
</script>
