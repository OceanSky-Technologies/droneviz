import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Color,
  defined,
  Model,
} from "cesium";
import CesiumHighlighter from "./CesiumHighlighter.vue";
import {
  getCesiumViewer,
  updateRequestRenderMode,
} from "./CesiumViewerWrapper";
import { droneCollection } from "@/core/DroneCollection";

let mouseClickHandler: ScreenSpaceEventHandler;
export let selectedEntityHighlighter: CesiumHighlighter;

export function init() {
  // single click: select
  mouseClickHandler = new ScreenSpaceEventHandler(
    getCesiumViewer().scene.canvas,
  );

  mouseClickHandler.setInputAction(
    (positionEvent: ScreenSpaceEventHandler.PositionedEvent) =>
      mouseClickListener(positionEvent),
    ScreenSpaceEventType.LEFT_CLICK,
  );

  selectedEntityHighlighter = new CesiumHighlighter(
    getCesiumViewer().scene,
    undefined,
    {
      color: Color.fromCssColorString(Colors.BLUE),
      size: 8,
    },
  );
}

/**
 * Handles mouse clicks on entities. If an entity is selected it gets selected/unselected.
 * @param {ScreenSpaceEventHandler.PositionedEvent} positionEvent Mouse position event
 */
async function mouseClickListener(
  positionEvent: ScreenSpaceEventHandler.PositionedEvent,
) {
  const entity = await getCesiumViewer().scene.pick(positionEvent.position);

  if (
    !defined(entity) ||
    !defined(entity.primitive) ||
    !(entity.primitive instanceof Model)
  ) {
    console.log("Unselected all entities");
    selectedEntityHighlighter.clear();
    droneCollection.selectedDrone.value = undefined;
    eventBus.emit("cesiumLeftClick", undefined);
    return;
  }

  if (!selectedEntityHighlighter.contains(entity)) {
    console.log("Selected entity:");
    console.log(entity);

    selectedEntityHighlighter.add(entity);
    droneCollection.selectDrone(0);

    eventBus.emit("cesiumLeftClick", entity);
  } else {
    console.log("Unselected entity:");
    console.log(entity);

    selectedEntityHighlighter.remove(entity);
    droneCollection.selectedDrone.value = undefined;

    eventBus.emit("cesiumLeftClick", entity);
  }

  updateRequestRenderMode();
}
