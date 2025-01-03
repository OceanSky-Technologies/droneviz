import { Cesium3DTileset, SceneMode } from "cesium";
import { getCesiumViewer, initCesium } from "@/components/CesiumViewerWrapper";
import {
  createCesiumContainer,
  createTestViewerOptions,
} from "@/tests/test-utils/MockUtils";
import { describe, expect, test } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import MainToolbar from "@/components/MainToolbar.vue";

describe("MainToolbar", () => {
  test("Mounting toolbar", async () => {
    createCesiumContainer();

    await initCesium(await createTestViewerOptions(), new Cesium3DTileset({})); // stay below cesium quota by disabling tileset);

    const wrapper = await mountSuspended(MainToolbar);

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

    expect(getCesiumViewer().scene.mode).toBe(sceneModeInitial);
  });
});
