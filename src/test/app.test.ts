import jsdom from "jsdom";
import { beforeEach, describe, expect, it } from "vitest";

/* eslint @typescript-eslint/no-non-null-assertion: 0 */

const indexHtmlPath = "./src/index.html";

describe("unit tests", function () {
  let dom: jsdom.JSDOM;
  beforeEach(async function () {
    dom = await jsdom.JSDOM.fromFile(indexHtmlPath, {
      resources: "usable",
      runScripts: "dangerously",
    });
    await new Promise((resolve) =>
      dom.window.addEventListener("load", resolve),
    );
  });

  it("html structure", function () {
    // cesiumContainer
    expect(
      dom.window.document.getElementById("cesiumContainer")!.innerHTML,
      "cesiumContainer doesn't exist",
    ).not.toBe(undefined);

    // TODO: WEBGL NOT SUPPORTED BY JSDOM (only with canvas package which is a pain).
    //  MAYBE SWITCH TO HAPPY DOM SOON ? https://github.com/capricorn86/happy-dom/issues/241
    // const canvas1 = dom.window.document.createElement("canvas");
    // const ctx1 = canvas1.getContext("2d");
    // console.log("2D canvas:", ctx1);

    // const canvas2 = dom.window.document.createElement("canvas");
    // const ctx2 = canvas2.getContext("webgl");
    // console.log("WebGL canvas", ctx2);

    // cesiumContainer
    expect(
      dom.window.document.getElementById("toolbar")!.innerHTML,
      "toolbar doesn't exist",
    ).not.toBe(undefined);
  });

  // it("app loading", function () {
  //   dom.window.document.dispatchEvent(
  //     new Event("DOMContentLoaded", {
  //       bubbles: true,
  //     }),
  //   );

  //   document = dom.window.document;
  //   loadWindow(dom.window.document);
  // });
});
