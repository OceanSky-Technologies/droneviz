import { Viewer } from "cesium";
import getWebGLStub from "./getWebGLStub";
import { getViewerOptions } from "../../src/components/CesiumViewer";

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
    imageryProviderViewModels: [], // reduce Bing Map quota
    baseLayerPicker: false, // reduce Bing Map quota
  };
}

/**
 * Create a new HTML element.
 * @param {string} tag element tag
 * @param {string} id element id
 * @returns {HTMLElement} new HTML element
 */
export function createHtmlElement(tag: string, id?: string): HTMLElement {
  const mockElement = document.createElement(tag);
  if (id) mockElement.setAttribute("id", id);

  // returned element needs to be appended to parent element using `x.appendChild() / document.body.appendChild()`
  return mockElement;
}
