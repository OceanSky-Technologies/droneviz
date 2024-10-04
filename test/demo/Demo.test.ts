/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  createCesiumContainer,
  createTestViewerOptions,
} from "../helpers/MockUtils";
import { mount } from "@vue/test-utils";
import CesiumViewer from "../../src/components/CesiumViewer.vue";
import { Cesium3DTileset, Viewer } from "cesium";
import { fireEvent } from "@testing-library/vue";
import { initDemo } from "../../src/demo/Demo";

describe("Demo mode", () => {
  test("Init demo", () => {
    const div = document.createElement("div");
    div.id = "cesiumContainer";
    document.body.appendChild(div);

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());
    initDemo(viewer);
  });

  test("Invalid viewer", () => {
    const div = document.createElement("viewer-div");

    const viewer = new Viewer(div);
    initDemo(viewer);
  });

  test("Invalid toolbar", () => {
    createCesiumContainer();

    mount(CesiumViewer, {
      props: {
        webGLMock: createTestViewerOptions,
        tilesetMock: new Cesium3DTileset({}), // stay below cesium quota
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
        tilesetMock: new Cesium3DTileset({}), // stay below cesium quota
      },
      attachTo: div,
    });

    const toolbar = document.getElementById(
      "demo-entity-selection",
    )! as HTMLSelectElement;

    // fire event to select each option
    for (let i = 0; i < toolbar.options.length; i += 1) {
      toolbar.options.selectedIndex = i;
      fireEvent.update(toolbar, toolbar.options[i]!.value);
    }
  });
});
