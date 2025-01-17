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
  const cartesian3 = getCesiumViewer().scene.pickPosition(
    positionEvent.position,
  );

  const entities = getCesiumViewer().scene.drillPick(positionEvent.position);
  const entity = getPreferredEntity(entities);

  if (
    defined(entity) &&
    defined(entity.primitive) &&
    !entity.id.id.startsWith("ego-") &&
    entity.id.id !== "mouse-position-info" &&
    entity.primitive instanceof Model
  ) {
    console.log("Right clicked entity:", entity);

    eventBus.emit("cesiumRightClick", {
      entity: entity,
      position: positionEvent.position,
      cartesian3: cartesian3,
    });
  } else {
    console.log("Right clicked position:", positionEvent.position);

    eventBus.emit("cesiumRightClick", {
      entity: undefined,
      position: positionEvent.position,
      cartesian3: cartesian3,
    });
  }
}
