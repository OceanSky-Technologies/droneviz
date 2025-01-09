import {
  Model,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
} from "cesium";
import { getCesiumViewer } from "./CesiumViewerWrapper";

let mouseClickHandler: ScreenSpaceEventHandler;

export function init() {
  if (mouseClickHandler) return;

  mouseClickHandler = new ScreenSpaceEventHandler(
    getCesiumViewer().scene.canvas,
  );

  mouseClickHandler.setInputAction(
    (positionEvent: ScreenSpaceEventHandler.PositionedEvent) =>
      mouseClickListener(positionEvent),
    ScreenSpaceEventType.RIGHT_CLICK,
  );
}

/**
 * Handles mouse right clicks on entities.
 * @param {ScreenSpaceEventHandler.PositionedEvent} positionEvent Mouse position event
 */
async function mouseClickListener(
  positionEvent: ScreenSpaceEventHandler.PositionedEvent,
) {
  const entity = await getCesiumViewer().scene.pick(positionEvent.position);

  const cartesian3 = getCesiumViewer().scene.pickPosition(
    positionEvent.position,
  );

  if (
    defined(entity) &&
    defined(entity.primitive) &&
    entity.primitive instanceof Model
  ) {
    console.log("Right clicked entity:");
    console.log(entity);

    eventBus.emit("cesiumRightClick", {
      entity: entity,
      position: positionEvent.position,
      cartesian3: cartesian3,
    });
  } else {
    console.log("Right clicked position:");
    console.log(positionEvent.position);

    eventBus.emit("cesiumRightClick", {
      entity: undefined,
      position: positionEvent.position,
      cartesian3: cartesian3,
    });
  }
}
