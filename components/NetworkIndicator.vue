<template>
  <div>
    <Button
      :severity="buttonSeverity"
      @click="checkWebsites"
      v-tooltip.bottom="statusMessage"
      class="icon-button"
    >
      <div class="icon-wrapper">
        <Wifi
          class="icon"
          v-show="buttonSeverity === 'info'"
          v-rotate
          ref="infoIcon"
        />

        <Wifi v-show="buttonSeverity === 'success'" class="icon" />
        <MdiWifiAlert v-show="buttonSeverity === 'warn'" class="icon" />
        <WifiOff v-show="buttonSeverity === 'danger'" class="icon" />
      </div>
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, toRaw } from "vue";

// import Tooltip from "primevue/tooltip";
import Button from "primevue/button";
import Wifi from "~icons/mdi/wifi";
import WifiOff from "~icons/mdi/wifi-off";
import MdiWifiAlert from "~icons/mdi/wifi-alert";
import type { ComponentPublicInstance } from "vue";

const cesiumReachable = ref(false);
const googleReachable = ref(false);
const statusMessage = ref("Checking reachability...");
const buttonSeverity = ref("danger");

const infoIcon = ref<ComponentPublicInstance | null>(null);

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

const updateStatus = () => {
  if (cesiumReachable.value && googleReachable.value) {
    statusMessage.value = "Internet connection established.";
    buttonSeverity.value = "success";
  } else if (cesiumReachable.value || googleReachable.value) {
    statusMessage.value =
      "Internet access problem: " +
      (cesiumReachable.value ? "Google" : "Cesium") +
      " unreachable.";
    buttonSeverity.value = "warn";
  } else {
    statusMessage.value = "No internet connection.";
    buttonSeverity.value = "danger";
  }
};

const checkWebsites = async () => {
  statusMessage.value = "Checking connection...";
  buttonSeverity.value = "info";

  infoIcon.value?.$el.startRotation(true);
  cesiumReachable.value = await checkReachability("https://cesium.com");
  googleReachable.value = await checkReachability("https://google.com");
  await infoIcon.value?.$el.stopRotation();
  await infoIcon.value?.$el.rotationStopped();

  updateStatus();
};

// refresh interval
let refreshInterval: ReturnType<typeof setInterval>;
const refreshIntervalMillis = 10_000;

onMounted(async () => {
  checkWebsites();
  refreshInterval = setInterval(checkWebsites, refreshIntervalMillis);
});

onUnmounted(() => {
  clearInterval(refreshInterval);
});
</script>

<style scoped>
.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon {
  transition:
    opacity 0.2s ease-in-out,
    visibility 0.2s ease-in-out;
}

.icon[v-show] {
  opacity: 1; /* Show the visible icon */
  visibility: visible; /* Allow only visible icons to affect layout */
}
</style>
