import { Cesium3DTileset } from "cesium";
import {
  disableGoogleTiles,
  enableGoogleTiles,
  getCesiumViewer,
  getGoogle3DTileset,
  googleTilesEnabled,
  initCesium,
  isCesiumInitialized,
} from "../../src/components/CesiumViewerWrapper";
import {
  createCesiumContainer,
  createTestViewerOptions,
} from "../helpers/MockUtils";
import { settings } from "../../src/components/Settings";

describe("CesiumViewer", () => {
  test("Uninitialized state", () => {
    expect(isCesiumInitialized()).toBeFalsy();
    expect(() => getCesiumViewer()).toThrowError();
    expect(() => getGoogle3DTileset()).toThrowError();
    expect(googleTilesEnabled()).toBeFalsy();
    expect(() => enableGoogleTiles()).toThrowError();
    expect(() => disableGoogleTiles()).toThrowError();
  });

  test("Initialization", async () => {
    createCesiumContainer();

    settings.google3DTilesEnabled.value = true;
    await initCesium(createTestViewerOptions(), new Cesium3DTileset({})); // stay below cesium quota by disabling tileset);

    expect(isCesiumInitialized()).toBeTruthy();
    expect(getCesiumViewer()).toBeDefined();
    expect(getCesiumViewer()).toBeDefined();

    // google tileset is enabled if it got initialized
    expect(googleTilesEnabled()).toBeTruthy();
    disableGoogleTiles();
    expect(googleTilesEnabled()).toBeFalsy();
  });
});
