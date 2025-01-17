<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { droneManager } from "~/core/drone/DroneManager";
import { GpsFixType } from "mavlink-mappings/dist/lib/common";

// Reactive state for displayed data
const gpsData = ref<
  | {
      fix: string;
      lat: number;
      lon: number;
      alt: number;
      eph: number;
      epv: number;
      vel: number;
      cog: number;
      satellitesVisible: number;
      altEllipsoid: number;
      hAcc: number;
      vAcc: number;
      velAcc: number;
      hdgAcc: number;
      yaw: number;
    }
  | undefined
>(undefined);

const fusedAltitude = ref<number | undefined>(undefined);

// -- Watch everything in one watchEffect --
watchEffect(() => {
  const selectedDrone = droneManager.selectedDrone.value;
  if (!selectedDrone) {
    // No drone selected
    gpsData.value = undefined;
    fusedAltitude.value = undefined;
    return;
  }

  // 1) Check lastGpsRawInt.value
  const lastGps = selectedDrone.lastGpsRawInt;
  if (lastGps) {
    gpsData.value = {
      fix: GpsFixType[lastGps.fixType].replace("GPS_FIX_TYPE_", ""),
      lat: lastGps.lat / 1e7,
      lon: lastGps.lon / 1e7,
      alt: lastGps.alt / 1e3,
      eph: lastGps.eph,
      epv: lastGps.epv,
      vel: lastGps.vel,
      cog: lastGps.cog,
      satellitesVisible: lastGps.satellitesVisible,
      altEllipsoid: lastGps.altEllipsoid,
      hAcc: lastGps.hAcc,
      vAcc: lastGps.vAcc,
      velAcc: lastGps.velAcc,
      hdgAcc: lastGps.hdgAcc,
      yaw: lastGps.yaw,
    };
  } else {
    gpsData.value = undefined;
  }

  // 2) Check lastAltitude.value
  const altMsg = selectedDrone.lastAltitude;
  if (altMsg) {
    fusedAltitude.value = altMsg.altitudeAmsl;
  } else {
    fusedAltitude.value = undefined;
  }
});
</script>

<template>
  <div class="drone-live-data">
    <!-- GPS data panel -->
    <div>
      <div v-if="gpsData">
        <div>
          <strong>Fix: </strong>
          <span>{{ gpsData.fix }}</span>
        </div>
        <div>
          <strong>Satellites visible: </strong>
          <span>{{ gpsData.satellitesVisible }}</span>
        </div>
        <div>
          <strong>Position: </strong>
          <span>
            {{ formatCoordinate(gpsData.lat) }},
            {{ formatCoordinate(gpsData.lon) }}
          </span>
        </div>
        <div>
          <strong>Altitude (MSL): </strong>
          <span>{{ formatAltitude(gpsData.alt) }}</span>
        </div>
        <div>
          <strong>Ground speed: </strong>
          <span>
            {{ (gpsData.vel / 100).toFixed(2) }} m/s or
            {{ ((gpsData.vel / 100) * 3.6).toFixed(2) }} km/h
          </span>
        </div>
        <div>
          <strong>Heading: </strong>
          <span> {{ gpsData.yaw / 100 }}° ({{ gpsData.cog / 100 }}° COG) </span>
        </div>
        <div>
          <strong>Accuracy: </strong>
          <span>
            {{ gpsData.hAcc / 1e3 }} m (horizontal), {{ gpsData.vAcc / 1e3 }} m
            (vertical), {{ gpsData.hdgAcc / 1e5 }} m (heading)
          </span>
        </div>
        <div>
          <strong>DOP: </strong>
          <span>
            {{ gpsData.eph / 100 }} (horizontal),
            {{ gpsData.epv / 100 }} (vertical)
          </span>
        </div>
      </div>
      <div v-else>
        <p>No GPS data available.</p>
      </div>
    </div>

    <!-- Fused altitude panel -->
    <div style="margin-top: 10px">
      <div v-if="fusedAltitude">
        <strong>Fused altitude: </strong>
        <span>{{ formatAltitude(fusedAltitude) }}</span>
      </div>
      <div v-else>
        <p>No fused altitude data available.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drone-live-data {
  padding: 10px;
}
</style>
