import type { SerialOptions, TcpOptions } from "~/types/DroneConnectionOptions";
import { UdpOptions } from "~/types/DroneConnectionOptions";
import { showToast, ToastSeverity } from "../utils/ToastService";
import { REGISTRY } from "~/types/MavlinkRegistry";

class DroneEntity {
  connectionOptions: SerialOptions | TcpOptions | UdpOptions;
  private signatureKey?: string;
  private eventSource?: EventSource;

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

  onMessage(rawMessage: unknown) {
    const messageData = rawMessage as {
      header: { msgid: number };
      messageType: string;
    };

    const MessageClass = REGISTRY[messageData.header.msgid]; // Lookup the class

    if (MessageClass) {
      //Create an instance of the class and populate it with data
      const message = new MessageClass();
      Object.assign(message, rawMessage);

      console.log(message);
    } else {
      console.warn(`Unknown message type: ${messageData.messageType}`);
    }
  }
}

class DroneCollection {
  drones: DroneEntity[] = [];

  constructor() {
    // add a single drone for now
    // this.drones.push(new DroneEntity(new TcpOptions("127.0.0.1", 55555)));
    this.drones.push(new DroneEntity(new UdpOptions()));
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
