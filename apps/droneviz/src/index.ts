import {
  Viewer,
  Cartesian3,
  Math,
  Ion,
  createGooglePhotorealistic3DTileset,
  defined,
  SkyAtmosphere,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./css/main.css";
import { initDemo } from "./demo/Demo";

// CesiumJS has a default access token built in but it's not meant for active use.
// please set your own access token can be found at: https://cesium.com/ion/tokens.
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTJmM2RmYi0wMDI3LTQxYmMtYjY1NS00MzhmYzg4Njk1NTMiLCJpZCI6MjExMDU5LCJpYXQiOjE3MTM5OTExNTh9.cgvEwVgVgDQRqLsZzWCubdKnui9qoZAXTPCRbtVzZmo";

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer("cesiumContainer", {
  animation: false,
  globe: false,
  timeline: false,
  infoBox: false,
  selectionIndicator: true,
  shouldAnimate: true,
  blurActiveElementOnCanvasFocus: false,
  msaaSamples: 4,
  requestRenderMode: true,
  maximumRenderTimeChange: Infinity,
  skyAtmosphere: new SkyAtmosphere(),
});

viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.scene.debugShowFramesPerSecond = true;

// Add Google 3d tileset
try {
  const googleTileSet = await createGooglePhotorealistic3DTileset(undefined, {
    //maximumScreenSpaceError: 8, // quality
    preloadFlightDestinations: true,
  });
  viewer.scene.primitives.add(googleTileSet);
} catch (error) {
  console.log("Error loading Photorealistic 3D Tiles tileset: ${error}");
}

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
