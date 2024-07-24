import { getMockViewerOptions } from "../helpers/MockDOMUtils";
import { mount } from "@vue/test-utils";
import CesiumViewer from "../../src/components/CesiumViewer.vue";
import { Viewer } from "cesium";
import { initDemo } from "../../src/demo/Demo";

describe("Demo mode", () => {
  test("Init demo", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    mount(CesiumViewer, {
      props: { mockWebGLFunction: getMockViewerOptions },
      attachTo: div,
    });

    const viewer = new Viewer("cesiumContainer", getMockViewerOptions());
    initDemo(viewer);
  });
});
