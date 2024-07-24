/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { mount } from "@vue/test-utils";
import CesiumViewer from "../../src/components/CesiumViewer.vue";
import { getMockViewerOptions } from "../helpers/MockDOMUtils";

describe("CesiumViewer", () => {
  test("Mounting Cesium container", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    mount(CesiumViewer, {
      props: { mockWebGLFunction: getMockViewerOptions },
      attachTo: div,
    });

    // cesium container
    expect(
      document.getElementById("cesiumContainer")!.innerHTML,
      "cesiumContainer is empty",
    ).not.toBe(undefined);

    // toolbar
    expect(
      document.getElementById("toolbar")!.innerHTML,
      "toolbar is empty",
    ).not.toBe(undefined);
  });
});
