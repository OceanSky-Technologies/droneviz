/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Cesium3DTileset,
  ColorMaterialProperty,
  DataSourceCollection,
  Entity,
  Model,
  Viewer,
} from "cesium";
import getWebGLStub from "./getWebGLStub";
import CesiumViewer from "../../src/components/CesiumViewer.vue";
import { getViewerOptions } from "../../src/helpers/CesiumViewerOptions";
import { mount } from "@vue/test-utils";

/**
 * Provides Cesium Viewer.ConstructorOptions for usage in unit tests.
 * The ConstructorOptions use the default settings but additionally these tweaks:
 * - WebGL stub for using Cesium
 * - no baseLayerPicker/imageProviderViewModels to reduce Bing Map quota
 * @returns {Viewer.ConstructorOptions} new Viewer.ConstructorOptions
 */
export function createTestViewerOptions(): Viewer.ConstructorOptions {
  return {
    ...getViewerOptions(),
    contextOptions: { getWebGLStub },

    // reduce Bing Map quota
    imageryProviderViewModels: [],
    geocoder: false,
    baseLayerPicker: false,
    dataSources: new DataSourceCollection(),
  };
}

/**
 * Create and mount a CesiumViewer object.
 * @returns {object} wrapper of mounted CesiumViewer
 */
export function mountCesiumViewer() {
  let root = document.getElementById("root");
  while (root?.firstChild) {
    root.removeChild(root.lastChild!);
  }

  if (root) document.body.removeChild(root);

  root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  return mount(CesiumViewer, {
    props: {
      webGLMock: createTestViewerOptions,
      tilesetMock: new Cesium3DTileset({}), // stay below cesium quota by disabling tileset
    },
    attachTo: root,
  });
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
 */
export function silenceConsole() {
  vi.spyOn(console, "log").mockImplementation(() => {
    /* do nothing */
  });

  vi.spyOn(console, "error").mockImplementation(() => {
    /* do nothing */
  });
}

/**
 * Create an entity that has a model with color.
 * @returns {object} entity with model
 */
export async function createEntityWithModel(): Promise<any> {
  const modelPath = new URL("/src/assets/models/Plane.glb", import.meta.url)
    .href;

  const model = {
    ...(await Model.fromGltfAsync({ url: modelPath })),
    color: new ColorMaterialProperty(),
  };
  const entity = { id: { model: model } } as unknown as Entity;
  return entity;
}
