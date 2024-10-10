import {
  Ion,
  Viewer,
  Cesium3DTileset,
  createGooglePhotorealistic3DTileset,
  Math,
  Cartesian3,
} from "cesium";
import { initDemo } from "@/demo/Demo";
import { getViewerOptions } from "@/helpers/CesiumViewerOptions";
import CesiumMouseHandler from "./CesiumMouseHandler";
import { run } from "./EntityHandler";
import { settings } from "@/components/Settings";

Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTJmM2RmYi0wMDI3LTQxYmMtYjY1NS00MzhmYzg4Njk1NTMiLCJpZCI6MjExMDU5LCJpYXQiOjE3MTM5OTExNTh9.cgvEwVgVgDQRqLsZzWCubdKnui9qoZAXTPCRbtVzZmo";

/**
 * Cesium container class.
 */
export class CesiumViewerImpl {
  props: Props;
  viewer: Viewer;
  mouseHandlers: CesiumMouseHandler;
  googleTileset: Cesium3DTileset | undefined;

  /**
   * Initialize the cesium viewer.
   * @param {Props} props Properties to initialize with.
   */
  constructor(props: Props) {
    this.props = props;

    if (this.props.webGLMock) {
      console.info("Cesium setup using webGL mock");
      const viewerOptionsGenerator = this.props
        .webGLMock as unknown as () => Viewer.ConstructorOptions;
      this.viewer = new Viewer("cesiumContainer", viewerOptionsGenerator());
    } else {
      this.viewer = new Viewer("cesiumContainer", getViewerOptions());
    }

    this.viewer.scene.globe.tileCacheSize = settings.tileCacheSize.value; // improve rendering speed
    this.viewer.scene.postProcessStages.fxaa.enabled = settings.fxaa.value;
    this.viewer.scene.debugShowFramesPerSecond =
      settings.showFramesPerSecond.value;

    // fix unprecise height values on mouse over: https://github.com/CesiumGS/cesium/issues/8707#issuecomment-606778413
    this.viewer.scene.globe.depthTestAgainstTerrain = true;

    // pre-select a base layer
    if (this.viewer.baseLayerPicker) {
      const baseLayerPickerViewModel = this.viewer.baseLayerPicker.viewModel;
      if (baseLayerPickerViewModel.imageryProviderViewModels.length > 6) {
        const defaultImagery =
          baseLayerPickerViewModel.imageryProviderViewModels[6]; // 6 is Open Street Map
        if (defaultImagery) {
          baseLayerPickerViewModel.selectedImagery = defaultImagery;
        } else throw new Error("Default imageProviderViewModel out of bounds!");
      }
    }

    if (settings.google3DTilesEnabled.value) {
      this.initGoogleTileset();
    }

    this.mouseHandlers = new CesiumMouseHandler(this.viewer);

    initDemo(this.viewer);

    this.resetCamera();

    run(this.viewer);
  }

  /**
   * Cleans up all resources.
   */
  destroy() {
    if (this.googleTileset) this.googleTileset.destroy();
    this.viewer.entities.removeAll();
    this.viewer.destroy();
  }

  /**
   * Initialize Google 3D Tileset.
   */
  async initGoogleTileset() {
    if (this.props.tilesetMock) {
      console.log("Mocking tileset");
      this.googleTileset = this.props.tilesetMock;
      this.viewer.scene.globe.show = false;

      return;
    }

    console.log("Initializing Google 3D tiles");

    let googleApiKey = undefined;
    if (settings.googleApiKey.value && settings.googleApiKey.value !== "")
      googleApiKey = settings.googleApiKey.value;

    createGooglePhotorealistic3DTileset(googleApiKey, {
      //maximumScreenSpaceError: 8, // quality
      preloadFlightDestinations: true,
      showCreditsOnScreen: true,
    })
      .then((tileset: Cesium3DTileset) => {
        this.googleTileset = this.viewer.scene.primitives.add(tileset);

        // on high zoom levels the globe and 3D tiles overlap / get mixed -> disable globe if 3D tiles are enabled
        this.viewer.scene.globe.show = false;
      })
      .catch((reason: unknown) => {
        console.error("Could not create 3D Google Tiles: " + reason);
      });
  }

  /**
   * Enable the Google 3D tiles.
   */
  async enableGoogleTiles() {
    if (settings.google3DTilesEnabled.value) {
      if (!this.googleTileset) return;

      this.googleTileset.show = true;
      this.viewer.scene.requestRender();
      this.viewer.scene.globe.show = false;
      console.log("3D Google tiles enabled");
    }
  }

  /**
   * Disable the Google 3D tiles.
   */
  async disableGoogleTiles() {
    if (!this.googleTileset) return;

    this.googleTileset.show = false;
    this.viewer.scene.globe.show = true;
    this.viewer.scene.requestRender();
    console.log("3D Google tiles disabled");
  }

  /**
   * Resets the camera.
   */
  resetCamera() {
    // fly the camera to San Francisco
    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
      orientation: {
        heading: Math.toRadians(0.0),
        pitch: Math.toRadians(-15.0),
      },
    });
  }
}

export interface Props {
  webGLMock?: (() => Viewer.ConstructorOptions) | undefined;
  tilesetMock?: Cesium3DTileset | undefined;
}
