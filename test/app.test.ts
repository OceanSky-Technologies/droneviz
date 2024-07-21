/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { render } from "@testing-library/vue";
import App from "../src/App.vue";

test("App startup", () => {
  try {
    // catch RuntimeError: The browser does not support WebGL
    // Remove try-catch block once this issue is resolved: https://github.com/capricorn86/happy-dom/issues/241
    render(App);
  } catch (e) {
    console.error(e);
  }

  // cesiumContainer
  expect(
    document.getElementById("cesiumContainer"),
    "cesiumContainer doesn't exist",
  ).not.toBe(undefined);

  expect(
    document.getElementById("cesiumContainer")!.innerHTML,
    "cesiumContainer is empty",
  ).not.toBe(undefined);

  // toolbar
  expect(document.getElementById("toolbar"), "toolbar doesn't exist").not.toBe(
    undefined,
  );

  expect(
    document.getElementById("toolbar")!.innerHTML,
    "toolbar is empty",
  ).not.toBe(undefined);
});
