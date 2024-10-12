import { afterEach } from "vitest";
import { cleanup } from "@testing-library/vue";
import { config } from "@vue/test-utils";
import { defaultOptions } from "primevue/config";
import { destroyCesium } from "./src/components/CesiumViewerWrapper";
import { settings } from "./src/components/Settings";

config.global.mocks["$primevue"] = {
  config: defaultOptions,
};

beforeEach(() => {
  // disable Google and Bing Maps to reduce quota usage
  settings.google3DTilesEnabled.value = false;
  settings.bingEnabled.value = false;
});

afterEach(() => {
  vi.restoreAllMocks();
  destroyCesium();
  cleanup();
});
