import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/vue";
import { destroyCesium } from "./components/CesiumViewerWrapper";
import { settings } from "./components/Settings";

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

// Cesium uses promises during initialization but the tests do not wait for them.
// This will cause unhandled promise rejections.
// This is a workaround to catch unhandled promise rejections.
process.on("unhandledRejection", (_reason, _promise) => {
  // do nothing or log the error:
  // console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("handleError", (_reason, _promise) => {
  // do nothing or log the error:
  // console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
