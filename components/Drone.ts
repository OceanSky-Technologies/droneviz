import type {
  SerialOptions,
  TcpOptions,
  UdpOptions,
} from "~/types/DroneConnectionOptions";
import { showToast, ToastSeverity } from "~/utils/ToastService";
import { REGISTRY } from "~/types/MavlinkRegistry";
import { getCesiumViewer } from "./CesiumViewerWrapper";
import { setAltitude } from "~/utils/CoordinateUtils";
import {
  ConstantProperty,
  HeadingPitchRoll,
  Math,
  Transforms,
  type Entity,
} from "cesium";
import type {
  MavlinkMessageInterface,
  QueryResult,
} from "~/types/MessageInterface";
import {
  Attitude,
  AttitudeQuaternion,
  AttitudeTarget,
  AutotuneAxis,
  CommandAck,
  CommandLong,
  GlobalPositionInt,
  HomePosition,
  LocalPositionNed,
  ManualControl,
  MavCmd,
  MavResult,
  Ping,
  PositionTargetLocalNed,
  PrecisionLandMode,
  ServoOutputRaw,
} from "mavlink-mappings/dist/lib/common";
import {
  Heartbeat,
  MavAutopilot,
  MavModeFlag,
  MavState,
  MavType,
} from "mavlink-mappings/dist/lib/minimal";

const UINT16_MAX = 65535;

const defaultFetchOptions = {
  method: "POST" as any,
  baseURL: useRuntimeConfig().public.baseURL as string,
};

export class Drone {
  connectionOptions: SerialOptions | TcpOptions | UdpOptions;
  private signatureKey?: string;
  private eventSource?: EventSource;

  sysid: number = NaN;
  compid: number = NaN;

  entity?: Entity;
  lastGlobalPosition?: GlobalPositionInt;
  lastHeartbeat?: Heartbeat;
  homePosition?: HomePosition;
  lastAttitude?: Attitude;

  private heartbeatInterval: NodeJS.Timeout | null = null;
  private manualControlInterval: NodeJS.Timeout | null = null;

  private responseCallbacks: Array<{
    matcher: (message: any, rawMessage: MavlinkMessageInterface) => boolean;
    onDenied?: (message: any) => [boolean, string?];
    resolve: (message: any) => void;
    reject: (reason: any) => void;
    timeoutId: NodeJS.Timeout;
  }> = [];

  constructor(
    connectionOptions: SerialOptions | TcpOptions | UdpOptions,
    signatureKey?: string,
  ) {
    this.connectionOptions = connectionOptions;
    this.signatureKey = signatureKey;
  }

  async connect() {
    await this.sendAndExpectResponse(
      async () => {
        await this.send("/api/drone/connect", {
          connectionOptions: JSON.stringify(this.connectionOptions),
          signatureKey: JSON.stringify(this.signatureKey),
        });

        this.eventSource = new EventSource(
          new URL(
            "/api/drone/stream",
            useRuntimeConfig().public.baseURL as string,
          ),
        );

        this.eventSource.onmessage = (event) => {
          const rawMessage = JSON.parse(event.data);
          this.onMessage(rawMessage);
        };

        this.eventSource.onerror = (error) => {
          showToast(
            `Data stream error for connection ${JSON.stringify(this.connectionOptions)}: ${JSON.stringify(error)}`,
            ToastSeverity.Warn,
          );

          this.eventSource?.close();
        };
      },
      (_message, rawMessage: MavlinkMessageInterface) => {
        this.sysid = rawMessage.protocol.sysid;
        this.compid = rawMessage.protocol.compid;

        // promise is resolved when the first message (of any kind) is received
        return true;
      },
      undefined,
      "Connection timed out",
      5000,
    );

    // send heartbeat
    if (settings.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, settings.heartbeatInterval.value);
    }

