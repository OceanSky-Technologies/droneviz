<template>
  <Button
    :icon="statusIcon"
    :severity="buttonSeverity"
    @click="checkWebsites"
    v-tooltip.bottom="statusMessage"
  >
    <WifiOff />
  </Button>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";

import Tooltip from "primevue/tooltip";
import Button from "primevue/button";
import WifiOff from "~icons/mdi/wifi-off";
import { defineComponent } from "vue";
import { Colors } from "~/utils/Colors";

defineComponent({
  directives: {
    tooltip: Tooltip,
  },
});

const cesiumReachable = ref(false);
const googleReachable = ref(false);
const statusColor = ref(Colors.RED);
const statusMessage = ref("Checking reachability...");
const statusIcon = ref("pi pi-spin pi-spinner");
const buttonSeverity = ref("danger");

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
    statusColor.value = Colors.DARK_GREEN;
    statusMessage.value = "Internet connection established.";
    statusIcon.value = "pi pi-wifi";
    statusIcon.value = "material material-icons";
    buttonSeverity.value = "success";
  } else if (cesiumReachable.value || googleReachable.value) {
    statusColor.value = Colors.ORANGE;
    statusMessage.value =
      "Internet access problem: " +
      (cesiumReachable.value ? "Google" : "Cesium") +
      " unreachable.";
    statusIcon.value = "pi pi-exclamation-triangle";
    buttonSeverity.value = "warn";
  } else {
    statusColor.value = Colors.RED;
    statusMessage.value = "No internet connection.";
    statusIcon.value = "pi pi-times";
    buttonSeverity.value = "danger";
  }
};

const checkWebsites = async () => {
  statusMessage.value = "Checking connection...";
  statusIcon.value = "pi pi-spin pi-spinner";
  buttonSeverity.value = "info";
  cesiumReachable.value = await checkReachability("https://cesium.com");
  googleReachable.value = await checkReachability("https://google.com");
  updateStatus();
};

// refresh interval
let refreshInterval: NodeJS.Timeout;
const refreshIntervalMillis = 10_000;

onMounted(() => {
  checkWebsites();
  refreshInterval = setInterval(checkWebsites, refreshIntervalMillis);
});

onUnmounted(() => {
  clearInterval(refreshInterval);
});
</script>

<style scoped></style>
