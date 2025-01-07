import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  Entity,
  HeadingPitchRange,
} from "cesium";
import { getCesiumViewer } from "./CesiumViewerWrapper";
import { getPreferredEntity } from "@/utils/EntityUtils";

let mouseDoubleClickHandler: ScreenSpaceEventHandler;

export function init() {
  // double click: flyTo
  getCesiumViewer().screenSpaceEventHandler.removeInputAction(
    ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
  );

  mouseDoubleClickHandler = new ScreenSpaceEventHandler(
    getCesiumViewer().scene.canvas,
  );

  mouseDoubleClickHandler.setInputAction(
    (positionEvent: ScreenSpaceEventHandler.PositionedEvent) =>
      mouseDoubleClickListener(positionEvent),
    ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
  );
}

/**
 * Handles mouse double clicks on entities. If an entity is selected the camera is moved towards it.
 * @param {ScreenSpaceEventHandler.PositionedEvent} positionEvent Mouse position event
 */
async function mouseDoubleClickListener(
  positionEvent: ScreenSpaceEventHandler.PositionedEvent,
) {
  const entities = await getCesiumViewer().scene.drillPick(
    positionEvent.position,
  );
  const entity = getPreferredEntity(entities);

  if (!defined(entity)) return;
  if (!defined(entity.id)) return;

  console.log("Double click on entity:");
  console.log(entity);

  if (entity.id instanceof Entity) {
    const headingPitchRange = new HeadingPitchRange(
      getCesiumViewer().camera.heading,
      getCesiumViewer().camera.pitch,
      45,
    );

    await getCesiumViewer().flyTo(entity.id, {
      duration: 1.0,
      offset: headingPitchRange,
    });

    getCesiumViewer().scene.requestRender();
  }
}
