import CesiumHighlighter from "./CesiumHighlighter.vue";
import { settings } from "~/components/Settings";
import { Colors } from "~/utils/Colors";
import {
  Color,
  ScreenSpaceEventHandler,
  defined,
  Math,
  Model,
  Entity,
  HeadingPitchRange,
  ScreenSpaceEventType,
  Cartographic,
  HorizontalOrigin,
  VerticalOrigin,
  Cartesian2,
  ConstantProperty,
  Label,
  sampleTerrainMostDetailed,
  ConstantPositionProperty,
} from "cesium";
import * as egm96 from "egm96-universal";
import { getCesiumViewer, googleTilesEnabled } from "./CesiumViewerWrapper";

/**
 * Handles all mouse inputs to Cesium.
 */
export default class CesiumMouseHandler {
  private mouseClickHandler: ScreenSpaceEventHandler;
  private mouseDoubleClickHandler: ScreenSpaceEventHandler;
  private mouseRightClickHandler: ScreenSpaceEventHandler;
  private mouseMoveHandler: ScreenSpaceEventHandler;

  private selectedEntityHighlighter: CesiumHighlighter;
  private mouseOverHighlighter: CesiumHighlighter;
  private trackedEntityHighlighter: CesiumHighlighter;

  private mousePositionInfoEntity: Entity;

  /**
   * Creates a new instance.
   */
  constructor() {
    // single click: select
    this.mouseClickHandler = new ScreenSpaceEventHandler(
      getCesiumViewer().scene.canvas,
    );

    this.mouseClickHandler.setInputAction(
      (positionEvent: ScreenSpaceEventHandler.PositionedEvent) =>
        this.mouseClickListener(positionEvent),
      ScreenSpaceEventType.LEFT_CLICK,
    );

    this.selectedEntityHighlighter = new CesiumHighlighter(
      getCesiumViewer().scene,
      undefined,
      {
        color: Color.fromCssColorString(Colors.BLUE),
        size: 8,
      },
    );

    // double click: flyTo
    getCesiumViewer().screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );

    this.mouseDoubleClickHandler = new ScreenSpaceEventHandler(
      getCesiumViewer().scene.canvas,
    );

    this.mouseDoubleClickHandler.setInputAction(
      (positionEvent: ScreenSpaceEventHandler.PositionedEvent) =>
        this.mouseDoubleClickListener(positionEvent),
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );

    // right click: track entity
    this.mouseRightClickHandler = new ScreenSpaceEventHandler(
      getCesiumViewer().scene.canvas,
    );

    this.mouseRightClickHandler.setInputAction(
      (positionEvent: ScreenSpaceEventHandler.PositionedEvent) =>
        this.mouseRightClickListener(positionEvent),
      ScreenSpaceEventType.RIGHT_CLICK,
    );

    this.trackedEntityHighlighter = new CesiumHighlighter(
      getCesiumViewer().scene,
      Color.fromCssColorString(Colors.GOLD),
    );

    // mouse over: highlight
    this.mouseMoveHandler = new ScreenSpaceEventHandler(
      getCesiumViewer().scene.canvas,
    );

    this.mouseMoveHandler.setInputAction(
      (motionEvent: ScreenSpaceEventHandler.MotionEvent) =>
        this.mouseOverListener(motionEvent),
      ScreenSpaceEventType.MOUSE_MOVE,
    );

    this.mouseOverHighlighter = new CesiumHighlighter(
      getCesiumViewer().scene,
      Color.fromCssColorString(Colors.RED),
    );

