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
  ProtocolInterface,
} from "~/types/MessageInterface";
import {
  Attitude,
  AttitudeQuaternion,
  AttitudeTarget,
  CommandLong,
  GlobalPositionInt,
  HomePosition,
  LocalPositionNed,
  ManualControl,
  MavCmd,
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

let resolveProtocolPromise: (value: ProtocolInterface) => void;
let rejectProtocolPromise: () => void;

export class DroneEntity {
  connectionOptions: SerialOptions | TcpOptions | UdpOptions;
  private signatureKey?: string;
  private eventSource?: EventSource;

  entity?: Entity;
  lastGlobalPosition?: GlobalPositionInt;
  lastHeartbeat?: Heartbeat;
  homePosition?: HomePosition;
  lastAttitude?: Attitude;

  protocolPromise = new Promise<ProtocolInterface>(() => {});
  dataReceived: boolean = false;

  private heartbeatInterval: NodeJS.Timeout | null = null;
  private manualControlInterval: NodeJS.Timeout | null = null;

  constructor(
    connectionOptions: SerialOptions | TcpOptions | UdpOptions,
    signatureKey?: string,
  ) {
    this.connectionOptions = connectionOptions;
    this.signatureKey = signatureKey;
  }

  async connect() {
    this.dataReceived = false;

    // create a new data received promise
    this.protocolPromise = new Promise<ProtocolInterface>((resolve, reject) => {
      resolveProtocolPromise = resolve;
      rejectProtocolPromise = reject;
    });

    const data = await $fetch("/api/drone/connect", {
      method: "POST",
      body: {
        connectionOptions: JSON.stringify(this.connectionOptions),
        signatureKey: JSON.stringify(this.signatureKey),
      },
      baseURL: useRuntimeConfig().public.baseURL as string,
    });

    if (data.result === "success") {
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

        rejectProtocolPromise();

        this.eventSource?.close();
      };

      // wait until data was received
      await this.protocolPromise;

      // send heartbeat
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, 1000);

      // send manual control data
      this.manualControlInterval = setInterval(() => {
        this.sendManualControl();
      }, 40);
    } else {
      rejectProtocolPromise();

      if ("message" in data && data.message) throw new Error(data.message);
      else throw new Error(JSON.stringify(data));
    }
  }

  async disconnect() {
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

    const data = await $fetch("/api/drone/disconnect", {
      method: "POST",
      baseURL: useRuntimeConfig().public.baseURL as string,
    });

    if (data.result !== "success") {
      if ("message" in data && data.message) throw new Error(data.message);
      else throw new Error(JSON.stringify(data));
    }
  }

  async sendHeartbeat() {
    const command = new Heartbeat();
    command.type = MavType.GCS;
    command.autopilot = MavAutopilot.INVALID;
    command.baseMode =
      MavModeFlag.MANUAL_INPUT_ENABLED | MavModeFlag.SAFETY_ARMED;
    command.systemStatus = MavState.ACTIVE;
    command.mavlinkVersion = 3;

    const data = await $fetch("/api/drone/heartbeat", {
      method: "POST",
      body: {
        data: command,
      },
      baseURL: useRuntimeConfig().public.baseURL as string,
    });

    if (data.result !== "success") {
      if ("message" in data && data.message)
        throw new Error(`Sending heartbeat failed: ${data.message}`);
      else throw new Error("Sending heartbeat failed");
    }
  }

  async sendManualControl() {
    const command = new ManualControl();
    command.target = 254;
    command.z = 500;

    const data = await $fetch("/api/drone/manualControl", {
      method: "POST",
      body: {
        data: command,
      },
      baseURL: useRuntimeConfig().public.baseURL as string,
    });

    if (data.result !== "success") {
      if ("message" in data && data.message)
        throw new Error(`Manual control failed: ${data.message}`);
      else throw new Error("Manual control failed");
    }
  }

  onMessage(rawMessage: MavlinkMessageInterface) {
    const clazz = REGISTRY[rawMessage.header.msgid]; // Lookup the class

    // The complete header, protocol and signature are also available in rawMessage for future use
    // console.log(rawMessage);

    if (!this.dataReceived) {
      resolveProtocolPromise(rawMessage.protocol);
      this.dataReceived = true;
    }

    if (clazz) {
      // Create an instance of the class and populate it with data
      const message = new clazz();
      Object.assign(message, rawMessage.data);

      if (message instanceof GlobalPositionInt) {
        this.lastGlobalPosition = message as GlobalPositionInt;
        this.updateEntityPosition(message as GlobalPositionInt);
      } else if (message instanceof Heartbeat) {
        this.lastHeartbeat = message as Heartbeat;
        console.log(this.lastHeartbeat);
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
      } else {
        console.log(message);
      }
    } else {
      console.warn(`Unknown message ID: ${rawMessage.header.msgid}`);
    }
  }

  updateEntityOrientation(message: Attitude) {
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

  updateEntityPosition(message: GlobalPositionInt) {
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

    const data = await $fetch("/api/drone/command", {
      method: "POST",
      body: {
        command: command,
      },
      baseURL: useRuntimeConfig().public.baseURL as string,
    });

    if (data.result !== "success") {
      if ("message" in data && data.message)
        throw new Error(`Arming failed: ${data.message}`);
      else throw new Error("Arming failed");
    }
  }

  async disarm() {
    const command = new CommandLong();
    command.command = MavCmd.COMPONENT_ARM_DISARM;
    command.targetSystem = 1;
    command._param1 = 0; // arm
    command._param2 = 21196; // force

    const data = await $fetch("/api/drone/command", {
      method: "POST",
      body: {
        command: command,
      },
      baseURL: useRuntimeConfig().public.baseURL as string,
    });

    if (data.result !== "success") {
      if ("message" in data && data.message)
        throw new Error(`Disarming failed: ${data.message}`);
      else throw new Error("Disarming failed");
    }
  }

  async takeoff() {
    const command = new CommandLong();
    command.command = MavCmd.NAV_TAKEOFF_LOCAL;
    command.targetSystem = 1;
    command._param3 = 5;

    const data = await $fetch("/api/drone/command", {
      method: "POST",
      body: {
        command: command,
      },
      baseURL: useRuntimeConfig().public.baseURL as string,
    });

    if (data.result !== "success") {
      if ("message" in data && data.message)
        throw new Error(`Takeoff failed: ${data.message}`);
      else throw new Error("Takeoff failed");
    }
  }

  async land() {
    const command = new CommandLong();
    command.command = MavCmd.NAV_LAND;
    command.targetSystem = 1;
    command._param2 = PrecisionLandMode.DISABLED;

    const data = await $fetch("/api/drone/command", {
      method: "POST",
      body: {
        command: command,
      },
      baseURL: useRuntimeConfig().public.baseURL as string,
    });

    if (data.result !== "success") {
      if ("message" in data && data.message)
        throw new Error(`Landing failed: ${data.message}`);
      else throw new Error("Landing failed");
    }
  }
}

class DroneCollection {
  private drones: DroneEntity[] = [];

  addDrone(drone: DroneEntity): DroneEntity {
    const num = this.drones.push(drone);

    const entity = getCesiumViewer().entities.add({
      id: num.toString(),
      model: {
        uri: new URL("assets/models/Skywinger.glb", import.meta.url).href,
        scale: 1,
        minimumPixelSize: 50,
        maximumScale: 20000,
      },
    });

    this.drones[num - 1].entity = entity;

    return this.drones[num - 1];
  }

  getDrone(index: number) {
    if (index < 0 || index >= this.drones.length)
      throw Error("Index out of bounds!");

    return this.drones[index];
  }

  getNumDrones() {
    return this.drones.length;
  }

  removeAllDrones() {
    this.drones.forEach((drone) => {
      if (drone.entity) getCesiumViewer().entities.remove(drone.entity);
    });

    this.drones = [];
  }

  async connectAll() {
    await Promise.all(
      this.drones.map((drone) => {
        return drone.connect();
      }),
    );
  }

  async disconnectAll() {
    await Promise.all(
      this.drones.map((drone) => {
        return drone.disconnect();
      }),
    );
  }
}

export const droneCollection = new DroneCollection();
