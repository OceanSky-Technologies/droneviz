import {
  Cartographic,
  Math,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
} from "cesium";
import { getCesiumViewer } from "./CesiumViewerWrapper";
import { createViewerOptions } from "../utils/CesiumViewerOptions";

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

  const cartesian = getCesiumViewer().scene.pickPosition(
    positionEvent.position,
  );
  const cartographic = Cartographic.fromCartesian(cartesian);
  console.log(cartographic);

  if (defined(entity)) {
    eventBus.emit("cesiumRightClick", {
      entity: entity,
      position: positionEvent.position,
      cartographic: cartographic,
    });
  } else {
    eventBus.emit("cesiumRightClick", {
      entity: undefined,
      position: positionEvent.position,
      cartographic: cartographic,
    });
  }
}
