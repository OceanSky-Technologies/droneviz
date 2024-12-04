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
  AutotuneAxis,
  CommandAck,
  CommandLong,
  DoRepositionCommand,
  GlobalPositionInt,
  ManualControl,
  MavCmd,
  MavDoRepositionFlags,
  MavResult,
  Ping,
  PrecisionLandMode,
} from "mavlink-mappings/dist/lib/common";
import {
  Heartbeat,
  MavAutopilot,
  MavModeFlag,
  MavState,
  MavType,
} from "mavlink-mappings/dist/lib/minimal";

const UINT16_MAX = 65535;

// default fetch options for all requests to the server
const defaultFetchOptions = {
  method: "POST" as any,
  baseURL: useRuntimeConfig().public.baseURL as string,
};

// Interface to store a message and its reception timestamp
interface StoredMessage<T> {
  message: T; // The message instance
  timestamp: number; // Reception unix timestamp in milliseconds
}

/**
 * Drone class to handle communication with the server and the drone.
 * The class is responsible for sending messages to the server and receiving messages from the server.
 */
export class Drone {
  readonly connectionOptions: SerialOptions | TcpOptions | UdpOptions;
  private signatureKey?: string;

  // EventSource for receiving messages from the server
  private eventSource?: EventSource;

  // cesium entity to represent the drone
  entity?: Entity;

  private sysid: number = NaN;
  private compid: number = NaN;
  private lastMessages: Map<string, StoredMessage<any>> = new Map();

  // intervals for sending heartbeat and manual control data (if enabled)
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private manualControlInterval: NodeJS.Timeout | null = null;

  /**
   * Array of response callbacks for requests to the server.
   * The callbacks are removed when
   * a) a received message makes the matcher return `true` or
   * b) a received message makes the onDenied callback return `true` or
   * c) a timeout occurs: neither the matcher nor the onDenied callback return `true`.
   */
  private responseCallbacks: Array<{
    matcher: (message: any, rawMessage: MavlinkMessageInterface) => boolean;
    onDenied?: (message: any) => [boolean, string?];
    resolve: (message: any) => void;
    reject: (reason: any) => void;
    timeoutId: NodeJS.Timeout;
  }> = [];

  /**
   * Create a new Drone instance.
   * @param {SerialOptions | TcpOptions | UdpOptions} connectionOptions - The connection options for the drone.
   * @param {string} signatureKey - The signature key for the drone.
   */
  constructor(
    connectionOptions: SerialOptions | TcpOptions | UdpOptions,
    signatureKey?: string,
  ) {
    this.connectionOptions = connectionOptions;
    this.signatureKey = signatureKey;
  }

  /**
   * Get the system ID of the drone. The value is NaN if the connection is not established.
   * @returns {number} - The system ID of the drone.
   */
  getSysId(): number {
    return this.sysid;
  }

  /**
   * Get the component ID of the drone. The value is NaN if the connection is not established.
   * @returns {number} - The component ID of the drone.
   */
  getCompId(): number {
    return this.compid;
  }

  /**
   * Connect to the server and establish a connection.
   * @returns {Promise<void>} - A promise that resolves when the connection is successful.
   */
  async connect(): Promise<void> {
    this.sysid = NaN;
    this.compid = NaN;
    this.lastMessages = new Map();

    // Send connection request to server to establish a connection.
    // The event source is used to receive messages from the server.
    // sendAndExpectResponse is used to wait for the first message (of any kind) to be received and to read the sysid and compid from it.
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

    // send heartbeats
    if (settings.heartbeatInterval.value > 0) {
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, settings.heartbeatInterval.value);
    }

