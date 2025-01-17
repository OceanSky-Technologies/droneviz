<template>
  <div class="flex flex-col items-center gap-3">
    <div id="flyHereContainer">
      <ConfirmationButton
        label="Fly here"
        disable-mouse-leave
        @click="flyTo"
        @select="flyToSelected"
      >
        <template #icon>
          <FlyToIcon />
        </template>
      </ConfirmationButton>
    </div>

    <div class="center grid w-56 grid-cols-2 gap-3">
      <ConfirmationButton
        label="Orbit"
        class="w-full"
        disable-mouse-leave
        @click="orbit"
        @select="orbitSelected"
      >
        <template #icon>
          <MdiOrbitVariant />
        </template>
      </ConfirmationButton>

      <SelectButton
        v-model="orbitDirectionValue"
        :options="orbitDirectionOptions"
        class="p-half-width-selectbutton w-full"
        style="padding: 0px !important"
      />

      <FloatLabel variant="on" class="w-full">
        <InputNumber
          id="orbitRadius"
          v-model="orbitRadius"
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
        <label for="orbitRadius">Radius</label>
      </FloatLabel>

      <FloatLabel variant="on" class="w-full">
        <InputNumber
          id="orbitVelocity"
          v-model="orbitVelocity"
          :min="1"
          :max="100"
          :step="1"
          mode="decimal"
          suffix=" km/h"
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
        <label for="orbitVelocity">Velocity</label>
      </FloatLabel>
    </div>
  </div>
</template>

<script lang="ts" setup>
/* ------------- Imports ------------- */
import { ref } from "vue";
import * as Cesium from "cesium";
import { droneCollection } from "@/core/DroneCollection";
import FlyToIcon from "@/components/icons/FlyTo.vue";
import ConfirmationButton from "@/components/ConfirmationButton.vue";
import InputNumber from "primevue/inputnumber";
import FloatLabel from "primevue/floatlabel";
import MdiOrbitVariant from "~icons/mdi/orbit-variant";
import SelectButton from "primevue/selectbutton";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import { formatCoordinate } from "~/utils/CoordinateUtils";
import { getCesiumViewer } from "~/components/CesiumViewerWrapper";
import { Colors } from "../utils/Colors";
import { OrbitYawBehaviour } from "mavlink-mappings/dist/lib/common";

/* ------------- Props & Emits ------------- */
const props = defineProps<{
  positionCartesian: Cesium.Cartesian3;
  positionCartographic: Cesium.Cartographic;
}>();
const emit = defineEmits(["call-close", "position-update"]);

/* ------------- Refs & Constants ------------- */
const orbitDirectionOptions = ref(["CW", "CCW"]);
const orbitDirectionValue = ref("CW");
const orbitRadius = ref(50); // meters
const orbitVelocity = ref(65); // km/h

/* Entities to visually represent user-chosen flight paths */
const lineEntity = ref<Cesium.Entity | null>(null);
const ringEntity = ref<Cesium.Entity | null>(null);

/* Keep track of the target position chosen by the user */
let targetPosition: Cesium.Cartesian3 | null = null;
let targetAltitudeMsl: number | null = null; // meters

/* ------------- Lifecycle Expose ------------- */
defineExpose({ clear });

/* ------------- Methods ------------- */
function clear() {
  const viewer = getCesiumViewer();
  if (!viewer) return;
  if (lineEntity.value) {
    viewer.entities.remove(lineEntity.value);
    lineEntity.value = null;
  }
  if (ringEntity.value) {
    viewer.entities.remove(ringEntity.value);
    ringEntity.value = null;
  }
}

function cancel() {
  clear();
  emit("call-close");
}

/**
 * Pre-flight checks for valid conditions: selected drone, valid coords, etc.
 * If something is invalid, show an error toast and throw.
 */
function preCheck() {
  if (!droneCollection.selectedDrone.value) {
    showToast("Drone is not connected", ToastSeverity.Error);
    cancel();
    throw new Error("Drone is not connected");
  }
  if (!droneCollection.selectedDrone.value?.position.alt) {
    showToast("Drone altitude is unknown", ToastSeverity.Error);
    cancel();
    throw new Error("Drone altitude is unknown");
  }
  if (!props.positionCartesian) {
    showToast("Invalid position", ToastSeverity.Error);
    cancel();
    throw new Error("Invalid position");
  }
  if (
    props.positionCartographic.latitude === 0 &&
    props.positionCartographic.longitude === 0 &&
    props.positionCartographic.height === 0
  ) {
    showToast("Invalid coordinates", ToastSeverity.Error);
    cancel();
    throw new Error("Invalid coordinates");
  }

  if (targetAltitudeMsl === null) {
    showToast("Invalid altitude", ToastSeverity.Error);
    cancel();
    throw new Error("Invalid altitude");
  }
}

