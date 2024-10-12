/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createViewerOptions } from "../../src/helpers/CesiumViewerOptions";
import { settings } from "../../src/components/Settings";

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
