import { Cesium3DTileset } from "cesium";
import {
  disableGoogleTiles,
  enableGoogleTiles,
  getCesiumViewer,
  getGoogle3DTileset,
  googleTilesEnabled,
  initCesium,
  isCesiumInitialized,
} from "@/components/CesiumViewerWrapper";
import {
  createCesiumContainer,
  createTestViewerOptions,
} from "@/tests/test-utils/MockUtils";
import { settings } from "@/utils/Settings";
import { describe, expect, test } from "vitest";

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
    await initCesium(await createTestViewerOptions(), new Cesium3DTileset({})); // stay below cesium quota by disabling tileset);

    expect(isCesiumInitialized()).toBeTruthy();
    expect(getCesiumViewer()).toBeDefined();
    expect(getCesiumViewer()).toBeDefined();

    // google tileset is enabled if it got initialized
    expect(googleTilesEnabled()).toBeTruthy();
    disableGoogleTiles();
    expect(googleTilesEnabled()).toBeFalsy();
  });
});
