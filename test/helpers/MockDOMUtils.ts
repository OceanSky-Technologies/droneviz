import { Viewer } from "cesium";
import { getViewerOptions } from "../../src/components/CesiumViewer.vue";
import getWebGLStub from "./getWebGLStub";

// mount the viewer options using a wegGLStub
export function getMockViewerOptions(): Viewer.ConstructorOptions {
  return {
    ...getViewerOptions(),
    contextOptions: { getWebGLStub: getWebGLStub },
  };
}

export function createContainer(tag: string, id?: string) {
  const mockElement = document.createElement(tag);
  if (id) mockElement.setAttribute("id", id);
  return mockElement;
}
