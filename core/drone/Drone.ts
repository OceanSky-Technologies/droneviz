import { computed, ref, watch } from "vue";
import * as Cesium from "cesium";
import { calculateCartesian3Position } from "@/utils/CoordinateUtils";
import type { MavlinkConnection } from "./MavlinkConnection";
import { settings } from "@/utils/Settings"; // If you have a global settings store

// MAVLink imports
import {
  GlobalPositionInt,
  Attitude,
  Ping,
  GpsRawInt,
  Altitude,
  ExtendedSysState,
  MavLandedState,
} from "mavlink-mappings/dist/lib/common";

import type { MavlinkMessageInterface } from "@/types/MessageInterface";
import { getCesiumViewer } from "@/components/CesiumViewerWrapper";
import {
  Heartbeat,
  MavType,
  MavAutopilot,
  MavModeFlag,
  MavState,
} from "mavlink-mappings/dist/lib/minimal";

export class Drone {
  public readonly sysId: number;
  public readonly compId: number;

  public connection: MavlinkConnection;

  // Reactive references for data we care about:
  public lastGlobalPositionInt = ref<GlobalPositionInt>(
    new GlobalPositionInt(),
  );
  public lastAttitude = ref<Attitude>(new Attitude());
  public lastAltitude = ref<Altitude>(new Altitude());
  public lastHeartbeat = ref<Heartbeat>(new Heartbeat());
  public lastGpsRawInt = ref<GpsRawInt>(new GpsRawInt());
  public lastExtSysState = ref<ExtendedSysState>(new ExtendedSysState());

  public entity: Cesium.Entity;
  private heartbeatInterval?: ReturnType<typeof setInterval>;

  constructor(sysId: number, compId: number, connection: MavlinkConnection) {
    this.sysId = sysId;
    this.compId = compId;
    this.connection = connection;

    // Create a Cesium Entity for visualization
    this.entity = this.createCesiumEntity();

    // (Optional) Start sending heartbeats:
    if (
      settings.heartbeatInterval?.value &&
      settings.heartbeatInterval.value > 0
    ) {
      this.startHeartbeat(settings.heartbeatInterval.value);
    }

    // Whenever position or orientation updates, request a scene render:
    watch(
      () => this.positionCartesian3.value,
      () => {
        getCesiumViewer().scene.requestRender();
      },
    );

    watch(
      () => this.orientation.value,
      () => {
        getCesiumViewer().scene.requestRender();
      },
    );
  }

  /**
   * Called by MavlinkConnection whenever a message arrives for (sysId, compId).
   */
  public handleMavlinkMessage(raw: MavlinkMessageInterface) {
    const { msgid } = raw.header;
    const data = raw.data;

    // Replace magic numbers with the MavlinkCommonMessageId enum constants:
    if (msgid === GlobalPositionInt.MSG_ID) {
      const gp = Object.assign(new GlobalPositionInt(), data);
      this.lastGlobalPositionInt.value = gp;
    } else if (msgid === Attitude.MSG_ID) {
      const att = Object.assign(new Attitude(), data);
      this.lastAttitude.value = att;
    } else if (msgid === Altitude.MSG_ID) {
      const alt = Object.assign(new Altitude(), data);
      this.lastAltitude.value = alt;
    } else if (msgid === ExtendedSysState.MSG_ID) {
      const extSysState = Object.assign(new ExtendedSysState(), data);

      if (
        this.lastExtSysState &&
        this.lastExtSysState.value.landedState !== extSysState.landedState
      ) {
        if (extSysState.landedState === MavLandedState.LANDING) {
          showToast(
            `Drone sysId=${this.sysId}, compId=${this.compId} is landing.`,
            ToastSeverity.Success,
          );
        } else if (extSysState.landedState === MavLandedState.TAKEOFF) {
          showToast(
            `Drone sysId=${this.sysId}, compId=${this.compId} is taking off.`,
            ToastSeverity.Success,
          );
        } else if (extSysState.landedState === MavLandedState.IN_AIR) {
          showToast(
            `Drone sysId=${this.sysId}, compId=${this.compId} takeoff completed.`,
            ToastSeverity.Success,
          );
        } else if (extSysState.landedState === MavLandedState.ON_GROUND) {
          showToast(
            `Drone sysId=${this.sysId}, compId=${this.compId} has landed.`,
            ToastSeverity.Success,
          );
        }
      }

      this.lastExtSysState.value = extSysState;
    } else if (msgid === Heartbeat.MSG_ID) {
      const hb = Object.assign(new Heartbeat(), data);

      if (this.lastHeartbeat.value) {
        if (
          !(this.lastHeartbeat.value.baseMode & MavModeFlag.SAFETY_ARMED) &&
          hb.baseMode & MavModeFlag.SAFETY_ARMED
        ) {
          showToast(
            `Drone sysId=${this.sysId}, compId=${this.compId} is armed.`,
            ToastSeverity.Success,
          );
        } else if (
          this.lastHeartbeat.value.baseMode & MavModeFlag.SAFETY_ARMED &&
          !(hb.baseMode & MavModeFlag.SAFETY_ARMED)
        ) {
          showToast(
            `Drone sysId=${this.sysId}, compId=${this.compId} is disarmed.`,
            ToastSeverity.Success,
          );
        }
      }

      this.lastHeartbeat.value = hb;
    } else if (msgid === GpsRawInt.MSG_ID) {
      const gps = Object.assign(new GpsRawInt(), data);
      this.lastGpsRawInt.value = gps;
    } else if (msgid === Ping.MSG_ID) {
      const pingMsg = Object.assign(new Ping(), data);
      void this.replyToPing(pingMsg);
    }
  }

