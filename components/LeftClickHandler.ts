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
import { droneManager } from "~/core/drone/DroneManager";
import { eventBus } from "@/utils/Eventbus";
import { getPreferredEntity } from "@/utils/EntityUtils";
import { Colors } from "@/utils/Colors";

let mouseClickHandler: ScreenSpaceEventHandler;

export let selectedEntityHighlighter: CesiumHighlighter;

/**
 * Initializes the left-click handler, if it isn't already.
 */
export function init() {
  if (mouseClickHandler) return;

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
 * Handles mouse clicks on entities. If an entity is recognized as a drone,
 * we select/unselect that drone in the DroneManager. Otherwise, we unselect everything.
 */
async function mouseClickListener(
  positionEvent: ScreenSpaceEventHandler.PositionedEvent,
) {
  const entitiesPicked = getCesiumViewer().scene.drillPick(
    positionEvent.position,
  );
  const entity = getPreferredEntity(entitiesPicked);

  // If no entity or not a model-based entity, unselect everything
  if (
    !defined(entity) ||
    !defined(entity.id) ||
    !defined(entity.primitive) ||
    !(entity.primitive instanceof Model)
  ) {
    console.log("Unselected all entities (no valid pick).");
    selectedEntityHighlighter.clear();
    droneManager.unselectDrone();
    eventBus.emit("cesiumLeftClick", undefined);
    updateRequestRenderMode();
    return;
  }

  // If these are ConstantProperties, you can directly read them,
  // or call getValue(JulianDate.now()) for dynamic properties
  const sysId = entity.id.properties.sysId?.getValue
    ? entity.id.properties.sysId.getValue()
    : entity.id.properties.sysId;
  const compId = entity.id.properties.compId?.getValue
    ? entity.id.properties.compId.getValue()
    : entity.id.properties.compId;

  // If it doesn't have a valid sysId/compId, treat as non-drone
  if (sysId === undefined || compId === undefined) {
    console.log("Clicked entity is not a recognized Drone entity:", entity);
    selectedEntityHighlighter.clear();
    droneManager.unselectDrone();
    eventBus.emit("cesiumLeftClick", undefined);
    updateRequestRenderMode();
    return;
  }

  // Now we have a drone. Check if it's already selected or not.
  if (!selectedEntityHighlighter.contains(entity)) {
    // SELECT the drone
    console.log(`Selected entity: ${entity.id ?? "unknown ID"}`);
    selectedEntityHighlighter.add(entity);

    // Update the DroneManager selection
    droneManager.selectDrone(sysId, compId);

    eventBus.emit("cesiumLeftClick", entity);
  } else {
    // UNSELECT the drone
    console.log(`Unselected entity: ${entity.id ?? "unknown ID"}`);
    selectedEntityHighlighter.remove(entity);
    droneManager.unselectDrone();

    eventBus.emit("cesiumLeftClick", entity);
  }

  updateRequestRenderMode();
}
