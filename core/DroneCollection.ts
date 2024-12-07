import { getCesiumViewer } from "@/components/CesiumViewerWrapper";
import type { Drone } from "./Drone";

class DroneCollection {
  private drones: Drone[] = [];
  selectedDrone = ref<Drone | undefined>(undefined);

  selectDrone(id: number) {
    this.selectedDrone.value = this.getDrone(id);
  }

  addDrone(drone: Drone): Drone {
    const num = this.drones.push(drone);

    const entity = getCesiumViewer().entities.add({
      id: num.toString(),
      model: {
        uri: new URL("assets/models/Skywinger.glb", import.meta.url).href,
        scale: 1,
        minimumPixelSize: 75,
        maximumScale: 20000,
      },
    });

    this.drones[num - 1].entity = entity;

    return this.drones[num - 1];
  }

  getDrone(index: number): Drone | undefined {
    if (index < 0 || index >= this.drones.length) return undefined;

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