    // send manual control data
    if (settings.manualControlInterval) {
      this.manualControlInterval = setInterval(() => {
        this.sendManualControl();
      }, settings.manualControlInterval.value);
    }
  }

  async disconnect() {
    this.sysid = NaN;
    this.compid = NaN;

    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.manualControlInterval !== null) {
      clearInterval(this.manualControlInterval);
      this.manualControlInterval = null;
    }

    this.eventSource?.close();
    this.eventSource = undefined;

    const data = await this.send("/api/drone/disconnect");

    if (!data.success) throw new Error(`Disconnecting failed: ${data.message}`);
  }

  private onMessage(rawMessage: MavlinkMessageInterface) {
    const clazz = REGISTRY[rawMessage.header.msgid]; // Lookup the class

    // The complete header, protocol and signature are also available in rawMessage for future use
    // console.log(rawMessage);

    if (clazz) {
      // Create an instance of the class and populate it with data
      const message = Object.assign(new clazz(), rawMessage.data);

      // check if the message is a response to a request
      for (const callback of this.responseCallbacks) {
        // check if the denied callback returns true
        if (callback.onDenied) {
          const [denied, deniedMessage] = callback.onDenied(message);
          if (denied) {
            callback.reject(
              new Error(
                deniedMessage ?? clazz + ": " + JSON.stringify(message),
              ),
            );
            clearTimeout(callback.timeoutId);
            this.responseCallbacks = this.responseCallbacks.filter(
              (cb) => cb !== callback,
            );
            break;
          }
        }

        // check if the matcher callback returns true
        if (callback.matcher(message, rawMessage)) {
          callback.resolve(message);
          clearTimeout(callback.timeoutId);
          this.responseCallbacks = this.responseCallbacks.filter(
            (cb) => cb !== callback,
          );
          break;
        }
      }

      if (message instanceof GlobalPositionInt) {
        this.lastGlobalPosition = message as GlobalPositionInt;
        this.updateEntityPosition(message as GlobalPositionInt);
      } else if (message instanceof Heartbeat) {
        this.lastHeartbeat = message as Heartbeat;
      } else if (message instanceof HomePosition) {
        this.homePosition = message as HomePosition;
      } else if (message instanceof Attitude) {
        this.lastAttitude = message as Attitude;
        this.updateEntityOrientation(message as Attitude);
      } else if (message instanceof AttitudeQuaternion) {
        // do nothing
      } else if (message instanceof ServoOutputRaw) {
        // do nothing
      } else if (message instanceof AttitudeTarget) {
        // do nothing
      } else if (message instanceof PositionTargetLocalNed) {
        // do nothing
      } else if (message instanceof LocalPositionNed) {
        // do nothing
      } else if (message instanceof Ping) {
        this.replyToPing(message);
      } else {
        // console.log(message);
      }
    } else {
      console.warn(`Unknown message ID: ${rawMessage.header.msgid}`);
    }
  }

  private send<T>(api: string, data?: T): Promise<QueryResult> {
    const promise = $fetch(api, {
      ...defaultFetchOptions,
      body: {
        ...data,
      },
    });

    return promise as Promise<QueryResult>;
  }

  private sendAndExpectResponse<T, R>(
    sendMessageToServer: () => void,
    matcher: (message: T, rawMessage: MavlinkMessageInterface) => boolean,
    onDenied?: (message: T) => [boolean, string?],
    timeoutMessage?: string,
    timeoutMs: number = 5000,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(
            timeoutMessage || "Request timed out: " + sendMessageToServer,
          ),
        );
        this.responseCallbacks = this.responseCallbacks.filter(
          (cb) => cb.timeoutId !== timeoutId,
        );
      }, timeoutMs);

      this.responseCallbacks.push({
        matcher,
        onDenied,
        resolve,
        reject,
        timeoutId,
      });

      sendMessageToServer();
    });
  }

  private async sendHeartbeat() {
    const command = new Heartbeat();
    command.type = MavType.GCS;
    command.autopilot = MavAutopilot.INVALID;
    command.baseMode =
      MavModeFlag.MANUAL_INPUT_ENABLED | MavModeFlag.SAFETY_ARMED;
    command.systemStatus = MavState.ACTIVE;
    command.mavlinkVersion = 3;

    const data = await this.send("/api/drone/heartbeat", { data: command });

    if (!data.success)
      throw new Error(`Sending heartbeat failed: ${data.message}`);
  }

  async sendManualControl() {
    const command = new ManualControl();
    command.target = 254;
    command.z = 500;

    const data = await this.send("/api/drone/manualControl", { data: command });

    if (!data.success)
      throw new Error(`Manual control failed: ${data.message}`);
  }

  private replyToPing(ping: Ping) {
    const pingReply = new Ping();
    pingReply.timeUsec = ping.timeUsec;
    pingReply.seq = ping.seq;
    pingReply.targetSystem = 42; // fixme: hardcoded
    pingReply.targetComponent = 42; // fixme: hardcoded

    this.send("/api/drone/ping", ping);
  }

  private updateEntityOrientation(message: Attitude) {
    if (!this.entity) return;
    if (!this.entity.position || !this.entity.position.getValue()) return;
    if (!this.lastGlobalPosition) return;

    if (this.lastGlobalPosition.hdg === UINT16_MAX) return;

    const heading = Math.toRadians(this.lastGlobalPosition.hdg / 100 - 90.0);
    const pitch = message.pitch - Math.toRadians(-30); // skywinger has 30 degrees pitch
    const roll = message.roll;
    const orientation = Transforms.headingPitchRollQuaternion(
      this.entity.position.getValue()!,
      new HeadingPitchRoll(heading, pitch, roll),
    );

    this.entity.orientation = new ConstantProperty(orientation);

    getCesiumViewer().scene.requestRender();
  }

  private updateEntityPosition(message: GlobalPositionInt) {
    if (!this.entity) return;

    setAltitude(this.entity, message);

    getCesiumViewer().scene.requestRender();
  }

  async arm() {
    const command = new CommandLong();
    command.command = MavCmd.COMPONENT_ARM_DISARM;
    command.targetSystem = 1;
    command._param1 = 1; // arm
    // command._param2 = 21196; // force
    command._param2 = NaN;
    command._param3 = NaN;
    command._param4 = NaN;
    command._param5 = NaN;
    command._param6 = NaN;
    command._param7 = NaN;

    await this.sendAndExpectResponse(
      () => this.send("/api/drone/commandLong", { data: command }),
      (message) => {
        if (message instanceof CommandAck) {
          if (message.command === command.command) {
            if (message.result === MavResult.ACCEPTED) return true;
            if (message.result === MavResult.IN_PROGRESS) return true;
          }
        }
        return false;
      },
      (message) => {
        if (message instanceof CommandAck) {
          if (message.command === command.command) {
            if (
              message.result !== MavResult.ACCEPTED &&
              message.result !== MavResult.IN_PROGRESS
            ) {
              return [true, "Arming failed: " + MavResult[message.result]];
            }
          }
        }
        return [false, undefined];
      },
      "Arming command timed out",
    );
  }

  async disarm() {
    const command = new CommandLong();
    command.command = MavCmd.COMPONENT_ARM_DISARM;
    command.targetSystem = 1;
    command._param1 = 0; // arm
    command._param2 = 21196; // force
    command._param3 = NaN;
    command._param4 = NaN;
    command._param5 = NaN;
    command._param6 = NaN;
    command._param7 = NaN;

    await this.sendAndExpectResponse(
      () => this.send("/api/drone/commandLong", { data: command }),
      (message) => {
        if (message instanceof CommandAck) {
          if (message.command === command.command) {
            if (message.result === MavResult.ACCEPTED) return true;
            if (message.result === MavResult.IN_PROGRESS) return true;
          }
        }
        return false;
      },
      (message) => {
        if (message instanceof CommandAck) {
          if (message.command === command.command) {
            if (
              message.result !== MavResult.ACCEPTED &&
              message.result !== MavResult.IN_PROGRESS
            ) {
              return [true, "Disarming failed: " + MavResult[message.result]];
            }
          }
        }
        return [false, undefined];
      },
      "Disarming command timed out",
    );
  }

  async takeoff() {
    const command = new CommandLong();
    command.command = MavCmd.NAV_TAKEOFF;
    command.targetSystem = 1;
    command._param1 = NaN;
    command._param2 = NaN;
    command._param3 = NaN;
    command._param4 = NaN;
    command._param5 = NaN;
    command._param6 = NaN;
    command._param7 = NaN;

    await this.sendAndExpectResponse(
      () => this.send("/api/drone/commandLong", { data: command }),
      (message) => {
        if (message instanceof CommandAck) {
          if (message.command === command.command) {
            if (message.result === MavResult.ACCEPTED) return true;
            if (message.result === MavResult.IN_PROGRESS) return true;
          }
        }
        return false;
      },
      (message) => {
        if (message instanceof CommandAck) {
          if (message.command === command.command) {
            if (
              message.result !== MavResult.ACCEPTED &&
              message.result !== MavResult.IN_PROGRESS
            ) {
              return [true, "Takeoff failed: " + MavResult[message.result]];
            }
          }
        }
        return [false, undefined];
      },
      "Takeoff command timed out",
    );
  }

  async land() {
    const command = new CommandLong();
    command.command = MavCmd.NAV_LAND;
    command.targetSystem = 1;
    command._param1 = NaN;
    command._param2 = PrecisionLandMode.DISABLED;
    command._param3 = NaN;
    command._param4 = NaN;
    command._param5 = NaN;
    command._param6 = NaN;
    command._param7 = NaN;

    await this.sendAndExpectResponse(
      () => this.send("/api/drone/commandLong", { data: command }),
      (message) => {
        if (message instanceof CommandAck) {
          if (message.command === command.command) {
            if (message.result === MavResult.ACCEPTED) return true;
            if (message.result === MavResult.IN_PROGRESS) return true;
          }
        }
        return false;
      },
      (message) => {
        if (message instanceof CommandAck) {
          if (message.command === command.command) {
            if (
              message.result !== MavResult.ACCEPTED &&
              message.result !== MavResult.IN_PROGRESS
            ) {
              return [true, "Landing failed: " + MavResult[message.result]];
            }
          }
        }
        return [false, undefined];
      },
      "Landing command timed out",
    );
  }

  async autotune() {
    const command = new CommandLong();
    command.command = MavCmd.DO_AUTOTUNE_ENABLE;
    command.targetSystem = 1;
    command.targetComponent = 1;
    command._param1 = 1; // enable
    command._param2 = AutotuneAxis.DEFAULT;
    command._param3 = NaN;
    command._param4 = NaN;
    command._param5 = NaN;
    command._param6 = NaN;
    command._param7 = NaN;

    let pollingInterval;
    let landingInProgress = false;

    await this.send("/api/drone/commandLong", { data: command });

    pollingInterval = setInterval(() => {
      this.send("/api/drone/commandLong", { data: command });
    }, 1000);

    try {
      await this.sendAndExpectResponse(
        () => {},

        (message) => {
          if (message instanceof CommandAck) {
            if (message.command === command.command) {
              if (
                message.result === MavResult.ACCEPTED ||
                message.result === MavResult.IN_PROGRESS
              ) {
                if (message.progress === 100) {
                  showToast("Autotuning completed", ToastSeverity.Success);
                  return true;
                } else {
                  if (!landingInProgress) {
                    if (message.progress === 95) {
                      showToast(
                        "Autotuning in progress: " + message.progress + "%",
                        ToastSeverity.Info,
                      );
                      showToast("Landing now!", ToastSeverity.Info);
                      landingInProgress = true;
                      this.land();
                    } else
                      showToast(
                        "Autotuning in progress: " + message.progress + "%",
                        ToastSeverity.Info,
                      );
                  }
                }
              }
            }
          }
          return false;
        },
        (message) => {
          if (message instanceof CommandAck) {
            if (message.command === command.command) {
              if (
                message.result !== MavResult.ACCEPTED &&
                message.result !== MavResult.IN_PROGRESS
              ) {
                return [
                  true,
                  "Autotuning failed: " + MavResult[message.resultParam2],
                ];
              }
            }
          }
          return [false, undefined];
        },
        "Autotuning command timed out",
        60000, // autotuning can take very long
      );
    } finally {
      clearInterval(pollingInterval);
    }
  }
}
