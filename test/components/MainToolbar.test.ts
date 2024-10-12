import { mount } from "@vue/test-utils";
import MainToolbar from "../../src/components/MainToolbar.vue";
import { Cesium3DTileset, SceneMode } from "cesium";
import {
  getCesiumViewer,
  initCesium,
} from "../../src/components/CesiumViewerWrapper";
import {
  createCesiumContainer,
  createTestViewerOptions,
} from "../helpers/MockUtils";

describe("MainToolbar", () => {
  test("Mounting toolbar", async () => {
    createCesiumContainer();

    await initCesium(createTestViewerOptions(), new Cesium3DTileset({})); // stay below cesium quota by disabling tileset);

    const wrapper = mount(MainToolbar);

    const sceneModeInitial = getCesiumViewer().scene.mode;

    // dark mode can be toggled
    await wrapper
      .findComponent({ name: "ToggleSwitch", id: "#3d-toggle-switch" })
      .find("input")
      .trigger("change");

    if (sceneModeInitial === SceneMode.SCENE3D) {
      expect(getCesiumViewer().scene.mode).toBe(SceneMode.SCENE2D);
    } else {
      expect(getCesiumViewer().scene.mode).toBe(SceneMode.SCENE3D);
    }

    await wrapper
      .findComponent({ name: "ToggleSwitch", id: "#3d-toggle-switch" })
      .find("input")
      .trigger("change");

    await wrapper.vm.$nextTick();

    expect(getCesiumViewer().scene.mode).toBe(sceneModeInitial);
  });
});
