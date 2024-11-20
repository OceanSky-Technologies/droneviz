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
import type { MavlinkMessageInterface } from "~/types/MessageInterface";
import type {
  Attitude,
  GlobalPositionInt,
  HomePosition,
} from "mavlink-mappings/dist/lib/common";
import type { Heartbeat } from "mavlink-mappings/dist/lib/minimal";

const UINT16_MAX = 65535;

export class DroneEntity {
  connectionOptions: SerialOptions | TcpOptions | UdpOptions;
  private signatureKey?: string;
  private eventSource?: EventSource;

  entity?: Entity;
  lastGlobalPosition?: GlobalPositionInt;
  lastHeartbeat?: Heartbeat;
  homePosition?: HomePosition;
  lastAttitude?: Attitude;

  constructor(
    connectionOptions: SerialOptions | TcpOptions | UdpOptions,
    signatureKey?: string,
  ) {
    this.connectionOptions = connectionOptions;
    this.signatureKey = signatureKey;
  }

  async connect() {
    try {
      const config = useRuntimeConfig();

      const data = await $fetch("/api/drone/connect", {
        params: {
          connectionOptions: JSON.stringify(this.connectionOptions),
          signatureKey: JSON.stringify(this.signatureKey),
        },
        baseURL: config.public.baseURL as string,
      });

      if (data.result === "success") {
        showToast("Info", "Connected!", ToastSeverity.Success);

        this.eventSource = new EventSource("/api/drone/stream");

        this.eventSource.onmessage = (event) => {
          const rawMessage = JSON.parse(event.data);
          this.onMessage(rawMessage);
        };

        this.eventSource.onerror = () => {
          showToast(
            "Warning",
            "Data stream error: " + JSON.stringify(this.connectionOptions),
            ToastSeverity.Warn,
          );
          this.eventSource?.close();
        };
      } else {
        if ("message" in data && data.message)
          showToast("Error", data.message, ToastSeverity.Error);
        else showToast("Error", "Connection failed!", ToastSeverity.Error);
      }
    } catch (e) {
      showToast(
        "Error",
        `Couldn't connect to drone: ${JSON.stringify(e)}`,
        ToastSeverity.Error,
      );
    }
  }

  async disconnect() {
    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = undefined;
      }

      const config = useRuntimeConfig();

      const data = await $fetch("/api/drone/disconnect", {
        baseURL: config.public.baseURL as string,
      });

      if (data.result === "success") {
        showToast("Info", "Disconnected!", ToastSeverity.Success);
      } else {
        if ("message" in data && data.message)
          showToast("Error", data.message, ToastSeverity.Error);
        else showToast("Error", "Disconnection failed!", ToastSeverity.Error);
      }
    } catch (e) {
      showToast(
        "Error",
        `Couldn't disconnect from drone: ${JSON.stringify(e)}`,
        ToastSeverity.Error,
      );
    }
  }

  onMessage(rawMessage: MavlinkMessageInterface) {
    const clazz = REGISTRY[rawMessage.header.msgid]; // Lookup the class

    // The complete header, protocol and signature are also available in rawMessage for future use

    if (clazz) {
      // Create an instance of the class and populate it with data
      const message = new clazz();
      Object.assign(message, rawMessage.data);

      // console.log(message);

      if (clazz.name === "GlobalPositionInt") {
        this.lastGlobalPosition = message as GlobalPositionInt;
        this.updateEntityPosition(message as GlobalPositionInt);
      } else if (clazz.name === "Heartbeat") {
        this.lastHeartbeat = message as Heartbeat;
      } else if (clazz.name === "HomePosition") {
        this.homePosition = message as HomePosition;
      } else if (clazz.name === "Attitude") {
        this.lastAttitude = message as Attitude;
        this.updateEntityOrientation(message as Attitude);
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

    const heading = Math.toRadians(this.lastGlobalPosition.hdg / 100); //Math.toRadians(45.0);
    // const heading = Math.toRadians(0);
    const pitch = message.pitch - Math.toRadians(-30); //Math.toRadians(15.0);
    const roll = message.roll; //Math.toRadians(0.0);
    const orientation = Transforms.headingPitchRollQuaternion(
      this.entity.position.getValue()!,
      new HeadingPitchRoll(heading, pitch, roll),
    );

    console.log(new HeadingPitchRoll(heading, pitch, roll));

    // this.entity.orientation = new ConstantProperty(
    //   Transforms.headingPitchRollQuaternion(
    //     this.entity.position.getValue()!,
    //     new HeadingPitchRoll(
    //       Math.toRadians(this.lastGlobalPosition.hdg / 100),
    //       message.pitch - Math.toRadians(-30), // skywinger has 30 degrees pitch which needs to be compensated for the 3D model. TODO: pitch 3D model
    //       message.roll,
    //     ),
    //   ),
    // );
    this.entity.orientation = new ConstantProperty(orientation);

    getCesiumViewer().scene.requestRender();
  }

  updateEntityPosition(message: GlobalPositionInt) {
    if (!this.entity) return;

    setAltitude(this.entity, message);

    getCesiumViewer().scene.requestRender();
  }
}

class DroneCollection {
  private drones: DroneEntity[] = [];

  addDrone(drone: DroneEntity) {
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
  }

  removeAllDrones() {
    this.drones.forEach((drone) => {
      if (drone.entity) getCesiumViewer().entities.remove(drone.entity);
    });

    this.drones = [];
  }

  connectAll() {
    this.drones.forEach((drone) => {
      drone.connect();
    });
  }

  disconnectAll() {
    this.drones.forEach((drone) => {
      drone.disconnect();
    });
  }
}

export const droneCollection = new DroneCollection();
