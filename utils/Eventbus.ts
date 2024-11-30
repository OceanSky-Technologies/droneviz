import type { Entity, Event as CesiumEvent, Cartographic } from "cesium";
import mitt from "mitt";
import type { Drone } from "~/components/Drone";

export type Events = {
  // drone events
  droneConnected: Drone;
  droneDisconnected: Drone;
  allDronesDisconnected: void;

  // cesium events
  cesiumLeftClick: Entity | undefined; // undefined: nothing selected
  cesiumRightClick: {
    entity: Entity | undefined;
    position: { x: number; y: number };
    cartographic: Cartographic;
  };
  cesiumCameraMoveStart: CesiumEvent;
};

export const eventBus = mitt<Events>();
