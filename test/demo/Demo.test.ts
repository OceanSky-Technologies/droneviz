/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createTestViewerOptions } from "../helpers/MockDOMUtils";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import CesiumViewer from "../../src/components/CesiumViewer.vue";
import { Viewer } from "cesium";
import { fireEvent } from "@testing-library/vue";
import { initDemo } from "../../src/demo/Demo";

enableAutoUnmount(afterEach);

describe("Demo mode", () => {
  test("Init demo", () => {
    const div = document.createElement("div");
    div.id = "cesiumContainer";
    document.body.appendChild(div);

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());
    initDemo(viewer);
  });

  test("Invalid viewer", () => {
    initDemo(undefined as unknown as Viewer);
  });

  test("Invalid toolbar", () => {
    mount(CesiumViewer, {
      props: {
        webGLMock: createTestViewerOptions,
        googleTilesEnabledInitial: false, // stay below cesium quota
      },
    });

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());
    initDemo(viewer);
  });

  test("Select toolbar options", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    mount(CesiumViewer, {
      props: {
        webGLMock: createTestViewerOptions,
        googleTilesEnabledInitial: false, // stay below cesium quota
      },
      attachTo: div,
    });

    const toolbar = document.getElementById(
      "demo-entity-selection",
    )! as HTMLSelectElement;

    // fire event to select each option
    for (let i = 0; i < toolbar.options.length; i++) {
      toolbar.options.selectedIndex = i;
      fireEvent.update(toolbar, toolbar.options[i]!.value);
    }
  });
});
