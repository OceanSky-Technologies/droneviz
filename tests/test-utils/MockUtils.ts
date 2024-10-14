/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Entity, Viewer } from "cesium";
import {
  Cesium3DTileset,
  ColorMaterialProperty,
  Model,
  ProviderViewModel,
  DataSourceCollection,
} from "cesium";
import getWebGLStub from "./getWebGLStub";
import CesiumViewer from "~/components/CesiumViewer.vue";
import { createViewerOptions } from "~/utils/CesiumViewerOptions";
import { mountSuspended } from "@nuxt/test-utils/runtime";

/**
 * Provides Cesium Viewer.ConstructorOptions for usage in unit tests.
 * The ConstructorOptions use the default settings but additionally these tweaks:
 * - WebGL stub for using Cesium
 * - no baseLayerPicker/imageProviderViewModels to reduce Bing Map quota
 * @returns {Viewer.ConstructorOptions} new Viewer.ConstructorOptions
 */
export function createTestViewerOptions(): Viewer.ConstructorOptions {
  return {
    ...createViewerOptions(),
    contextOptions: { getWebGLStub },

    imageryProviderViewModels: [
      new ProviderViewModel({
        name: "test",
        tooltip: "",
        iconUrl: "",
        creationFunction: () => Promise.resolve([]),
      }),
    ],
    terrainProviderViewModels: [],
    dataSources: new DataSourceCollection(),
  };
}

/**
 * Create and mount a CesiumViewer object.
 * @returns {object} wrapper of mounted CesiumViewer
 */
export async function mountCesiumViewerMock() {
  let root = document.getElementById("root");
  while (root?.firstChild) {
    root.removeChild(root.lastChild!);
  }

  if (root) document.body.removeChild(root);

  root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);

  createCesiumContainer();

  const wrapper = await mountSuspended(CesiumViewer, {
    route: "/",
    props: {
      mockViewerOptions: createTestViewerOptions(),
      googleTilesetMock: new Cesium3DTileset({}), // stay below cesium quota by disabling tileset
    },
    attachTo: root,
  });

  return wrapper;
}

/**
 * Creates an emtpy cesiumContainer div.
 */
export function createCesiumContainer() {
  const cesiumContainer = document.createElement("div");
  cesiumContainer.setAttribute("id", "cesiumContainer");
  document.body.appendChild(cesiumContainer);
}

/**
 * Silences all console log outputs.
 * @param {boolean} silenceStdErr If true, also silences console.error
 */
export function silenceConsole(silenceStdErr?: boolean) {
  vi.spyOn(console, "log").mockImplementation(() => {
    /* do nothing */
  });

  if (silenceStdErr) {
    vi.spyOn(console, "error").mockImplementation(() => {
      /* do nothing */
    });
  }
}

/**
 * Create an entity that has a model with color.
 * @returns {object} entity with model
 */
export async function createEntityWithModel(): Promise<any> {
  mockCesiumModel();

  const model = {
    ...Model,
    color: new ColorMaterialProperty(),
  };
  const entity = { id: { model: model } } as unknown as Entity;
  return entity;
}

/**
 * Mock the Cesium Model class so it can be used in unit tests with "const model = new Model();".
 */
export function mockCesiumModel() {
  // mock the Model class
  vi.mock("cesium", async (importOriginal) => {
    const Model = function () {}; // Mock constructor
    const actual = await importOriginal();
    return {
      ...(typeof actual === "object" ? actual : {}),
      Model,
    };
  });
}
