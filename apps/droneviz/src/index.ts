import {
  Viewer,
  Cartesian3,
  Math,
  Ion,
  Terrain,
  createGooglePhotorealistic3DTileset,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./css/main.css";

// CesiumJS has a default access token built in but it's not meant for active use.
// please set your own access token can be found at: https://cesium.com/ion/tokens.
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NjkyMDVlMi1jZjE4LTRkNjgtOGYwOS05N2ZjZTU5OTgyYjIiLCJpZCI6MjExMDU5LCJpYXQiOjE3MTM5OTA5NjJ9.aZtaayNNhuaZ5ZWTe1AqBIuZDQcr8fejjqPnoBcf4Ic";

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain(),
});

// Add Cesium OSM Buildings, a global 3D buildings layer.
const googleTileSet = await createGooglePhotorealistic3DTileset();
viewer.scene.primitives.add(googleTileSet);

// Fly the camera to San Francisco at the given longitude, latitude, and height.
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
  orientation: {
    heading: Math.toRadians(0.0),
    pitch: Math.toRadians(-15.0),
  },
});
