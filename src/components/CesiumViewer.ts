import CesiumHighlighter from "./CesiumHighlighter.vue";
import { BLUE, GOLD } from "../helpers/Colors";
import {
  Ion,
  Viewer,
  Cesium3DTileset,
  Color,
  SceneMode,
  SkyAtmosphere,
  Terrain,
  createGooglePhotorealistic3DTileset,
  ScreenSpaceEventHandler,
  defined,
  Math,
  Model,
  Entity,
  HeadingPitchRange,
  ScreenSpaceEventType,
  Cartesian3,
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

Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTJmM2RmYi0wMDI3LTQxYmMtYjY1NS00MzhmYzg4Njk1NTMiLCJpZCI6MjExMDU5LCJpYXQiOjE3MTM5OTExNTh9.cgvEwVgVgDQRqLsZzWCubdKnui9qoZAXTPCRbtVzZmo";

export let viewer: Viewer;
export let googleTileset: Cesium3DTileset | undefined;

let selectedEntityHighlighter: CesiumHighlighter;

let mouseOverHighlighter: CesiumHighlighter;
let showPositionEntity: Entity;

/**
 * Initialize the cesium viewer.
 * @param {Function} viewerOptionsGenerator Function that generates (test) Viewer.ConstructorOptions
 */
export function initViewer(
  viewerOptionsGenerator?: () => Viewer.ConstructorOptions,
) {
  if (viewerOptionsGenerator) {
    viewer = new Viewer("cesiumContainer", viewerOptionsGenerator());
  } else viewer = new Viewer("cesiumContainer", getViewerOptions());

  viewer.scene.postProcessStages.fxaa.enabled = true;
  viewer.scene.debugShowFramesPerSecond = true;

  // fix unprecise height values on mouse over: https://github.com/CesiumGS/cesium/issues/8707#issuecomment-606778413
  viewer.scene.globe.depthTestAgainstTerrain = true;

  // improve rendering speed
  viewer.scene.globe.tileCacheSize = 1000;

  selectedEntityHighlighter = new CesiumHighlighter(viewer.scene, undefined, {
    color: Color.fromCssColorString(BLUE),
    size: 8,
  });
  mouseOverHighlighter = new CesiumHighlighter(
    viewer.scene,
    Color.fromCssColorString(GOLD),
  );

  showPositionEntity = viewer.entities.add({
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

  // pre-select a base layer
  if (viewer.baseLayerPicker) {
    const baseLayerPickerViewModel = viewer.baseLayerPicker.viewModel;
    if (baseLayerPickerViewModel.imageryProviderViewModels.length > 2) {
      const defaultImagery =
        baseLayerPickerViewModel.imageryProviderViewModels[2];
      if (defaultImagery) {
        baseLayerPickerViewModel.selectedImagery = defaultImagery;
      } else throw new Error("Default imageProviderViewModel out of bounds!");
    }
  }
}

/**
 * Create Cesium Viewer default options.
 * @returns {Viewer.ConstructorOptions} Default options
 */
export function getViewerOptions(): Viewer.ConstructorOptions {
  return {
    useBrowserRecommendedResolution: true,
    animation: false,
    timeline: false,
    infoBox: false,
    baseLayerPicker: true,
    selectionIndicator: false,
    sceneMode: SceneMode.SCENE3D,
    shouldAnimate: true,
    shadows: false,
    blurActiveElementOnCanvasFocus: false,
    msaaSamples: 4,
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
    skyAtmosphere: new SkyAtmosphere(),
    terrain: Terrain.fromWorldTerrain({
      requestWaterMask: false,
    }),
  };
}

/**
 * Initialize Google 3D Tileset.
 */
export async function initGoogleTileset() {
  const tmpTileset = await createGooglePhotorealistic3DTileset(undefined, {
    //maximumScreenSpaceError: 8, // quality
    preloadFlightDestinations: true,
    showCreditsOnScreen: true,
  });

  googleTileset = viewer.scene.primitives.add(tmpTileset);

  // on high zoom levels the globe and 3D tiles overlap / get mixed -> disable globe if 3D tiles are enabled
  viewer.scene.globe.show = false;
}

/**
 * Handles mouse clicks on. If an entity is selected it gets selected/unselected.
 * @param {ScreenSpaceEventHandler.PositionedEvent} positionEvent Mouse position event
 */
export async function mouseClickListener(
  positionEvent: ScreenSpaceEventHandler.PositionedEvent,
) {
  const entity = await viewer.scene.pick(positionEvent.position);

  if (!defined(entity)) return;
  if (!defined(entity.primitive)) return;
  if (!(entity.primitive instanceof Model)) return;

  if (!selectedEntityHighlighter.contains(entity)) {
    console.log("Selected entity:");
    console.log(entity);

    selectedEntityHighlighter.add(entity);
  } else {
    console.log("Unselected entity:");
    console.log(entity);

    selectedEntityHighlighter.remove(entity);
  }

  console.log(selectedEntityHighlighter.getEntities());
  updateRequestRenderMode();
}

/**
 * Handles mouse double clicks on. If an entity is selected the camera is moved towards it.
 * @param {ScreenSpaceEventHandler.PositionedEvent} positionEvent Mouse position event
 */
export async function mouseDoubleClickListener(
  positionEvent: ScreenSpaceEventHandler.PositionedEvent,
) {
  const entity = await viewer.scene.pick(positionEvent.position);

  if (defined(entity)) {
    console.log("Double click on entity:");
    console.log(entity);

    if (entity.id instanceof Entity) {
      const headingPitchRange = new HeadingPitchRange(
        viewer.camera.heading,
        viewer.camera.pitch,
        50,
      );

      await viewer.flyTo(entity.id, {
        duration: 1.0,
        offset: headingPitchRange,
      });

      viewer.scene.requestRender();
    }
  }
}

/**
 * Handles mouse movements. If the mouse is over an entity it gets highlighted / unhighlighted.
 * @param {ScreenSpaceEventHandler.MotionEvent} motionEvent Mouse motion event
 */
export async function mouseOverListener(
  motionEvent: ScreenSpaceEventHandler.MotionEvent,
) {
  // pick the entity below the mouse and highlight
  const entity = viewer.scene.pick(motionEvent.endPosition);

  mouseOverHighlighter.clear();

  if (defined(entity)) {
    if (
      defined(entity.id) &&
      entity.id instanceof Entity &&
      !(entity.primitive instanceof Label)
    ) {
      // add entities to the array
      console.log("Mouse over entity:");
      console.log(entity);

      mouseOverHighlighter.add(entity);
    }
  }

  updateRequestRenderMode();

  // show a position data text box next to the mouse cursor
  try {
    // get the position below the mouse
    const cartesian = viewer.scene.pickPosition(motionEvent.endPosition);
    const cartographic = Cartographic.fromCartesian(cartesian);
    const latitudeDegrees = Math.toDegrees(cartographic.latitude);
    const longitudeDegrees = Math.toDegrees(cartographic.longitude);

    showPositionEntity!.position = new ConstantPositionProperty(cartesian);

    // 6 decimal places equal 10 cm resolution.
    // 12 digits are maximum.
    const longitudeString = longitudeDegrees.toFixed(6).padStart(12, " ") + "°";
    const latitudeString = latitudeDegrees.toFixed(6).padStart(12, " ") + "°";

    const heightMSLString =
      egm96
        .meanSeaLevel(latitudeDegrees, longitudeDegrees)
        .toFixed(2)
        .padStart(12, " ") + "m";

    // TODO: change to googleTileset.show after refactoring
    if (!viewer.scene.globe.show) {
      let height3DString = "";
      if (viewer.scene.clampToHeightSupported) {
        const updatedCartesians = await viewer.scene.clampToHeightMostDetailed([
          cartesian,
        ]);

        if (updatedCartesians && updatedCartesians.length > 0) {
          height3DString =
            Cartographic.fromCartesian(updatedCartesians[0]!)
              .height.toFixed(2)
              .padStart(12, " ") + "m";
        } else {
          height3DString =
            viewer.scene
              .sampleHeight(cartographic)
              .toFixed(2)
              .padStart(12, " ") + "m";
        }
      } else {
        height3DString =
          viewer.scene.sampleHeight(cartographic).toFixed(2).padStart(12, " ") +
          "m";
      }

      showPositionEntity!.label!.text = new ConstantProperty(
        `Lat:     ${latitudeString}` +
          `\nLon:     ${longitudeString}` +
          `\nMSL:     ${heightMSLString}` +
          `\n3D:      ${height3DString}`,
      );
    } else {
      // Query the terrain height at the mouse position using sampleTerrainMostDetailed
      const updatedCartographics = await sampleTerrainMostDetailed(
        viewer.terrainProvider,
        [cartographic],
      );

      if (updatedCartographics && updatedCartographics.length > 0) {
        const heightTerrainString =
          updatedCartographics[0].height.toFixed(2).padStart(12, " ") + "m";

        showPositionEntity!.label!.text = new ConstantProperty(
          `Lat:     ${latitudeString}` +
            `\nLon:     ${longitudeString}` +
            `\nMSL:     ${heightMSLString}` +
            `\nTerrain: ${heightTerrainString}`,
        );
      } else {
        showPositionEntity!.label!.text = new ConstantProperty(
          `Lat:    ${latitudeString}` +
            `\nLon:    ${longitudeString}` +
            `\nHeight: ${heightMSLString}`,
        );
      }
    }

    showPositionEntity!.label!.show = new ConstantProperty(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: unknown) {
    /* empty */
  }
}

/**
 * Initialize mouse handlers.
 */
export function initMouseHandlers() {
  // single click: select
  const mouseClickHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  mouseClickHandler.setInputAction(
    mouseClickListener,
    ScreenSpaceEventType.LEFT_CLICK,
  );

  // double click: flyTo
  viewer.screenSpaceEventHandler.removeInputAction(
    ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
  );
  const mouseDoubleClickHandler = new ScreenSpaceEventHandler(
    viewer.scene.canvas,
  );
  mouseDoubleClickHandler.setInputAction(
    mouseDoubleClickListener,
    ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
  );

  // mouse over: highlight
  const mouseMoveHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  mouseMoveHandler.setInputAction(
    mouseOverListener,
    ScreenSpaceEventType.MOUSE_MOVE,
  );
}

/**
 * Update requestRenderMode if an entity is currently highlighted/selected and render the scene.
 */
export function updateRequestRenderMode() {
  // If an entity is selected or mouse is over an entity the animation shall be rendered.
  if (!selectedEntityHighlighter.empty() || !mouseOverHighlighter.empty()) {
    viewer.scene.requestRenderMode = false;
  } else {
    viewer.scene.requestRenderMode = true;
  }
  viewer.scene.requestRender();
}

/**
 * Resets the camera.
 */
export function resetCamera() {
  // fly the camera to San Francisco
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
    orientation: {
      heading: Math.toRadians(0.0),
      pitch: Math.toRadians(-15.0),
    },
  });
}

/**
 * Sets a new Google Tileset.
 * @param {Cesium3DTileset | undefined} tileset new tileset
 */
export function setGoogleTileSet(tileset: Cesium3DTileset | undefined) {
  googleTileset = tileset;
}
