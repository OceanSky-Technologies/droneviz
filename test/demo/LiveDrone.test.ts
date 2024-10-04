import { Viewer } from "cesium";
import { getCameraPosition } from "../../src/demo/LiveDrone";
import {
  createCesiumContainer,
  createTestViewerOptions,
} from "../helpers/MockUtils";

describe("LiveDrone", () => {
  test("Try to create live drone without entity", () => {
    createCesiumContainer();

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());

    // this viewer lacks the entity to get the camera position from
    getCameraPosition(viewer);
  });
});
