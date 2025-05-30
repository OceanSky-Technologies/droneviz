import type { Entity, Cartesian3 } from "cesium";
import mitt from "mitt";
import type { Drone } from "~/core/drone/Drone";

export type Events = {
  // drone events
  droneConnected: Drone;
  droneDisconnected: Drone;
  allDronesDisconnected: undefined;
  droneUnselected: undefined;

  // menu events
  "droneRightClickMenu:close": undefined;

  // cesium events
  cesiumLeftClick: Entity | undefined; // undefined: nothing selected
  cesiumRightClick: {
    entity: Entity | undefined;
    cartesian3: Cartesian3;
    position: { x: number; y: number };
  };

  // cache events
  cacheCleared: undefined;
};

export const eventBus = mitt<Events>();