/* ------------- "Fly To" ------------- */

/**
 * (a) flyToSelected:
 *   - Show a dashed line from the drone's current position to the target position.
 *   - Remove any existing ring or line first.
 */
function flyToSelected() {
  clear();
  createOrUpdateLine();
  // Let parent know the menu should reposition to the newly created line's target
  emit("position-update", targetPosition, targetAltitudeMsl);
}

/**
 * Actually do the "fly" command to the indicated cartographic position on click.
 */
async function flyTo() {
  preCheck();

  try {
    await droneCollection.selectedDrone.value!.doReposition(
      Cesium.Math.toDegrees(props.positionCartographic.latitude),
      Cesium.Math.toDegrees(props.positionCartographic.longitude),
      targetAltitudeMsl!,
    );

    showToast(
      `Repositioning drone:
       - lat: ${formatCoordinate(Cesium.Math.toDegrees(props.positionCartographic.latitude))}
       - lon: ${formatCoordinate(Cesium.Math.toDegrees(props.positionCartographic.longitude))}
       - height: ${targetAltitudeMsl!.toFixed(2)}m (MSL)`,
      ToastSeverity.Success,
    );
  } catch (e) {
    handleError(e);
  }
  cancel();
}

/**
 * Create or update a dashed line from the drone's current position to the chosen target.
 */
function createOrUpdateLine(skipClear = false) {
  const viewer = getCesiumViewer();
  if (!viewer) return;
  if (!skipClear) clear();

  const dronePos = droneCollection.selectedDrone.value?.positionCartesian3;
  if (!dronePos) return;

  if (droneCollection.selectedDrone.value?.position.alt === undefined) return;

  const lat = Cesium.Math.toDegrees(props.positionCartographic.latitude);
  const lon = Cesium.Math.toDegrees(props.positionCartographic.longitude);

  const droneCarto = Cesium.Cartographic.fromCartesian(dronePos);

  const currentDroneHeight = droneCarto.height;

  // Match the drone's current altitude so the line is horizontal
  targetAltitudeMsl = droneCollection.selectedDrone.value?.position.alt / 1000;

  targetPosition = Cesium.Cartesian3.fromDegrees(lon, lat, currentDroneHeight);

  lineEntity.value = viewer.entities.add({
    polyline: {
      positions: new Cesium.CallbackProperty(() => {
        const currentDronePos =
          droneCollection.selectedDrone.value?.positionCartesian3;
        if (!currentDronePos) return [];

        const cCarto =
          Cesium.Ellipsoid.WGS84.cartesianToCartographic(currentDronePos);
        const cDroneAlt = cCarto.height;
        const droneCart3 = Cesium.Cartesian3.fromRadians(
          cCarto.longitude,
          cCarto.latitude,
          cDroneAlt,
        );
        const targetCart3 = Cesium.Cartesian3.fromDegrees(
          lon,
          lat,
          currentDroneHeight,
        );
        return [droneCart3, targetCart3];
      }, false),
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString(Colors.GOLD),
        dashLength: 16,
        dashPattern: 255, // 0xFF => 11111111 => effectively a dashed line
      }),
      width: 1,
      clampToGround: false,
    },
  });
}

/* ------------- "Orbit" ------------- */

/**
 * (b) orbitSelected:
 *   - Show the ring plus a dashed line to the center of that ring
 */
function orbitSelected() {
  clear();
  createOrUpdateLine(true);
  createOrUpdateRing(true);
  emit("position-update", targetPosition, targetAltitudeMsl);
}

/**
 * Actually do the "orbit" command on click
 */
