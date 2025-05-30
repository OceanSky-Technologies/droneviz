// DroneCommands.ts
import { showToast, ToastSeverity } from "@/utils/ToastService";
import type { Drone } from "./Drone";

// MAVLink commands:
import {
  CommandLong,
  CommandAck,
  MavCmd,
  MavResult,
  PrecisionLandMode,
  DoRepositionCommand,
  DoOrbitCommand,
  AutotuneAxis,
  MavDoRepositionFlags,
} from "mavlink-mappings/dist/lib/common";

/**
 * Provides high-level flight commands for a given Drone.
 */
export class DroneCommands {
  constructor(private drone: Drone) {}

  // ------------------------------------------------------------
  // Helpers that wait for CommandAck (ACCEPTED or IN_PROGRESS)
  // ------------------------------------------------------------
  private async expectCommandLongAck(cmd: any, failMsg: string) {
    cmd.targetSystem = this.drone.sysId;
    cmd.targetComponent = this.drone.compId;

    const connection = this.drone.connection;
    await connection.sendAndExpectResponse<CommandAck>(
      () =>
        connection.sendCommandLong(this.drone.sysId, this.drone.compId, cmd),
      (ack: CommandAck) => {
        return (
          ack instanceof CommandAck &&
          ack.command === cmd.command &&
          (ack.result === MavResult.ACCEPTED ||
            ack.result === MavResult.IN_PROGRESS)
        );
      },
      (ack) => {
        if (ack instanceof CommandAck && ack.command === cmd.command) {
          if (
            ack.result !== MavResult.ACCEPTED &&
            ack.result !== MavResult.IN_PROGRESS
          ) {
            return [true, `${failMsg}: MavResult=${MavResult[ack.result]}`];
          }
        }
        return [false];
      },
      `${failMsg} (timeout)`,
      5000,
    );
  }

  private async expectCommandIntAck(cmd: any, failMsg: string) {
    cmd.targetSystem = this.drone.sysId;
    cmd.targetComponent = this.drone.compId;

    const connection = this.drone.connection;
    await connection.sendAndExpectResponse<CommandAck>(
      () => connection.sendCommandInt(this.drone.sysId, this.drone.compId, cmd),
      (ack: CommandAck) => {
        return (
          ack instanceof CommandAck &&
          ack.command === cmd.command &&
          (ack.result === MavResult.ACCEPTED ||
            ack.result === MavResult.IN_PROGRESS)
        );
      },
      (ack) => {
        if (ack instanceof CommandAck && ack.command === cmd.command) {
          if (
            ack.result !== MavResult.ACCEPTED &&
            ack.result !== MavResult.IN_PROGRESS
          ) {
            return [true, `${failMsg}: MavResult=${MavResult[ack.result]}`];
          }
        }
        return [false];
      },
      `${failMsg} (timeout)`,
      5000,
    );
  }

  // ------------------------------------------------------------
  // Actual commands
  // ------------------------------------------------------------
  public async arm(force = false): Promise<void> {
    const cmd = new CommandLong();
    cmd.command = MavCmd.COMPONENT_ARM_DISARM;
    cmd._param1 = 1; // arm
    cmd._param2 = force ? 21196 : 0;
    await this.expectCommandLongAck(cmd, "Arming failed");
    showToast("Drone arming initiated.", ToastSeverity.Info);
  }

  public async disarm(force = false): Promise<void> {
    const cmd = new CommandLong();
    cmd.command = MavCmd.COMPONENT_ARM_DISARM;
    cmd._param1 = 0; // disarm
    cmd._param2 = force ? 21196 : 0;
    await this.expectCommandLongAck(cmd, "Disarming failed");
    showToast("Drone disarming initiated.", ToastSeverity.Info);
  }

  public async takeoff(): Promise<void> {
    const cmd = new CommandLong();
    cmd.command = MavCmd.NAV_TAKEOFF;
    cmd._param1 = NaN;
    cmd._param2 = NaN;
    cmd._param3 = NaN;
    cmd._param4 = NaN;
    cmd._param5 = NaN;
    cmd._param6 = NaN;
    cmd._param7 = NaN;
    await this.expectCommandLongAck(cmd, "Takeoff failed");
    showToast("Takeoff initiated.", ToastSeverity.Info);
  }

