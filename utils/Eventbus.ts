import type { Entity, Cartesian3 } from "cesium";
import mitt from "mitt";
import type { Drone } from "@/core/Drone";
import { darkMode } from "../core/DarkMode";

export type Events = {
  // drone events
  droneConnected: Drone;
  droneDisconnected: Drone;
  allDronesDisconnected: void;

  // cesium events
  cesiumLeftClick: Entity | undefined; // undefined: nothing selected
  cesiumRightClick: {
    entity: Entity | undefined;
    cartesian3: Cartesian3;
    position: { x: number; y: number };
  };

  darkMode: boolean;
};

export const eventBus = mitt<Events>();
