import { getCesiumViewer } from "./CesiumViewerWrapper";
import { Event as CesiumEvent } from "cesium";

export function init() {
  getCesiumViewer().camera.moveStart.addEventListener((event: CesiumEvent) => {
    eventBus.emit("cesiumCameraMoveStart", event);
  });
}
