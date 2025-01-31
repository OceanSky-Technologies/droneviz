<script setup lang="ts">
import { droneManager } from "~/core/drone/DroneManager";
import { GpsFixType } from "mavlink-mappings/dist/lib/common";

// This makes sure the template sees changes when selectedDrone changes.
const selectedDrone = computed(() => droneManager.selectedDrone.value);
</script>

<template>
  <div class="drone-live-data">
    <!-- GPS data panel -->
    <div>
      <div v-if="selectedDrone">
        <div>
          <strong>Fix: </strong>
          <span>{{
            GpsFixType[unref(selectedDrone?.lastGpsRawInt).fixType]?.replace(
              "GPS_FIX_TYPE_",
              "",
            ) ?? "Unknown"
          }}</span>
        </div>
        <div>
          <strong>Satellites visible: </strong>
          <span>{{
            unref(selectedDrone?.lastGpsRawInt).satellitesVisible
          }}</span>
        </div>
        <div>
          <strong>Position: </strong>
          <span>
            {{
              formatCoordinate(unref(selectedDrone?.lastGpsRawInt).lat / 1e7)
            }},
            {{
              formatCoordinate(unref(selectedDrone?.lastGpsRawInt).lon / 1e7)
            }}
          </span>
        </div>
        <div>
          <strong>Altitude (MSL): </strong>
          <span>{{
            formatAltitude(unref(selectedDrone?.lastGpsRawInt).alt / 1e3)
          }}</span>
        </div>
        <div>
          <strong>Ground speed: </strong>
          <span>
            {{ (unref(selectedDrone?.lastGpsRawInt).vel / 100).toFixed(2) }}
            m/s or
            {{
              ((unref(selectedDrone?.lastGpsRawInt).vel / 100) * 3.6).toFixed(2)
            }}
            km/h
          </span>
        </div>
        <div>
          <strong>Heading: </strong>
          <span>
            {{ unref(selectedDrone?.lastGpsRawInt).yaw / 100 }}° ({{
              unref(selectedDrone?.lastGpsRawInt).cog / 100
            }}° COG)
          </span>
        </div>
        <div>
          <strong>Accuracy: </strong>
          <span>
            {{ unref(selectedDrone?.lastGpsRawInt).hAcc / 1e3 }}
            m (horizontal),
            {{ unref(selectedDrone?.lastGpsRawInt).vAcc / 1e3 }}
            m (vertical),
            {{ unref(selectedDrone?.lastGpsRawInt).hdgAcc / 1e5 }}
            m (heading)
          </span>
        </div>
        <div>
          <strong>DOP: </strong>
          <span>
            {{ unref(selectedDrone?.lastGpsRawInt).eph / 100 }}
            (horizontal),
            {{ unref(selectedDrone?.lastGpsRawInt).epv / 100 }}
            (vertical)
          </span>
        </div>
      </div>
      <div v-else>
        <p>No GPS data available.</p>
      </div>
    </div>

    <!-- Fused altitude panel -->
    <div style="margin-top: 10px">
      <div v-if="selectedDrone">
        <strong>Fused altitude: </strong>
        <span>{{
          formatAltitude(unref(selectedDrone?.lastAltitude).altitudeAmsl)
        }}</span>
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
