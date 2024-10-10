import { SkyAtmosphere, Terrain, Viewer } from "cesium";
import { settings } from "@/components/Settings";

/**
 * Create Cesium Viewer default options.
 * @returns {Viewer.ConstructorOptions} Default options
 */
export function getViewerOptions(): Viewer.ConstructorOptions {
  return {
    useBrowserRecommendedResolution: true,
    animation: false,
    timeline: false,
    infoBox: false,
    baseLayerPicker: true,
    selectionIndicator: false,
    sceneMode: settings.sceneMode.value,
    shouldAnimate: true,
    shadows: false,
    blurActiveElementOnCanvasFocus: false,
    msaaSamples: settings.msaaSamples.value,
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
    skyAtmosphere: new SkyAtmosphere(),
    terrain: Terrain.fromWorldTerrain({
      requestWaterMask: false,
    }),
  };
}
