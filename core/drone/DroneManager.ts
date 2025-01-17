// DroneManager.ts
import { ref } from "vue";
import { MavlinkConnection } from "./MavlinkConnection";
import type { Drone } from "./Drone";
import { UdpOptions } from "../../types/DroneConnectionOptions";

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
  public selectedDrone: Ref<Drone | undefined> = ref(undefined);

  /** Helper to select a specific Drone by sysId/compId. */
  selectDrone(sysId: number, compId: number) {
    const drone = this.connection.getDrone(sysId, compId);
    if (drone) {
      this.selectedDrone.value = drone;
      console.log(`Selected drone sysId=${sysId}, compId=${compId}`);
    } else {
      console.warn(`No drone found with sysId=${sysId}, compId=${compId}`);
      this.selectedDrone.value = undefined;
    }
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
    this.selectedDrone.value = undefined;
  }
}

export const droneManager = new DroneManager(
  new MavlinkConnection(new UdpOptions()),
);
