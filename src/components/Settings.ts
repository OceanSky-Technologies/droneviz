import { SceneMode } from "cesium";
import { Ref, ref } from "vue";

/**
 * Collection of all settings.
 */
class Settings {
  google3DTilesEnabled: Ref<boolean>;
  googleApiKey: Ref<string | undefined>;
  tileCacheSize: Ref<number>;
  sceneMode: Ref<SceneMode>;
  msaaSamples: Ref<number>;
  fxaa: Ref<boolean>;
  showFramesPerSecond: Ref<boolean>;
  enableMousePositionInfo: Ref<boolean>;
  mousePositionInfoMostDetailed: Ref<boolean>;

  /**
   * Constructs a new Settings class with default values.
   */
  constructor() {
    this.google3DTilesEnabled = ref(true);
    this.googleApiKey = ref(undefined); // empty because this will use Cesium's API key which doesn't cost anything.
    this.tileCacheSize = ref(1000);
    this.sceneMode = ref(SceneMode.SCENE3D);
    this.msaaSamples = ref(0);
    this.fxaa = ref(true);
    this.showFramesPerSecond = ref(true);
    this.enableMousePositionInfo = ref(true);
    this.mousePositionInfoMostDetailed = ref(false); // most detailed position retrieval triggers the API and increases quota!
  }
}

export const settings = new Settings();
