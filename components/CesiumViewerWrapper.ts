import type { Cesium3DTileset } from "cesium";
import {
  Cartesian3,
  Math,
  createGooglePhotorealistic3DTileset,
  Ion,
  Viewer,
  GlobeTranslucency,
} from "cesium";
import { settings } from "../utils/Settings";
import { selectedEntityHighlighter } from "./LeftClickHandler";
import { mouseOverHighlighter } from "./MouseMoveHandler";

Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTJmM2RmYi0wMDI3LTQxYmMtYjY1NS00MzhmYzg4Njk1NTMiLCJpZCI6MjExMDU5LCJpYXQiOjE3MTM5OTExNTh9.cgvEwVgVgDQRqLsZzWCubdKnui9qoZAXTPCRbtVzZmo";

// expires 2025-10-01 !
// ArcGisMapService.defaultAccessToken =
//   "AAPTxy8BH1VEsoebNVZXo8HurAYIVj8Enn_PLkaa6G0IFY0Zggco6V_IHWiDirkZ8HvvtmoCarlVdIHDbQZncEmTUvFj1GMPw3GF9dwoiqCRWa-_aBWHB4Ww3k3YvgATBtNFRGTzpWrlvNxwN7ISR7h-THU0enwgDlfFyUUsXoAN5fb8Rn0bA6kTAYwdM486kpqlfXgeQDpUZcki-erdmMOOREvEErlRyRm8xKHN3hxvkVI.AT1_O1bKakTu";

let viewer: Viewer | undefined;
let googleTileset: Cesium3DTileset | undefined;

export const cesiumInitialized: Ref<boolean> = ref(false);

/**
 * Initialize Cesium viewer.
 * @param {Viewer.ConstructorOptions} viewerOptions Viewer options.
 * @param {Cesium3DTileset?} tilesetMock Mock tileset for testing.
 * @throws {Error} If Cesium viewer is already initialized.
 */
export async function initCesium(
  viewerOptions: Viewer.ConstructorOptions,
  tilesetMock?: Cesium3DTileset,
) {
  if (viewer) throw new Error("Cesium viewer already initialized");

  // wait until the service worker is ready
  console.log("Waiting for service worker to be ready...");
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.ready;
    console.log("Service worker is ready!");
  }

  if (tilesetMock) console.log("Mocking tileset");

  viewer = new Viewer("cesiumContainer", viewerOptions);

  // improve quality of visible maps: https://github.com/CesiumGS/cesium/issues/3279
  getCesiumViewer().scene.globe.maximumScreenSpaceError = 1.5;

  getCesiumViewer().scene.globe.tileCacheSize = settings.tileCacheSize.value; // improve rendering speed
  getCesiumViewer().scene.postProcessStages.fxaa.enabled = settings.fxaa.value;
  getCesiumViewer().scene.debugShowFramesPerSecond =
    settings.showFramesPerSecond.value;

  // fix unprecise height values on mouse over: https://github.com/CesiumGS/cesium/issues/8707#issuecomment-606778413
  getCesiumViewer().scene.globe.depthTestAgainstTerrain = true;

  if (settings.google3DTilesEnabled.value) await initGoogleTileset(tilesetMock);

  cesiumInitialized.value = true;
}

/**
 * Destroy Cesium viewer.
 */
export function destroyCesium() {
  viewer?.destroy();
  viewer = undefined;

  googleTileset?.destroy();
  googleTileset = undefined;
}

/**
 * Check if Cesium viewer is initialized.
 * @returns {boolean} True if Cesium viewer is initialized.
 */
export function isCesiumInitialized(): boolean {
  return viewer !== undefined;
}

export function waitUntilCesiumInitialized(): Promise<void> {
  return new Promise<void>((resolve) => {
    // If already initialized, resolve immediately
    if (cesiumInitialized.value) {
      resolve();
    } else {
      // Watch for changes to cesiumInitialized
      const stop = watch(cesiumInitialized, (newValue) => {
        if (newValue) {
          resolve();
          stop(); // Stop watching once resolved
        }
      });
    }
  });
}

