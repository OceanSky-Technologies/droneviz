import { SerialOptions, TcpOptions } from "~/types/DroneConnectionOptions";
import { UdpOptions } from "~/types/DroneConnectionOptions";
import { showToast, ToastSeverity } from "../utils/ToastService";
import { connect } from "net";

class DroneEntity {
  connectionOptions: SerialOptions | TcpOptions | UdpOptions;
  signatureKey?: string;

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

      console.log("fetch " + JSON.stringify(this.connectionOptions));

      const data = await $fetch("/api/drone", {
        params: {
          connectionOptions: JSON.stringify(this.connectionOptions),
        },
        baseURL: config.public.baseURL as string,
      });

      if (data.result === "success") {
        showToast("Info", "Connected!", ToastSeverity.Success);
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
}

export const droneCollection = new DroneCollection();
