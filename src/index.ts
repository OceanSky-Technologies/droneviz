import {
  Viewer,
  Cartesian3,
  Math,
  Ion,
  createGooglePhotorealistic3DTileset,
  defined,
  SkyAtmosphere,
  Cesium3DTileset,
  Terrain,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./css/main.css";
import { initDemo } from "./demo/Demo";

// CesiumJS has a default access token built in but it's not meant for active use.
// please set your own access token can be found at: https://cesium.com/ion/tokens.
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTJmM2RmYi0wMDI3LTQxYmMtYjY1NS00MzhmYzg4Njk1NTMiLCJpZCI6MjExMDU5LCJpYXQiOjE3MTM5OTExNTh9.cgvEwVgVgDQRqLsZzWCubdKnui9qoZAXTPCRbtVzZmo";

export async function loadWindow(document: Document) {
  // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
  const viewer = new Viewer("cesiumContainer", {
    animation: false,
    timeline: false,
    infoBox: false,
    baseLayerPicker: true,
    selectionIndicator: true,
    shouldAnimate: true,
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

  // Add Google 3d tileset
  let googleTileSet: Cesium3DTileset;
  try {
    googleTileSet = await createGooglePhotorealistic3DTileset(undefined, {
      //maximumScreenSpaceError: 8, // quality
      preloadFlightDestinations: true,
      showCreditsOnScreen: true,
    });
    viewer.scene.primitives.add(googleTileSet);

    // on high zoom levels the globe and 3D tiles overlap / get mixed -> disable globe if 3D tiles are enabled
    viewer.scene.globe.show = false;
  } catch (error) {
    console.log(`Error loading Google Photorealistic 3D tileset: ${error}`);
  }

  // pre-select a base layer
  const baseLayerPickerViewModel = viewer.baseLayerPicker.viewModel;
  const defaultImagery = baseLayerPickerViewModel.imageryProviderViewModels[2];
  if (defaultImagery) {
    baseLayerPickerViewModel.selectedImagery = defaultImagery;
  } else throw new Error("Default imageProviderViewModel out of bounds!");

  // enable/disable Google 3D tiles checkbox
  const checkbox = document.querySelector(
    "input[id=google-tiles-checkbox]",
  ) as HTMLInputElement;
  checkbox?.addEventListener("change", function () {
    if (checkbox.checked) {
      googleTileSet.show = true;
      viewer.scene.requestRender();
      viewer.scene.globe.show = false;
      console.log("3D Google tiles enabled");
    } else {
      googleTileSet.show = false;
      viewer.scene.globe.show = true;
      viewer.scene.requestRender();
      console.log("3D Google tiles disabled");
    }
  });

  initDemo(viewer);

  // If an entity is selected the animation shall be rendered. Deselecting the entity disables rendering.
  viewer.selectedEntityChanged.addEventListener(function (selectedEntity) {
    if (defined(selectedEntity)) {
      viewer.scene.requestRenderMode = false;
    } else {
      viewer.scene.requestRenderMode = true;
    }
  });

  // Fly the camera to San Francisco at the given longitude, latitude, and height.
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
    orientation: {
      heading: Math.toRadians(0.0),
      pitch: Math.toRadians(-15.0),
    },
  });
}

window.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded start");

  loadWindow(document);

  console.log("DOMContentLoaded end");
});
