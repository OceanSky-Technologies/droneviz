<template>
  <Button
    v-tooltip.bottom="tooltip"
    :severity="buttonSeverity"
    @click="checkWebsitesButtonClick"
  >
    <div class="icon-wrapper">
      <div class="icon-container">
        <MaterialSymbolsGlobe
          ref="networkIndicatorIconRef"
          v-rotate
          class="icon"
        />
      </div>
    </div>
  </Button>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";

import Button from "primevue/button";
import MaterialSymbolsGlobe from "~icons/material-symbols/globe";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import {
  getCesiumViewer,
  googleTileset,
  initGoogleTileset,
  tilesetMock,
} from "./CesiumViewerWrapper";
import { updateGeolocation } from "~/core/Geolocation";

const buttonSeverity = ref("danger");

const cesiumReachable = ref(false);
const cesiumDataMightNeedRefresh = ref(false);

const statusMessage = ref("Checking online connectivity...");
const tooltip = computed(() => {
  return statusMessage.value + " Click to refresh.";
});

const networkIndicatorIconRef = ref<ComponentPublicInstance | null>(null);

const checkReachability = async (url: string): Promise<boolean> => {
  try {
    // Use fetch to ping the target URL
    const response = await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      signal: AbortSignal.timeout(5000), // timeout
    });
    return response.ok || response.type === "opaque"; // Handle no-cors responses
  } catch {
    return false;
  }
};

const refreshCesiumData = async () => {
  showToast("Refreshing map...", ToastSeverity.Info);

  if (googleTileset && googleTileset.show === true) {
    // Remove and re-add the tileset to refresh the data
    getCesiumViewer().scene.primitives.remove(googleTileset);

    await initGoogleTileset(tilesetMock);
  } else {
    // Normal image layers

    // TODO: cesium doesn't seem to reload all the data when the provider is re-added. Some tiles aren't requested from the server again and remain blurry.

    // Get a reference to the layer you want to refresh. We're using the base layer here.
    const baseLayer = getCesiumViewer().imageryLayers.get(0);
    baseLayer.show = false;

    // Remove the layer (set destroy to false if you want to preserve the provider)
    getCesiumViewer().imageryLayers.remove(baseLayer, false);

    // Re-add the layer to enforce a refresh
    getCesiumViewer().imageryLayers.addImageryProvider(
      baseLayer.imageryProvider,
    );
    baseLayer.show = true;
  }

  // update the position. This is necessary to make the geolocationPin stick to the map again.
  updateGeolocation();

  getCesiumViewer().scene.requestRender();

  cesiumDataMightNeedRefresh.value = false;
};

const updateStatus = () => {
  if (!cesiumReachable.value) {
    statusMessage.value = "No internet connection. Map data might be outdated.";
    buttonSeverity.value = "danger";

    cesiumDataMightNeedRefresh.value = true;

    return;
  }

  if (cesiumDataMightNeedRefresh.value) {
    statusMessage.value =
      "Internet connection has been interrupted. Map data might be outdated.";
    buttonSeverity.value = "warn";

    return;
  }

  statusMessage.value =
    "Online connection established and map data is up to date.";
  buttonSeverity.value = "success";
};

const checkConnectivity = async () => {
  statusMessage.value = "Checking connection...";
  buttonSeverity.value = "info";
  cesiumReachable.value = await checkReachability("https://cesium.com");

  updateStatus();
};

const checkWebsitesButtonClick = async () => {
  networkIndicatorIconRef.value?.$el.startRotation(true);
  await refreshCesiumData();

  try {
    if (cesiumDataMightNeedRefresh.value) {
      await refreshCesiumData();
    }

    await checkConnectivity();

    if (buttonSeverity.value === "success") {
      showToast(statusMessage.value, ToastSeverity.Success);
    } else if (buttonSeverity.value === "warn") {
      showToast(statusMessage.value, ToastSeverity.Warn);
    } else showToast(statusMessage.value, ToastSeverity.Error);
  } catch (e: any) {
    showToast(e.message, ToastSeverity.Error);
  }

  await networkIndicatorIconRef.value?.$el.stopRotation();
  await networkIndicatorIconRef.value?.$el.rotationStopped();
};

// refresh interval
let refreshInterval: ReturnType<typeof setInterval>;
const refreshIntervalMillis = 10_000;

onMounted(async () => {
  checkConnectivity();
  refreshInterval = setInterval(checkConnectivity, refreshIntervalMillis);

  // if the cache is cleared automatically reload the cesium data. this prevents that the map is outdated after a cache clear.
  eventBus.on("cacheCleared", refreshCesiumData);
});

onUnmounted(() => {
  clearInterval(refreshInterval);
  eventBus.off("cacheCleared", refreshCesiumData);
});
</script>

<style scoped>
.icon-wrapper {
  width: 20px;
  height: 20px;
  position: relative;
  overflow: visible;
}

/* This container centers + scales the icon. */
.icon-container {
  /* center within .icon-wrapper */
  position: absolute;
  top: 50%;
  left: 50%;
  /* scale up 1.5 and shift to center */
  transform: translate(-50%, -50%) scale(1.3);
  transform-origin: center center;
  width: 20px;
  height: 20px;
}

/* The actual icon will spin around its center. */
.icon {
  width: 20px;
  height: 20px;
  transform-origin: center center;
  /* No transform or animation here,
     because the directive sets it dynamically
     (rotation only). */
}
</style>
