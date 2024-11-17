import { createViewerOptions } from "~/utils/CesiumViewerOptions";
import { settings } from "~/utils/Settings";
import { describe, expect, test } from "vitest";

describe("CesiumViewerOptions", () => {
  test("ImageryProviderViewModels Bing", () => {
    settings.bingEnabled.value = true;

    const viewerOptions = createViewerOptions();

    // count bing providers
    let bingImageProvidersFound = 0;
    for (const element of viewerOptions.imageryProviderViewModels!) {
      if (element.name.indexOf("Bing Maps") != -1) bingImageProvidersFound++;
    }
    expect(bingImageProvidersFound).toBe(2);
  });
});
