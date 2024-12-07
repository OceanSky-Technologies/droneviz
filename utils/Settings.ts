import { SceneMode } from "cesium";
import type { Ref } from "vue";
import { ref } from "vue";

export enum DarkMode {
  Dark = "dark",
  Light = "light",
  System = "system",
}

/**
 * Collection of all settings.
 */
class Settings {
  google3DTilesEnabled: Ref<boolean>;
  googleApiKey: Ref<string | undefined>;
  bingEnabled: Ref<boolean>;
  tileCacheSize: Ref<number>;
  sceneMode: Ref<SceneMode>;
  msaaSamples: Ref<number>;
  fxaa: Ref<boolean>;
  showFramesPerSecond: Ref<boolean>;
  demoMode: Ref<boolean>;
  enableMousePositionInfo: Ref<boolean>;
  mousePositionInfoMostDetailed: Ref<boolean>;
  darkMode: Ref<DarkMode>;

  heartbeatInterval: Ref<number>; // milliseconds, 0: disabled
  manualControlInterval: Ref<number>; // milliseconds, 0: disabled

  /**
   * Constructs a new Settings class with default values.
   */
  constructor() {
    this.google3DTilesEnabled = ref(true);
    this.googleApiKey = ref(undefined); // empty because this will use Cesium's API key which doesn't cost anything.
    this.bingEnabled = ref(true);
    this.tileCacheSize = ref(1000);
    this.sceneMode = ref(SceneMode.SCENE3D);
    this.msaaSamples = ref(0);
    this.fxaa = ref(true);
    this.showFramesPerSecond = ref(true);
    this.demoMode = ref(false);
    this.enableMousePositionInfo = ref(true);
    this.mousePositionInfoMostDetailed = ref(false); // most detailed position retrieval triggers the API and increases quota!
    this.darkMode = ref(DarkMode.Dark);

    this.heartbeatInterval = ref(1000);
    this.manualControlInterval = ref(0);
  }
}

export const settings = new Settings();