  public async land(): Promise<void> {
    const cmd = new CommandLong();
    cmd.command = MavCmd.NAV_LAND;
    cmd._param1 = NaN;
    cmd._param2 = PrecisionLandMode.DISABLED;
    cmd._param3 = NaN;
    cmd._param4 = NaN;
    cmd._param5 = NaN;
    cmd._param6 = NaN;
    cmd._param7 = NaN;
    await this.expectCommandLongAck(cmd, "Landing failed");
    showToast("Landing initiated.", ToastSeverity.Info);
  }

  public async doReposition(latDeg: number, lonDeg: number, altMeters: number) {
    const cmd = new DoRepositionCommand();
    cmd.latitude = Math.round(latDeg * 1e7);
    cmd.longitude = Math.round(lonDeg * 1e7);
    cmd.altitude = altMeters;
    cmd.speed = -1;
    cmd.bitmask = MavDoRepositionFlags.CHANGE_MODE;
    cmd.radius = 0;
    cmd.yaw = NaN;
    await this.expectCommandIntAck(cmd, "Repositioning failed");
    showToast("Reposition command accepted.", ToastSeverity.Success);
  }

  public async doOrbit(
    latDeg: number,
    lonDeg: number,
    altMeters: number,
    radius: number,
    yawBehavior: number,
    velocity: number,
    orbits: number,
  ) {
    const cmd = new DoOrbitCommand();
    cmd.latitude = Math.round(latDeg * 1e7);
    cmd.longitude = Math.round(lonDeg * 1e7);
    cmd.altitude = altMeters;
    cmd.radius = radius;
    cmd.yawBehavior = yawBehavior;
    cmd.velocity = velocity;
    cmd.orbits = orbits;
    await this.expectCommandIntAck(cmd, "Orbit command failed");
    showToast("Orbit command accepted.", ToastSeverity.Success);
  }

  /**
   * Example of repeating a DO_AUTOTUNE_ENABLE until progress=100.
   */
  public async autotune(): Promise<void> {
    const cmd = new CommandLong();
    cmd.command = MavCmd.DO_AUTOTUNE_ENABLE;
    cmd._param1 = 1;
    cmd._param2 = AutotuneAxis.DEFAULT;

    let landingInProgress = false;
    const conn = this.drone.connection;

    // Send once
    await conn.sendCommandLong(this.drone.sysId, this.drone.compId, cmd);

    // Re-send the same command every second
    const intervalId = setInterval(() => {
      void conn.sendCommandLong(this.drone.sysId, this.drone.compId, cmd);
    }, 1000);

    try {
      // Wait for SSE CommandAck with progress=100
      await conn.sendAndExpectResponse<CommandAck>(
        () => Promise.resolve(),
        (ack) => {
          if (ack instanceof CommandAck && ack.command === cmd.command) {
            if (
              ack.result === MavResult.ACCEPTED ||
              ack.result === MavResult.IN_PROGRESS
            ) {
              if (ack.progress === 100) {
                showToast("Autotuning completed!", ToastSeverity.Success);
                return true;
              } else if (!landingInProgress && ack.progress === 95) {
                showToast(`Autotuning: ${ack.progress}%`, ToastSeverity.Info);
                showToast("Landing to finalize autotune!", ToastSeverity.Info);
                landingInProgress = true;
                void this.land();
              } else {
                showToast(`Autotuning: ${ack.progress}%`, ToastSeverity.Info);
              }
            }
          }
          return false;
        },
        (ack) => {
          if (ack instanceof CommandAck && ack.command === cmd.command) {
            if (
              ack.result !== MavResult.ACCEPTED &&
              ack.result !== MavResult.IN_PROGRESS
            ) {
              return [true, `Autotuning failed: result=${ack.result}`];
            }
          }
          return [false];
        },
        "Autotuning command timed out",
        60000,
      );
    } finally {
      clearInterval(intervalId);
    }
  }
}
