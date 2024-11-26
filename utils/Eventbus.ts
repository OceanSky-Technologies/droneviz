import type { Entity } from "cesium";
import mitt from "mitt";

export type Events = {
  cesiumInitialized: void;
  cesiumLeftClick: Entity | undefined; // undefined: nothing selected
  cesiumRightClick: {
    entity: Entity | undefined;
    position: { x: number; y: number };
  };
};

export const eventBus = mitt<Events>();