    // send manual control data
    if (settings.manualControlInterval.value > 0) {
      this.manualControlInterval = setInterval(() => {
        this.sendManualControl();
      }, settings.manualControlInterval.value);
    }
  }

  /**
   * Disconnect from the server and close the event source.
   * @returns {Promise<void>} - A promise that resolves when the disconnection is successful.
   */
  async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.manualControlInterval) {
      clearInterval(this.manualControlInterval);
      this.manualControlInterval = null;
    }

    this.eventSource?.close();
    this.eventSource = undefined;

    const data = await this.send("/api/drone/disconnect");

    if (!data.success) throw new Error(`Disconnecting failed: ${data.message}`);
  }

  /**
   * Handle a received message from the server.
   * @param {MavlinkMessageInterface} rawMessage - The received message from the server.
   */
  private onMessage(rawMessage: MavlinkMessageInterface) {
    const clazz = REGISTRY[rawMessage.header.msgid]; // Lookup the class

    // The complete header, protocol and signature are also available in rawMessage for future use
    // console.log(rawMessage);

    if (clazz) {
      // Create an instance of the class and populate it with data
      const message = Object.assign(new clazz(), rawMessage.data);

      // Store the last message for the given class
      this.lastMessages.set(clazz.name, {
        message: message,
        timestamp: Date.now(),
      });

      const responseCallbacksToRemove: typeof this.responseCallbacks = [];
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
            responseCallbacksToRemove.push(callback);
          }
        }

        // check if the matcher callback returns true
        if (callback.matcher(message, rawMessage)) {
          callback.resolve(message);
          clearTimeout(callback.timeoutId);
          responseCallbacksToRemove.push(callback);
        }
      }

      // remove the resolved and denied callbacks
      if (responseCallbacksToRemove.length > 0) {
        this.responseCallbacks = this.responseCallbacks.filter(
          (cb) => !responseCallbacksToRemove.includes(cb),
        );
      }

      if (message instanceof GlobalPositionInt) {
        this.updateEntityPosition(message);
      } else if (message instanceof Attitude) {
        this.updateEntityOrientation(message);
      } else if (message instanceof Ping) {
        this.replyToPing(message);
      } else {
        //console.log(message);
      }
    } else {
      console.warn(
        `Unknown message received with ID: ${rawMessage.header.msgid}`,
      );
    }
  }

  /**
   * Get the last message for the given class.
   * @param {new () => T} messageClass - The class of the message.
   * @returns {StoredMessage<T> | undefined} - The last message for the given class.
   */
  public getLastMessage<T>(
    messageClass: new () => T,
  ): StoredMessage<T> | undefined {
    // Retrieve the last message for the given class
    const messageType = messageClass.name;
    return this.lastMessages.get(messageType) as StoredMessage<T> | undefined;
  }

  /**
   * Send a message to the server.
   * @param {string} api - The API endpoint to send the message to.
   * @param {T} data - The data to send.
   * @returns {Promise<QueryResult>} - A promise that resolves with the query result.
   */
  private send<T>(api: string, data?: T): Promise<QueryResult> {
    const promise = $fetch(api, {
      ...defaultFetchOptions,
      body: {
        ...data,
      },
    });

    return promise as Promise<QueryResult>;
  }

  /**
   * Send a message to the server and wait for a response.
   * For every received message from the server, the matcher and onDenied callbacks are called.
   * If the matcher callback returns `true`, the promise is resolved with the message.
   * If the onDenied callback returns `true`, the promise is rejected with the denied message.
   * If a timeout occurs, the promise is rejected with the timeout message.
   *
   * @param {() => void} sendMessageToServer - The function to send the message to the server.
   * @param {(message: T, rawMessage: MavlinkMessageInterface) => boolean} matcher - The function to match the response message.
   * @param {(message: T) => [boolean, string?]} onDenied - The function to check if the response message is denied.
   * @param {string} timeoutMessage - The message to show when a timeout occurs.
   * @param {number} timeoutMs - The timeout in milliseconds.
   * @returns {Promise<any>} - A promise that resolves with the response or rejects with an error if the response is denied or a timeout occurs.
   */
  private sendAndExpectResponse<T>(
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

  /**
   * Send a heartbeat message to the server.
   * @returns {Promise<void>} - A promise that resolves when the heartbeat is sent successfully.
   */
  private async sendHeartbeat(): Promise<void> {
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

  /**
   * Send manual control data to the server.
   * @returns {Promise<void>} - A promise that resolves when the manual control data is sent successfully.
   */
  async sendManualControl(): Promise<void> {
    const command = new ManualControl();
    command.target = 254;
    command.z = 500;

    const data = await this.send("/api/drone/manualControl", { data: command });

    if (!data.success)
      throw new Error(`Manual control failed: ${data.message}`);
  }

  /**
   * Reply to a ping message.
   * @param {Ping} ping - The ping message to reply to.
   * @returns {Promise<QueryResult>} - A promise that resolves when the reply is sent successfully.
   */
  private replyToPing(ping: Ping): Promise<QueryResult> {
    const pingReply = new Ping();
    pingReply.timeUsec = ping.timeUsec;
    pingReply.seq = ping.seq;
    pingReply.targetSystem = 42; // fixme: hardcoded
    pingReply.targetComponent = 42; // fixme: hardcoded

    return this.send("/api/drone/ping", ping);
  }

  /**
   * Update the orientation of the entity based on the attitude message.
   * @param {Attitude} message - The attitude message to update the orientation with.
   */
  private updateEntityOrientation(message: Attitude) {
    if (!this.entity) return;
    if (!this.entity.position || !this.entity.position.getValue()) return;

    const lastglobalPositionMessage = this.getLastMessage(GlobalPositionInt);
    if (!lastglobalPositionMessage) return;

    if (lastglobalPositionMessage.message.hdg === UINT16_MAX) return;

    const heading = Math.toRadians(
      lastglobalPositionMessage.message.hdg / 100 - 90.0,
    );
    const pitch = message.pitch - Math.toRadians(-30); // skywinger has 30 degrees pitch. TODO: fix in model
    const roll = message.roll;
    const orientation = Transforms.headingPitchRollQuaternion(
      this.entity.position.getValue()!,
      new HeadingPitchRoll(heading, pitch, roll),
    );

    this.entity.orientation = new ConstantProperty(orientation);

    getCesiumViewer().scene.requestRender();
  }

  /**
   * Update the position of the entity based on the global position message.
   * @param {GlobalPositionInt} message - The global position message to update the position with.
   */
  private updateEntityPosition(message: GlobalPositionInt) {
    if (!this.entity) return;

    setAltitude(this.entity, message);

    getCesiumViewer().scene.requestRender();
  }

  /**
   * Arm the drone.
   * @returns {Promise<void>} - A promise that resolves when the drone is armed successfully.
   */
  async arm(): Promise<void> {
    const command = new CommandLong();
    command.command = MavCmd.COMPONENT_ARM_DISARM;
    command.targetSystem = 1;
    command._param1 = 1; // arm
    command._param2 = NaN; // 21196 means "force"
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

  /**
   * Disarm the drone.
   * @param {boolean} force - Whether to force disarm
   * @returns {Promise<void>} - A promise that resolves when the drone is disarmed successfully.
   */
  async disarm(force?: boolean) {
    const command = new CommandLong();
    command.command = MavCmd.COMPONENT_ARM_DISARM;
    command.targetSystem = 1;
    command._param1 = 0; // arm
    command._param2 = force ? 21196 : 0;
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

  /**
   * Takeoff the drone.
   * @returns {Promise<void>} - A promise that resolves when the drone is taken off successfully.
   */
  async takeoff(): Promise<void> {
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

  /**
   * Land the drone.
   * @returns {Promise<void>} - A promise that resolves when the drone is landed successfully.
   */
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

  /**
   * Reposition the drone to the given coordinates.
   * @param {number} latitude - The latitude to reposition the drone to.
   * @param {number} longitude - The longitude to reposition the drone to.
   * @param {number} altitude - The altitude to reposition the drone to (MSL).
   * @returns {Promise<void>} - A promise that resolves when the drone is repositioned successfully.
   * @throws {Error} - Throws an error if the coordinates are invalid.
   */
  async doReposition(
    latitude: number,
    longitude: number,
    altitude: number,
  ): Promise<void> {
    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      isNaN(altitude) ||
      latitude <= 0 ||
      longitude <= 0
    )
      throw new Error("Invalid coordinates");

    const command = new DoRepositionCommand();
    command.latitude = latitude * 1e7;
    command.longitude = longitude * 1e7;
    command.altitude = altitude;
    command.targetSystem = 1;
    command.yaw = NaN;
    command.speed = -1;
    command.bitmask = MavDoRepositionFlags.CHANGE_MODE;

    await this.sendAndExpectResponse(
      () => this.send("/api/drone/commandInt", { data: command }),
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
              return [
                true,
                "Repositioning failed: " + MavResult[message.result],
              ];
            }
          }
        }
        return [false, undefined];
      },
      "Repositioning command timed out",
    );
  }

  /**
   * Start the autotuning process.
   * @returns {Promise<void>} - A promise that resolves when the autotuning is completed successfully.
   */
  async autotune(): Promise<void> {
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
