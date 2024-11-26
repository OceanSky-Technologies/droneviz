import { ScreenSpaceEventHandler, ScreenSpaceEventType, defined } from "cesium";
import { getCesiumViewer } from "./CesiumViewerWrapper";

let mouseClickHandler: ScreenSpaceEventHandler;

export function init() {
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
  console.log("Right clicked entity:");
  console.log(entity);

  if (defined(entity)) {
    eventBus.emit("cesiumRightClick", {
      entity: entity,
      position: positionEvent.position,
    });
  } else {
    eventBus.emit("cesiumRightClick", {
      entity: undefined,
      position: positionEvent.position,
    });
  }
}