  // -- Position & Orientation (computed) -------------------------------------
  public positionCartesian3 = computed<Cesium.Cartesian3 | undefined>(() => {
    const gp = this.lastGlobalPositionInt.value;
    if (!gp) return undefined;
    return calculateCartesian3Position(this.entity, gp);
  });

  public orientation = computed<Cesium.Quaternion | undefined>(() => {
    const attitude = this.lastAttitude.value;
    const gp = this.lastGlobalPositionInt.value;
    if (!attitude || !gp || gp.hdg >= 65535) {
      return undefined;
    }

    const heading = Cesium.Math.toRadians(gp.hdg / 100 - 90.0);
    const pitch = attitude.pitch;
    const roll = attitude.roll;

    const position = this.entity.position?.getValue(Cesium.JulianDate.now());
    if (!position) return undefined;

    return Cesium.Transforms.headingPitchRollQuaternion(
      position,
      new Cesium.HeadingPitchRoll(heading, pitch, roll),
    );
  });

  /**
   * Creates a Cesium Entity for this drone, hooking up model, position, and orientation.
   */
  private createCesiumEntity(): Cesium.Entity {
    const viewer = getCesiumViewer();
    return viewer.entities.add({
      name: `Drone (sysId=${this.sysId}, compId=${this.compId})`,
      properties: {
        sysId: this.sysId,
        compId: this.compId,
      },
      position: new Cesium.CallbackPositionProperty(() => {
        return this.positionCartesian3.value || Cesium.Cartesian3.ZERO;
      }, false),
      orientation: new Cesium.CallbackProperty(() => {
        return this.orientation.value || Cesium.Quaternion.IDENTITY;
      }, false),
      model: {
        uri: new URL("assets/models/Skywinger.glb", import.meta.url).href,
        scale: 1,
        minimumPixelSize: 75,
      },
    });
  }

  // -- Heartbeat logic ------------------------------------------------------

  /**
   * (Optional) Start sending heartbeats from GCS to autopilot at a given interval (ms).
   */
  public startHeartbeat(intervalMs: number) {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      void this.sendHeartbeat();
    }, intervalMs);
  }

  public stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private async sendHeartbeat(): Promise<void> {
    const hb = new Heartbeat();
    hb.type = MavType.GCS; // e.g. GCS
    hb.autopilot = MavAutopilot.INVALID;
    hb.baseMode = MavModeFlag.SAFETY_ARMED;
    hb.systemStatus = MavState.ACTIVE;
    hb.mavlinkVersion = 3;

    try {
      await this.connection.sendHttp("/api/drone/heartbeat", hb);
    } catch (err) {
      console.error("Failed sending heartbeat", err);
    }
  }

  // -- Ping -----------------------------------------------------------------

  private async replyToPing(inbound: Ping) {
    const resp = new Ping();
    resp.timeUsec = inbound.timeUsec;
    resp.seq = inbound.seq;
    resp.targetSystem = this.sysId;
    resp.targetComponent = this.compId;

    try {
      await this.connection.sendHttp("/api/drone/ping", resp, 2000);
    } catch (err) {
      console.error("Failed to reply ping", err);
    }
  }

  // -- Cleanup --------------------------------------------------------------

  public destroy() {
    this.stopHeartbeat();
    const viewer = getCesiumViewer();
    viewer.entities.remove(this.entity);
  }
}
