import {
  mountCesiumViewerMock,
  silenceConsole,
} from "@/tests/test-utils/MockUtils";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup } from "@testing-library/vue";
import { destroyCesium } from "@/components/CesiumViewerWrapper";

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
      document.getElementById("mainToolbar")!.innerHTML,
      "mainToolbar is empty",
    ).not.toBe(undefined);
  });

  test("Mounting Cesium container with error during initialization", async () => {
    await mountCesiumViewerMock();

    silenceConsole(true);

    //cesium was already initialized so now we can't initialize it again

    try {
      await mountCesiumViewerMock();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // pass
    }
  });
});