async function orbit() {
  preCheck();

  if (!orbitRadius.value || orbitRadius.value < 0) {
    showToast("Invalid radius", ToastSeverity.Error);
    cancel();
    return;
  }
  if (!orbitVelocity.value) {
    showToast("Invalid velocity", ToastSeverity.Error);
    cancel();
    return;
  }
  if (!orbitDirectionValue.value) {
    showToast("Invalid orbit direction", ToastSeverity.Error);
    cancel();
    return;
  }

  try {
    await droneCollection.selectedDrone.value!.doOrbit(
      Cesium.Math.toDegrees(props.positionCartographic.latitude),
      Cesium.Math.toDegrees(props.positionCartographic.longitude),
      targetAltitudeMsl!,
      orbitDirectionValue.value === "CCW"
        ? -1 * orbitRadius.value
        : orbitRadius.value,
      OrbitYawBehaviour.HOLD_FRONT_TANGENT_TO_CIRCLE,
      orbitVelocity.value / 3.6, // km/h to m/s
      0,
    );

    showToast(
      `Orbiting:
       - lat: ${formatCoordinate(Cesium.Math.toDegrees(props.positionCartographic.latitude))}
       - lon: ${formatCoordinate(Cesium.Math.toDegrees(props.positionCartographic.longitude))}
       - height: ${targetAltitudeMsl!.toFixed(2)}m (MSL)
       - dir: ${orbitDirectionValue.value}
       - radius: ${orbitRadius.value}m
       - velocity: ${orbitVelocity.value} km/h`,
      ToastSeverity.Success,
    );
  } catch (e) {
    handleError(e);
  }
  cancel();
}

/**
 * Create/update a pulsating ring around the target location at the specified altitude.
 */
function createOrUpdateRing(skipClear = false) {
  const viewer = getCesiumViewer();
  if (!viewer) return;
  if (!skipClear) clear();
  const dronePos = droneCollection.selectedDrone.value?.positionCartesian3;
  if (!dronePos) return;

  if (droneCollection.selectedDrone.value?.position.alt === undefined) return;

  const lat = Cesium.Math.toDegrees(props.positionCartographic.latitude);
  const lon = Cesium.Math.toDegrees(props.positionCartographic.longitude);

  const droneCarto = Cesium.Cartographic.fromCartesian(dronePos);

  const currentDroneHeight = droneCarto.height;

  // Match the drone's current altitude so the line is horizontal
  targetAltitudeMsl = droneCollection.selectedDrone.value?.position.alt / 1000;

  targetPosition = Cesium.Cartesian3.fromDegrees(lon, lat, currentDroneHeight);

  ringEntity.value = viewer.entities.add({
    position: targetPosition,
    ellipse: {
      // Keep ring at the drone's altitude
      height: currentDroneHeight,
      // Use the same orbitRadius for both axes to make a circle
      semiMajorAxis: new Cesium.CallbackProperty(
        () => orbitRadius.value,
        false,
      ),
      semiMinorAxis: new Cesium.CallbackProperty(
        () => orbitRadius.value,
        false,
      ),
      heightReference: Cesium.HeightReference.NONE,

      outline: true,
      outlineColor: Cesium.Color.fromCssColorString(Colors.GOLD),
      outlineWidth: 3,

      // Keep geometry's rotation = 0; we'll rotate the texture instead
      rotation: 0,

      /**
       * Spin the texture coordinates at angular velocity = orbitVelocity / orbitRadius
       * multiplied by +1 (CW) or -1 (CCW). This ensures the ring visually rotates at
       * the same speed the drone would orbit in real life.
       */
      stRotation: new Cesium.CallbackProperty((time) => {
        const direction = orbitDirectionValue.value === "CW" ? 1 : -1;
        const seconds = time
          ? Cesium.JulianDate.toDate(time).getTime() / 1000.0
          : 0;

        // Angular velocity in rad/s
        const radPerSec = orbitRadius.value
          ? orbitVelocity.value / 3.6 / orbitRadius.value
          : 0;

        return direction * seconds * radPerSec;
      }, false),
      material: new Cesium.StripeMaterialProperty({
        evenColor: Cesium.Color.fromCssColorString(Colors.GOLD).withAlpha(0.5),
        oddColor: Cesium.Color.TRANSPARENT,
        repeat: 15,
        orientation: Cesium.StripeOrientation.VERTICAL,
      }),
    },
  });
}

/* ------------- Helper ------------- */
function handleError(e: unknown) {
  if (e instanceof Error) {
    showToast(e.message, ToastSeverity.Error);
  } else {
    showToast(`Unknown error: ${JSON.stringify(e)}`, ToastSeverity.Error);
  }
}
</script>

<style lang="postcss">
.p-half-width-selectbutton button {
  width: 50% !important;
}
</style>
