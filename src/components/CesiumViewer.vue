<template>
  <div id="cesiumContainer"></div>
  <div
    id="toolbar"
    style="background-color: #f0f9ff; border-radius: 5px; padding: 5px"
  >
    <div id="google-tiles">
      <input
        type="checkbox"
        id="google-tiles-checkbox"
        v-model="googleTilesEnabled"
        @change="toggleGoogleTiles"
      />
      <label for="google-tiles-checkbox" style="padding: 5px"
        >Show 3D Google tiles</label
      >
    </div>
  </div>
</template>

<style scoped>
#cesiumContainer {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>

<script lang="ts">
import {
  Cartesian3,
  Ion,
  Math,
  SkyAtmosphere,
  Terrain,
  createGooglePhotorealistic3DTileset,
  Viewer,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  Cartesian2,
  Entity,
  SceneMode,
  Color,
  Cesium3DTileset,
  Model,
  HeadingPitchRange,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import { initDemo } from "../demo/Demo";
import CesiumHighlighter from "./CesiumHighlighter.vue";

Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTJmM2RmYi0wMDI3LTQxYmMtYjY1NS00MzhmYzg4Njk1NTMiLCJpZCI6MjExMDU5LCJpYXQiOjE3MTM5OTExNTh9.cgvEwVgVgDQRqLsZzWCubdKnui9qoZAXTPCRbtVzZmo";

let viewer: Viewer;
let googleTileset: Cesium3DTileset;
let selectedEntityHighlighter: CesiumHighlighter;
let mouseOverHighlighter: CesiumHighlighter;

function initViewer() {
  viewer = new Viewer("cesiumContainer", {
    useBrowserRecommendedResolution: true,
    animation: false,
    timeline: false,
    infoBox: false,
    baseLayerPicker: true,
    selectionIndicator: false,
    sceneMode: SceneMode.SCENE3D,
    shouldAnimate: true,
    shadows: true,
    blurActiveElementOnCanvasFocus: false,
    msaaSamples: 4,
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
    skyAtmosphere: new SkyAtmosphere(),
    terrain: Terrain.fromWorldTerrain({
      requestWaterMask: false,
    }),
  });

  viewer.scene.postProcessStages.fxaa.enabled = true;
  viewer.scene.debugShowFramesPerSecond = true;

  selectedEntityHighlighter = new CesiumHighlighter(
    viewer.scene,
    new Color(0.0, 0.0, 1.0, 1.0),
    { color: new Color(0.0, 0.0, 1.0, 1.0), size: 5 },
  );
  mouseOverHighlighter = new CesiumHighlighter(
    viewer.scene,
    new Color(1.0, 0.0, 0.0, 1.0),
  );

  // pre-select a base layer
  const baseLayerPickerViewModel = viewer.baseLayerPicker.viewModel;
  const defaultImagery = baseLayerPickerViewModel.imageryProviderViewModels[2];
  if (defaultImagery) {
    baseLayerPickerViewModel.selectedImagery = defaultImagery;
  } else throw new Error("Default imageProviderViewModel out of bounds!");
}

async function initGoogleTileset() {
  try {
    const tmpTileset = await createGooglePhotorealistic3DTileset(undefined, {
      //maximumScreenSpaceError: 8, // quality
      preloadFlightDestinations: true,
      showCreditsOnScreen: true,
    });

    googleTileset = viewer.scene.primitives.add(tmpTileset);

    // on high zoom levels the globe and 3D tiles overlap / get mixed -> disable globe if 3D tiles are enabled
    viewer.scene.globe.show = false;
  } catch (error) {
    console.log(`Error loading Google Photorealistic 3D tileset: ${error}`);
  }
}

function initHandlers() {
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

function updateRequestRenderMode() {
  // If an entity is selected or mouse is over an entity the animation shall be rendered.
  if (!selectedEntityHighlighter.empty() || !mouseOverHighlighter.empty()) {
    viewer.scene.requestRenderMode = false;
  } else {
    viewer.scene.requestRenderMode = true;
  }
  viewer.scene.requestRender();
}

function mouseClickListener(movement: { position: Cartesian2 }) {
  const entity = viewer.scene.pick(movement.position);

  if (!defined(entity)) return;
  if (!defined(entity.primitive)) return;
  if (!(entity.primitive instanceof Model)) return;

  if (!selectedEntityHighlighter.contains(entity)) {
    console.log("Selected entity: " + entity);
    selectedEntityHighlighter.add(entity);
  } else {
    console.log("Unselected entity: " + entity);
    selectedEntityHighlighter.remove(entity);
  }

  console.log(selectedEntityHighlighter.getEntities());
  updateRequestRenderMode();
}

function mouseDoubleClickListener(movement: { position: Cartesian2 }) {
  const entity = viewer.scene.pick(movement.position);

  if (defined(entity)) {
    console.log("Double click on entity:");
    console.log(entity);

    const headingPitchRange = new HeadingPitchRange(
      viewer.camera.heading,
      viewer.camera.pitch,
      50,
    );

    if (entity.id instanceof Entity) {
      viewer.flyTo(entity.id, {
        duration: 1.0,
        offset: headingPitchRange,
      });
      updateRequestRenderMode();
    }
  }
}

function mouseOverListener(movement: { endPosition: Cartesian2 }) {
  // drillpick prevents camera movement:
  // https://community.cesium.com/t/drillpick-in-screenspaceeventtype-mouse-move-breaks-camera-movements-when-google3dtileset-is-enabled/33939
  // const entities = viewer.scene.drillPick(movement.endPosition);
  // let filteredEntities = entities.filter(
  //   (entity) => defined(entity) && entity.id instanceof Entity,
  // );
  // if (filteredEntities.length > 0) {
  //   // add entities to the array
  //   console.log("Mouse over entities:" + filteredEntities);
  //   mouseOverHighlighter.setArray(filteredEntities);
  //   updateRequestRenderMode();
  // } else if (!mouseOverHighlighter.empty()) {
  //   // clear existing array
  //   mouseOverHighlighter.clear();
  //   updateRequestRenderMode();
  // }

  const entity = viewer.scene.pick(movement.endPosition);

  if (defined(entity)) {
    console.log("entity.id " + entity.id);
    console.log("empty: " + mouseOverHighlighter.empty());

    if (defined(entity.id) && entity.id instanceof Entity) {
      // add entities to the array
      console.log("Mouse over entity:" + entity);

      mouseOverHighlighter.add(entity);

      updateRequestRenderMode();

      return;
    }
  }

  if (!mouseOverHighlighter.empty()) {
    // clear existing array
    mouseOverHighlighter.clear();

    updateRequestRenderMode();
  }
}

export default {
  name: "CesiumViewer",

  mounted() {
    initViewer();
    initHandlers();
    initGoogleTileset();

    initDemo(viewer);

    this.resetCamera();
  },

  // only make parameters reactive that need to be changed from the outside:
  // https://stackoverflow.com/questions/60479946/local-variable-vs-data-huge-loss-in-performance
  data() {
    return { googleTilesEnabled: true };
  },

  methods: {
    // public methods that can be called from outside

    resetCamera() {
      // fly the camera to San Francisco
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
        orientation: {
          heading: Math.toRadians(0.0),
          pitch: Math.toRadians(-15.0),
        },
      });
    },

    toggleGoogleTiles() {
      if (googleTileset) {
        if (this.googleTilesEnabled) {
          googleTileset.show = true;
          viewer.scene.requestRender();
          viewer.scene.globe.show = false;
          console.log("3D Google tiles enabled");
        } else {
          googleTileset.show = false;
          viewer.scene.globe.show = true;
          viewer.scene.requestRender();
          console.log("3D Google tiles disabled");
        }
      } else {
        console.error("Google Tiles are undefined");
      }
    },
  },
};
</script>
