import type { Entity, Event as CesiumEvent } from "cesium";
import mitt from "mitt";

export type Events = {
  cesiumLeftClick: Entity | undefined; // undefined: nothing selected
  cesiumRightClick: {
    entity: Entity | undefined;
    position: { x: number; y: number };
  };
  cesiumCameraMoveStart: CesiumEvent;
};

export const eventBus = mitt<Events>();
