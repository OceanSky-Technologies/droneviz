import type {
  SerialOptions,
  TcpOptions,
  UdpOptions,
} from "~/types/DroneConnectionOptions";
import { showToast, ToastSeverity } from "../utils/ToastService";
import { REGISTRY } from "~/types/MavlinkRegistry";
import { getCesiumViewer } from "./CesiumViewerWrapper";
import type { Entity } from "cesium";
import type { MavlinkMessageInterface } from "~/types/MessageInterface";

export class DroneEntity {
  connectionOptions: SerialOptions | TcpOptions | UdpOptions;
  private signatureKey?: string;
  private eventSource?: EventSource;

  entity?: Entity;

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

      console.log(message);

      // TODO: update this.entity with the new position
    } else {
      console.warn(`Unknown message ID: ${rawMessage.header.msgid}`);
    }
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
