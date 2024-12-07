<script setup lang="ts">
import { droneCollection } from "@/core/DroneCollection";
import { AnimationFrameScheduler } from "@/utils/AnimationFrameScheduler";
import { CommandLong, GpsFixType } from "mavlink-mappings/dist/lib/common";

// Reactive properties for the displayed data
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

// Animation frame scheduler: used to update the displayed data
const animationFrameScheduler = new AnimationFrameScheduler(async () => {
  const selectedDrone = droneCollection.selectedDrone.value;

  if (selectedDrone && selectedDrone.lastMessages) {
    // gps data
    const lastGpsMessage = selectedDrone.lastMessages.gpsRawInt?.message;
    if (lastGpsMessage) {
      gpsData.value = {
        fix: GpsFixType[lastGpsMessage.fixType].replace("GPS_FIX_TYPE_", ""),
        lat: lastGpsMessage.lat / 1e7,
        lon: lastGpsMessage.lon / 1e7,
        alt: lastGpsMessage.alt / 1e3,
        eph: lastGpsMessage.eph,
        epv: lastGpsMessage.epv,
        vel: lastGpsMessage.vel,
        cog: lastGpsMessage.cog,
        satellitesVisible: lastGpsMessage.satellitesVisible,
        altEllipsoid: lastGpsMessage.altEllipsoid,
        hAcc: lastGpsMessage.hAcc,
        vAcc: lastGpsMessage.vAcc,
        velAcc: lastGpsMessage.velAcc,
        hdgAcc: lastGpsMessage.hdgAcc,
        yaw: lastGpsMessage.yaw,
      };
    }

    fusedAltitude.value =
      selectedDrone.lastMessages.altitude?.message.altitudeAmsl;
  } else {
    gpsData.value = undefined;
    fusedAltitude.value = undefined;
  }
});

// Watch for changes to selectedDrone
watchEffect(() => {
  const selectedDrone = droneCollection.selectedDrone.value;

  if (selectedDrone) {
    animationFrameScheduler.start();
  } else {
    animationFrameScheduler.stop();
  }
});
</script>

<template>
  <div class="drone-live-data">
    <div>
      <div v-if="gpsData">
        <div>
          <strong>Fix: </strong>
          <span>{{ gpsData.fix }}</span>
        </div>
        <div>
          <strong>Satellites visible: </strong>
          <span>
            {{ gpsData.satellitesVisible }}
          </span>
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
          <span>
            {{ formatAltitude(gpsData.alt) }}
          </span>
        </div>
        <div>
          <strong>Ground speed: </strong>
          <span>
            {{ (gpsData.vel / 100).toFixed(2) }}m/s or
            {{ ((gpsData.vel / 100) * 3.6).toFixed(2) }}km/s
          </span>
        </div>
        <div>
          <strong>Heading: </strong>
          <span> {{ gpsData.yaw / 100 }}° ({{ gpsData.cog / 100 }}° COG) </span>
        </div>
        <div>
          <strong>Accuracy: </strong>
          <span>
            {{ gpsData.hAcc / 1e3 }}m (horizontal), {{ gpsData.vAcc / 1e3 }}m
            (vertical), {{ gpsData.hdgAcc / 1e5 }}m (heading)
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
    <div style="margin-top: 10px">
      <div v-if="fusedAltitude">
        <strong>Fused altitude:</strong>
        <span>{{ formatAltitude(fusedAltitude) }} </span>
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