/**
 * Get Cesium viewer.
 * @returns {Viewer} Cesium viewer.
 * @throws {Error} If the Cesium viewer is not initialized.
 */
export function getCesiumViewer(): Viewer {
  if (!viewer) throw new Error("Cesium viewer not initialized");

  return viewer as Viewer;
}

/**
 * Get Google 3D Tileset.
 * @returns {Cesium3DTileset} Google 3D Tileset.
 * @throws {Error} If Google 3D Tileset is not initialized.
 */
export function getGoogle3DTileset(): Cesium3DTileset {
  if (!googleTileset) throw new Error("Google 3D tileset not initialized");

  return googleTileset;
}

/**
 * Initialize Google 3D Tileset.
 * @param {Cesium3DTileset?} tilesetMock Mock tileset for testing.
 * @throws {Error} If Google 3D Tileset is already initialized.
 */
async function initGoogleTileset(tilesetMock?: Cesium3DTileset) {
  if (googleTileset) throw new Error("Google 3D tileset already initialized");

  if (tilesetMock) {
    console.log("Mocking tileset");
    googleTileset = tilesetMock;
    getCesiumViewer().scene.globe.show = false;

    return;
  }

  console.log("Initializing Google 3D tiles");

  let googleApiKey = undefined;
  if (settings.googleApiKey.value && settings.googleApiKey.value !== "")
    googleApiKey = settings.googleApiKey.value;

  const tileset = await createGooglePhotorealistic3DTileset(
    { key: googleApiKey },
    {
      //maximumScreenSpaceError: 8, // quality
      preloadFlightDestinations: true,
      showCreditsOnScreen: true,
      projectTo2D: true,
    },
  );

  googleTileset = getCesiumViewer().scene.primitives.add(tileset);

  // on high zoom levels the globe and 3D tiles overlap / get mixed -> disable globe if 3D tiles are enabled
  getCesiumViewer().scene.globe.show = false;
}

/**
 * Check if Google 3D tiles are enabled.
 * @returns {boolean} True if Google 3D tiles are enabled.
 */
export function googleTilesEnabled(): boolean {
  return googleTileset !== undefined && googleTileset.show;
}

/**
 * Enable the Google 3D tiles.
 * @throws {Error} If Cesium viewer is not initialized.
 * @throws {Error} If Google 3D Tileset is not initialized.
 */
export function enableGoogleTiles() {
  if (!viewer) throw new Error("Cesium viewer not initialized");
  if (!googleTileset) throw new Error("Google 3D tileset not initialized");

  googleTileset.show = true;
  getCesiumViewer().scene.requestRender();
  getCesiumViewer().scene.globe.show = false;
  console.log("3D Google tiles enabled");
}

/**
 * Disable the Google 3D tiles.
 * @throws {Error} If Cesium viewer is not initialized.
 * @throws {Error} If Google 3D Tileset is not initialized.
 */
export function disableGoogleTiles() {
  if (!viewer) throw new Error("Cesium viewer not initialized");
  if (!googleTileset) throw new Error("Google 3D tileset not initialized");

  googleTileset.show = false;
  getCesiumViewer().scene.globe.show = true;
  getCesiumViewer().scene.requestRender();
  console.log("3D Google tiles disabled");
}

/**
 * If one highlighter contains entities set requestRenderMode to false otherwise set it to true.
 * This makes animations run if an entity is selected.
 * Also renders the scene once.
 * Only has effect if settings.disableAnimations is false.
 */
export function updateRequestRenderMode() {
  if (settings.disableAnimations.value) return;

  if (!selectedEntityHighlighter) {
    console.log("selectedEntityHighlighter is undefined");
    return;
  }

  if (!mouseOverHighlighter) {
    console.log("mouseOverHighlighter is undefined");
    return;
  }

  if (!selectedEntityHighlighter.empty() || !mouseOverHighlighter.empty()) {
    getCesiumViewer().scene.requestRenderMode = false;
  } else {
    getCesiumViewer().scene.requestRenderMode = true;
  }

  getCesiumViewer().scene.requestRender();
}
