/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { cleanup } from "@testing-library/vue";
import { destroyCesium } from "../../src/components/CesiumViewerWrapper";
import { mountCesiumViewerMock, silenceConsole } from "../helpers/MockUtils";

// global cleanup somehow does not work so do it here ?!
afterEach(() => {
  vi.restoreAllMocks();
  destroyCesium();
  cleanup();
});

describe("CesiumViewer", () => {
  test("Mounting Cesium container", async () => {
    await mountCesiumViewerMock();

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

  test("Mounting Cesium container with error during initialization", async () => {
    await mountCesiumViewerMock();

    silenceConsole(true);

    //cesium was already initialized so now we can't initialize it again

    await mountCesiumViewerMock();
  });
});
