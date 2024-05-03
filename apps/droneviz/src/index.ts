import {
  Viewer,
  Cartesian3,
  Math,
  Ion,
  createGooglePhotorealistic3DTileset,
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
  // terrain: Terrain.fromWorldTerrain(),
  timeline: false,
  infoBox: true,
  selectionIndicator: true,
  animation: false,
  shouldAnimate: false,
  blurActiveElementOnCanvasFocus: false,
  msaaSamples: undefined,
  requestRenderMode: true,
});

viewer.scene.postProcessStages.fxaa.enabled = false;
viewer.scene.debugShowFramesPerSecond = true;

// Add Cesium OSM Buildings, a global 3D buildings layer.
const googleTileSet = await createGooglePhotorealistic3DTileset(undefined, {
  // maximumScreenSpaceError: 8, // quality
  cacheBytes: 4000000000,
  maximumCacheOverflowBytes: 4000000000,
  preloadFlightDestinations: true,
});
viewer.scene.primitives.add(googleTileSet);
// viewer.scene.globe.maximumScreenSpaceError = 1.5;

initDemo(viewer);

// Fly the camera to San Francisco at the given longitude, latitude, and height.
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
  orientation: {
    heading: Math.toRadians(0.0),
    pitch: Math.toRadians(-15.0),
  },
});
