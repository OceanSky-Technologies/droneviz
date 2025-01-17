import {
  ScreenSpaceEventHandler,
  Entity,
  ScreenSpaceEventType,
  Color,
  HorizontalOrigin,
  VerticalOrigin,
  Cartesian2,
  defined,
  Label,
  Cartographic,
  ConstantPositionProperty,
  ConstantProperty,
  Math,
} from "cesium";
import CesiumHighlighter from "./CesiumHighlighter.vue";
import {
  getCesiumViewer,
  googleTilesEnabled,
  updateRequestRenderMode,
} from "./CesiumViewerWrapper";
import * as egm96 from "egm96-universal";
import { Colors } from "@/utils/Colors";
import { settings } from "@/utils/Settings";
import { formatCoordinate, getHeight } from "@/utils/CoordinateUtils";

let mouseMoveHandler: ScreenSpaceEventHandler;
export let mouseOverHighlighter: CesiumHighlighter;
let mousePositionInfoEntity: Entity;

export function init() {
  if (mouseMoveHandler) return;

  // mouse over: highlight
  mouseMoveHandler = new ScreenSpaceEventHandler(
    getCesiumViewer().scene.canvas,
  );

  mouseMoveHandler.setInputAction(
    (motionEvent: ScreenSpaceEventHandler.MotionEvent) =>
      mouseOverListener(motionEvent),
    ScreenSpaceEventType.MOUSE_MOVE,
  );

  mouseOverHighlighter = new CesiumHighlighter(
    getCesiumViewer().scene,
    Color.fromCssColorString(Colors.RED),
  );

  // position info at mouse position
  mousePositionInfoEntity = getCesiumViewer().entities.add({
    id: "mouse-position-info",
    label: {
      show: false,
      showBackground: true,
      font: "15px monospace", // Ensure 'monospace' is a fallback font
      horizontalOrigin: HorizontalOrigin.LEFT,
      verticalOrigin: VerticalOrigin.TOP,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      pixelOffset: new Cartesian2(15, 15),
    },
  });
}

/**
 * Handles mouse movements. If the mouse is over an entity it gets highlighted / unhighlighted and position info is shown if enabled.
 * @param {ScreenSpaceEventHandler.MotionEvent} motionEvent Mouse motion event
 */
async function mouseOverListener(
  motionEvent: ScreenSpaceEventHandler.MotionEvent,
) {
  if (settings.enableMousePositionInfo.value)
    showPositionInfoEntity(motionEvent.endPosition);

  const entity = await getCesiumViewer().scene.pick(motionEvent.endPosition);

  if (
    !defined(entity) ||
    !defined(entity.id) ||
    !(entity.id instanceof Entity) ||
    entity.primitive instanceof Label
  ) {
    mouseOverHighlighter.clear();
    updateRequestRenderMode();
    return;
  }

  if (mouseOverHighlighter.contains(entity)) {
    updateRequestRenderMode();
    return;
  }

  mouseOverHighlighter.clear();

  // add entity to the array
  console.log("Mouse over entity:", entity);

  mouseOverHighlighter.add(entity);

  updateRequestRenderMode();
}

/**
 * Show information on the given position.
 * @param {Cartesian2} position The position where/for which the info shall be shown.
 */
async function showPositionInfoEntity(position: Cartesian2) {
  if (!mousePositionInfoEntity.label) return;

  // show a position data text box next to the mouse cursor
  try {
    // get the position below the mouse
    const cartesian3 = getCesiumViewer().scene.pickPosition(position);
    const cartographic = Cartographic.fromCartesian(cartesian3);
    const latitudeDegrees = Math.toDegrees(cartographic.latitude);
    const longitudeDegrees = Math.toDegrees(cartographic.longitude);

    mousePositionInfoEntity.position = new ConstantPositionProperty(cartesian3);

    // 6 decimal places equal 10 cm resolution. 12 digits are maximum (+1 for °).
    const longitudeString = formatCoordinate(longitudeDegrees).padStart(
      13,
      " ",
    );
    const latitudeString = formatCoordinate(latitudeDegrees).padStart(13, " ");

    const heightMSLString =
      egm96
        .meanSeaLevel(latitudeDegrees, longitudeDegrees)
        .toFixed(2)
        .padStart(12, " ") + "m";

    // if (!mousePositionInfoEntity.label.show)
    mousePositionInfoEntity.label.show = new ConstantProperty(true);

    const height = await getHeight(cartesian3);

    if (height === undefined) {
      mousePositionInfoEntity.label.text = new ConstantProperty(
        `Lat:    ${latitudeString}` +
          `\nLon:    ${longitudeString}` +
          `\nHeight: ${heightMSLString}`,
      );

      getCesiumViewer().scene.requestRender();
      return;
    }

    const heightString = height.toFixed(2).padStart(12, " ") + "m";

    if (googleTilesEnabled()) {
      mousePositionInfoEntity.label.text = new ConstantProperty(
        `Lat:     ${latitudeString}` +
          `\nLon:     ${longitudeString}` +
          `\nMSL:     ${heightMSLString}` +
          `\n3D:      ${heightString}`,
      );
    } else {
      mousePositionInfoEntity.label.text = new ConstantProperty(
        `Lat:     ${latitudeString}` +
          `\nLon:     ${longitudeString}` +
          `\nMSL:     ${heightMSLString}` +
          `\nTerrain: ${heightString}`,
      );
    }
  } catch (e) {
  } finally {
    getCesiumViewer().scene.requestRender();
  }
}
