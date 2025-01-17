<template>
  <Button @click="flyToGeolocation">
    <div class="icon-wrapper">
      <div class="icon-container">
        <IcOutlinePersonPinCircle
          ref="geolocationIconRef"
          class="icon"
          v-rotate
        />
      </div>
    </div>
  </Button>
</template>

<script lang="ts" setup>
import IcOutlinePersonPinCircle from "~icons/ic/outline-person-pin-circle";
import { Cartesian3, Math as CesiumMath } from "cesium";
import { getGeolocationAsync, updateGeolocation } from "~/core/Geolocation";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import { ref, onMounted, type ComponentPublicInstance } from "vue";
import { getCesiumViewer } from "@/components/CesiumViewerWrapper";
import { droneManager } from "~/core/drone/DroneManager";

const geolocationIconRef = ref<ComponentPublicInstance | null>(null);

async function flyToGeolocation() {
  try {
    showToast("Aquiring geolocation...", ToastSeverity.Info);
    geolocationIconRef.value?.$el.startRotation();
    const position = await getGeolocationAsync();

    showToast("Geolocation found. Moving camera.", ToastSeverity.Success);

    // stop tracking drone if any
    droneManager.selectedDrone.value = undefined;

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
        updateGeolocation(position);
      },
      complete: async () => {
        await geolocationIconRef.value?.$el.stopRotation();
        await geolocationIconRef.value?.$el.rotationStopped();
        updateGeolocation(position);
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

onMounted(async () => {
  flyToGeolocation();
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
