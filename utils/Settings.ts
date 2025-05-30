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
  google3DTilesEnabled: Ref<boolean>; // costs quota
  googleApiKey: Ref<string | undefined>; // empty because this will use Cesium's API key which doesn't cost anything.
  bingEnabled: Ref<boolean>; // costs quota
  tileCacheSize: Ref<number>;
  sceneMode: Ref<SceneMode>;
  msaaSamples: Ref<number>; // don't use 0/disabled because transparent object rendering doesn't work then
  fxaa: Ref<boolean>;
  showFramesPerSecond: Ref<boolean>;
  demoMode: Ref<boolean>;
  enableMousePositionInfo: Ref<boolean>;
  mousePositionInfoMostDetailed: Ref<boolean>; // most detailed position retrieval triggers the API and increases quota!
  darkMode: Ref<DarkMode>;
  disableAnimations: Ref<boolean>;

  heartbeatInterval: Ref<number>; // milliseconds, 0: disabled

  /**
   * Constructs a new Settings class with default values.
   */
  constructor() {
    this.google3DTilesEnabled = ref(true);
    this.googleApiKey = ref(undefined);
    this.bingEnabled = ref(true);
    this.tileCacheSize = ref(1000);
    this.sceneMode = ref(SceneMode.SCENE3D);
    this.msaaSamples = ref(1);
    this.fxaa = ref(false);
    this.showFramesPerSecond = ref(true);
    this.demoMode = ref(false);
    this.enableMousePositionInfo = ref(true);
    this.mousePositionInfoMostDetailed = ref(false);
    this.darkMode = ref(DarkMode.Dark);
    this.disableAnimations = ref(true);

    this.heartbeatInterval = ref(1000);
  }
}

export const settings = new Settings();
