import { ref } from "vue";
import { MavlinkConnection } from "./MavlinkConnection";
import type { Drone } from "./Drone";
import { UdpOptions } from "@/types/DroneConnectionOptions";
import { ToastSeverity } from "@/utils/ToastService";

export class DroneManager {
  public connection: MavlinkConnection;

  constructor(connection: MavlinkConnection) {
    this.connection = connection;
  }

  /** Return all drones from the connection (array). */
  get allDrones() {
    return this.connection.getAllDrones();
  }

  /** The currently selected Drone instance, or undefined. */
  private selectedDroneRef: Ref<Drone | undefined> = ref(undefined);

  /** Helper to select a specific Drone by sysId/compId. */
  selectDrone(sysId: number, compId: number) {
    const drone = this.connection.getDrone(sysId, compId);
    if (drone) {
      this.selectedDroneRef.value = drone;
      showToast(`Selected drone ${sysId}-${compId}`, ToastSeverity.Success);
    } else {
      showToast(
        `No drone found with sysId=${sysId}, compId=${compId}`,
        ToastSeverity.Error,
      );
    }
  }

  unselectDrone() {
    this.selectedDroneRef.value = undefined;
    console.log("Unselected drone.");
    eventBus.emit("droneUnselected");
  }

  get selectedDrone() {
    return this.selectedDroneRef;
  }

  /** Connect once. */
  async connect() {
    await this.connection.connect();
  }

  /** Disconnect once. */
  async disconnect(force = false) {
    await this.connection.disconnect(force);
  }

  /**
   * Destroy and remove all Drones.
   * Also clears the internal Map in the connection.
   */
  destroyAllDrones() {
    this.connection.destroyAllDrones();
    this.unselectDrone();
  }
}

export const droneManager = new DroneManager(
  //new MavlinkConnection(new UdpOptions()), // REAL DRONE

  new MavlinkConnection(
    new UdpOptions(true, "udp4", "0.0.0.0", 14550, "192.168.144.143", 18570),
  ), // SIMULATOR
);
