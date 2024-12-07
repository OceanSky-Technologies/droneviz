import { createViewerOptions } from "@/utils/CesiumViewerOptions";
import { describe, expect, test } from "vitest";

describe("CesiumViewerOptions", () => {
  test("Bing not enabled by default", () => {
    const viewerOptions = createViewerOptions();

    // count bing providers
    let bingImageProvidersFound = 0;
    for (const element of viewerOptions.imageryProviderViewModels!) {
      if (element.name.indexOf("Bing Maps") !== -1) bingImageProvidersFound++;
    }
    expect(bingImageProvidersFound).toBe(0);
  });
});