    // position info at mouse position
    this.mousePositionInfoEntity = getCesiumViewer().entities.add({
      label: {
        show: false,
        showBackground: true,
        font: "14px monospace",
        horizontalOrigin: HorizontalOrigin.LEFT,
        verticalOrigin: VerticalOrigin.TOP,
        pixelOffset: new Cartesian2(15, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  /**
   * Handles mouse clicks on entities. If an entity is selected it gets selected/unselected.
   * @param {ScreenSpaceEventHandler.PositionedEvent} positionEvent Mouse position event
   */
  async mouseClickListener(
    positionEvent: ScreenSpaceEventHandler.PositionedEvent,
  ) {
    const entity = await getCesiumViewer().scene.pick(positionEvent.position);
    if (!defined(entity)) return;
    if (!defined(entity.primitive)) return;
    if (!(entity.primitive instanceof Model)) return;

    if (!this.selectedEntityHighlighter.contains(entity)) {
      console.log("Selected entity:");
      console.log(entity);

      this.selectedEntityHighlighter.add(entity);
    } else {
      console.log("Unselected entity:");
      console.log(entity);

      this.selectedEntityHighlighter.remove(entity);
    }

    console.log(this.selectedEntityHighlighter.getEntities());

    this.updateRequestRenderMode();
  }

  /**
   * Handles mouse double clicks on entities. If an entity is selected the camera is moved towards it.
   * @param {ScreenSpaceEventHandler.PositionedEvent} positionEvent Mouse position event
   */
  async mouseDoubleClickListener(
    positionEvent: ScreenSpaceEventHandler.PositionedEvent,
  ) {
    const entity = await getCesiumViewer().scene.pick(positionEvent.position);
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

  /**
   * Handles mouse right clicks on entities. If an entity is right clicked on the camera tracks the object.
   * @param {ScreenSpaceEventHandler.PositionedEvent} positionEvent Mouse position event
   */
  async mouseRightClickListener(
    positionEvent: ScreenSpaceEventHandler.PositionedEvent,
  ) {
    const entity = await getCesiumViewer().scene.pick(positionEvent.position);

    // if right clicked to something which is not an entity, disable tracking
    if (
      !defined(entity) ||
      !defined(entity.id) ||
      !(entity.id instanceof Entity)
    ) {
      getCesiumViewer().trackedEntity = undefined;
      this.trackedEntityHighlighter.clear();

      getCesiumViewer().scene.requestRender();
      this.updateRequestRenderMode();

      return;
    }

    console.log("Right click on entity:");
    console.log(entity);

    if (!this.trackedEntityHighlighter.contains(entity)) {
      getCesiumViewer()
        .flyTo(entity.id, {
          offset: new HeadingPitchRange(0, -Math.PI_OVER_FOUR, 35.5),
        })
        .then(() => {
          getCesiumViewer().trackedEntity = entity.id;
        });

      this.trackedEntityHighlighter.add(entity);
    } else {
      // the same entity was already tracked, so remove tracking
      getCesiumViewer().trackedEntity = undefined;
      this.trackedEntityHighlighter.clear();
    }

    getCesiumViewer().scene.requestRender();
    this.updateRequestRenderMode();
  }

  /**
   * Handles mouse movements. If the mouse is over an entity it gets highlighted / unhighlighted and position info is shown if enabled.
   * @param {ScreenSpaceEventHandler.MotionEvent} motionEvent Mouse motion event
   */
  async mouseOverListener(motionEvent: ScreenSpaceEventHandler.MotionEvent) {
    if (settings.enableMousePositionInfo.value)
      this.showPositionInfoEntity(motionEvent.endPosition);

    const entity = await getCesiumViewer().scene.pick(motionEvent.endPosition);

    this.mouseOverHighlighter.clear();

    if (
      !defined(entity) ||
      !defined(entity.id) ||
      !(entity.id instanceof Entity) ||
      entity.primitive instanceof Label
    ) {
      this.updateRequestRenderMode();
      return;
    }

    // add entity to the array
    console.log("Mouse over entity:");
    console.log(entity);

    this.mouseOverHighlighter.add(entity);

    this.updateRequestRenderMode();
  }

  /**
   * Show information on the given position.
   * @param {Cartesian2} position The position where/for which the info shall be shown.
   */
  private async showPositionInfoEntity(position: Cartesian2) {
    if (!this.mousePositionInfoEntity.label) return;

    // show a position data text box next to the mouse cursor
    try {
      // get the position below the mouse
      const cartesian = getCesiumViewer().scene.pickPosition(position);
      const cartographic = Cartographic.fromCartesian(cartesian);
      const latitudeDegrees = Math.toDegrees(cartographic.latitude);
      const longitudeDegrees = Math.toDegrees(cartographic.longitude);

      this.mousePositionInfoEntity.position = new ConstantPositionProperty(
        cartesian,
      );

      // 6 decimal places equal 10 cm resolution. 12 digits are maximum.
      const longitudeString =
        longitudeDegrees.toFixed(6).padStart(12, " ") + "°";
      const latitudeString = latitudeDegrees.toFixed(6).padStart(12, " ") + "°";

      const heightMSLString =
        egm96
          .meanSeaLevel(latitudeDegrees, longitudeDegrees)
          .toFixed(2)
          .padStart(12, " ") + "m";

      let height3DString = "";

      // show position infos depending on if 3D tiles are enabled or not
      if (googleTilesEnabled()) {
        // try to retrieve 3D position
        if (getCesiumViewer().scene.clampToHeightSupported) {
          let updatedCartesians;

          if (settings.mousePositionInfoMostDetailed.value) {
            const tmpResult =
              await getCesiumViewer().scene.clampToHeightMostDetailed([
                cartesian,
              ]);

            if (tmpResult.length > 0 && tmpResult[0])
              updatedCartesians = tmpResult[0];
          } else {
            updatedCartesians =
              getCesiumViewer().scene.clampToHeight(cartesian);
          }

          if (updatedCartesians)
            height3DString =
              Cartographic.fromCartesian(updatedCartesians)
                .height.toFixed(2)
                .padStart(12, " ") + "m";
        }

        // if 3D position couldn't be retrieved fall back to height of scene geometry
        if (height3DString === "") {
          height3DString =
            getCesiumViewer()
              .scene.sampleHeight(cartographic)
              .toFixed(2)
              .padStart(12, " ") + "m";
        }

        this.mousePositionInfoEntity.label.text = new ConstantProperty(
          `Lat:     ${latitudeString}` +
            `\nLon:     ${longitudeString}` +
            `\nMSL:     ${heightMSLString}` +
            `\n3D:      ${height3DString}`,
        );
      } else {
        // Query the terrain height at the mouse position
        let height;
        let tmpResult;

        if (settings.mousePositionInfoMostDetailed.value) {
          tmpResult = await sampleTerrainMostDetailed(
            getCesiumViewer().terrainProvider,
            [cartographic],
          );

          if (tmpResult.length > 0 && tmpResult[0])
            height = tmpResult[0].height;
        } else {
          // sampleTerrain still triggers the cesium API and increases quota!
          // tmpResult = await sampleTerrain(getCesiumViewer().terrainProvider, 11, [
          //   cartographic,
          // ]);

          height = getCesiumViewer().scene.globe.getHeight(cartographic);
        }

        if (height) {
          const heightTerrainString = height.toFixed(2).padStart(12, " ") + "m";

          this.mousePositionInfoEntity.label.text = new ConstantProperty(
            `Lat:     ${latitudeString}` +
              `\nLon:     ${longitudeString}` +
              `\nMSL:     ${heightMSLString}` +
              `\nTerrain: ${heightTerrainString}`,
          );
        } else {
          // fallback: no height could be retrieved so only show MSL height
          this.mousePositionInfoEntity.label.text = new ConstantProperty(
            `Lat:    ${latitudeString}` +
              `\nLon:    ${longitudeString}` +
              `\nHeight: ${heightMSLString}`,
          );
        }
      }

      this.mousePositionInfoEntity.label.show = new ConstantProperty(true);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: unknown) {
      /* empty */
    } finally {
      getCesiumViewer().scene.requestRender();
    }
  }

  /**
   * If one highlighter contains entities set requestRenderMode to false otherwise set it to true.
   * This makes animations run if an entity is selected.
   * Also renders the scene once.
   */
  updateRequestRenderMode() {
    if (
      !this.selectedEntityHighlighter.empty() ||
      !this.mouseOverHighlighter.empty() ||
      !this.trackedEntityHighlighter.empty()
    ) {
      getCesiumViewer().scene.requestRenderMode = false;
    } else {
      getCesiumViewer().scene.requestRenderMode = true;
    }

    getCesiumViewer().scene.requestRender();
  }
}
