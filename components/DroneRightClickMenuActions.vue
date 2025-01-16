<template>
  <div class="flex flex-col items-center gap-2">
    <div id="flyHereContainer">
      <ConfirmationButton label="Fly here" disable-mouse-leave @click="flyTo">
        <template #icon>
          <FlyToIcon />
        </template>
      </ConfirmationButton>
    </div>

    <div
      id="orbitContainer"
      class="flex w-72 flex-row flex-nowrap items-center justify-center gap-2"
    >
      <ConfirmationButton label="Orbit" disable-mouse-leave @click="orbit">
        <template #icon>
          <MdiOrbitVariant />
        </template>
      </ConfirmationButton>

      <InputNumber
        id="radius"
        v-model="radius"
        :min="1"
        :max="1000"
        :step="1"
        mode="decimal"
        suffix=" m"
        show-buttons
        fluid
        style="padding: 0px !important"
      >
        <template #incrementicon>
          <span class="pi pi-plus" style="font-size: 0.6em" />
        </template>
        <template #decrementicon>
          <span class="pi pi-minus" style="font-size: 0.6em" />
        </template>
      </InputNumber>

      <SelectButton
        v-model="orbitDirectionValue"
        style="padding: 0px !important"
        :options="orbitDirectionOptions"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import * as Cesium from "cesium";
import { droneCollection } from "@/core/DroneCollection";
import FlyToIcon from "@/components/icons/FlyTo.vue";
import ConfirmationButton from "@/components/ConfirmationButton.vue";
import InputNumber from "primevue/inputnumber";
import MdiOrbitVariant from "~icons/mdi/orbit-variant";
import SelectButton from "primevue/selectbutton";
import { formatCoordinate } from "~/utils/CoordinateUtils";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import { OrbitYawBehaviour } from "mavlink-mappings/dist/lib/common";

const props = defineProps({
  positionCartesian: {
    type: Cesium.Cartesian3,
    required: true,
  },
  positionCartographic: {
    type: Cesium.Cartographic,
    required: true,
  },
});
const emit = defineEmits(["call-close"]);

const orbitDirectionOptions = ref(["CW", "CCW"]);
const orbitDirectionValue = ref("CW");
const radius = ref(10);

const preCheck = () => {
  if (!droneCollection.selectedDrone.value) {
    showToast("Drone is not connected", ToastSeverity.Error);
    emit("call-close");
    throw new Error("Drone is not connected");
  }

  if (!props.positionCartesian) {
    showToast("Invalid position", ToastSeverity.Error);
    emit("call-close");
    throw new Error("Invalid position");
  }

  if (
    props.positionCartographic.latitude === 0 &&
    props.positionCartographic.longitude === 0 &&
    props.positionCartographic.height === 0
  ) {
    showToast("Invalid coordinates", ToastSeverity.Error);
    emit("call-close");
    throw new Error("Invalid coordinates");
  }
};

async function flyTo() {
  preCheck();

  try {
    await droneCollection.selectedDrone.value!.doReposition(
      Cesium.Math.toDegrees(props.positionCartographic.latitude),
      Cesium.Math.toDegrees(props.positionCartographic.longitude),
      props.positionCartographic.height,
    );

    showToast(
      `Repositioning drone:
      - latitude: ${formatCoordinate(Cesium.Math.toDegrees(props.positionCartographic.latitude))}
      - longitude: ${formatCoordinate(Cesium.Math.toDegrees(props.positionCartographic.longitude))}
      - height: ${props.positionCartographic.height.toFixed(2)}m`,
      ToastSeverity.Success,
    );
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }
  }
  emit("call-close");
}

async function orbit() {
  preCheck();

  if (!radius.value) {
    showToast("Invalid radius", ToastSeverity.Error);
    emit("call-close");
    return;
  }

  if (!orbitDirectionValue.value) {
    showToast("Invalid orbit direction", ToastSeverity.Error);
    emit("call-close");
    return;
  }

  try {
    await droneCollection.selectedDrone.value!.doOrbit(
      Cesium.Math.toDegrees(props.positionCartographic.latitude),
      Cesium.Math.toDegrees(props.positionCartographic.longitude),
      props.positionCartographic.height,
      orbitDirectionValue.value === "CCW" ? -1 * radius.value : radius.value,
      OrbitYawBehaviour.HOLD_FRONT_TANGENT_TO_CIRCLE,
      10,
      0,
    );

    showToast(
      `Orbitting position:
      - latitude: ${formatCoordinate(Cesium.Math.toDegrees(props.positionCartographic.latitude))}
      - longitude: ${formatCoordinate(Cesium.Math.toDegrees(props.positionCartographic.longitude))}
      - height: ${props.positionCartographic.height.toFixed(2)}m
      - radius: ${radius.value}m
      - direction: ${orbitDirectionValue.value}`,
      ToastSeverity.Success,
    );
  } catch (e) {
    if (e instanceof Error) {
      showToast(e.message, ToastSeverity.Error);
    } else {
      showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
    }
  }
  emit("call-close");
}
</script>
