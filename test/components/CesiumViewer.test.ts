/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { mountCesiumViewer } from "../helpers/MockUtils";
import { CesiumViewerImpl } from "../../src/components/CesiumViewerImpl";

describe("CesiumViewer", () => {
  test("Mounting Cesium container", () => {
    mountCesiumViewer();

    // cesium container exists
    expect(
      document.getElementById("cesiumContainer")!.innerHTML,
      "cesiumContainer is empty",
    ).not.toBe(undefined);

    // toolbar exists
    expect(
      document.getElementById("toolbar")!.innerHTML,
      "toolbar is empty",
    ).not.toBe(undefined);
  });

  test("Toggle Google 3D Tiles", async () => {
    const enableGoogleTilesSpy = vi.spyOn(
      CesiumViewerImpl.prototype,
      "enableGoogleTiles",
    );
    const disableGoogleTilesSpy = vi.spyOn(
      CesiumViewerImpl.prototype,
      "disableGoogleTiles",
    );

    const wrapper = mountCesiumViewer();
    enableGoogleTilesSpy.mockClear();
    disableGoogleTilesSpy.mockClear();

    // Find the HTML element by ID
    const googleTilesCheckbox = wrapper.find("#google-tiles-checkbox");

    // Assert that the input exists
    expect(googleTilesCheckbox.exists()).toBe(true);

    // disable google 3d tiles
    await googleTilesCheckbox.setValue(false);
    await wrapper.vm.$nextTick();
    // expect(settings.google3DTilesEnabled.value).toBeFalsy();
    expect(disableGoogleTilesSpy).toHaveBeenCalled();

    // enable google 3d tiles
    await googleTilesCheckbox.setValue(true);
    await wrapper.vm.$nextTick();
    // expect(settings.google3DTilesEnabled.value).toBeTruthy();
    expect(enableGoogleTilesSpy).toHaveBeenCalled();
  });
});
