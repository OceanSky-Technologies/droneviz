import { render } from "@testing-library/vue";
import App from "../src/App.vue";
import { enableAutoUnmount } from "@vue/test-utils";

import "../src/main";

enableAutoUnmount(afterEach);

describe("App", () => {
  test("App startup", () => {
    // mock CesiumViewer so it doesn't throw "WebGL not supported" error
    vi.mock("../src/components/CesiumViewer.vue", () => {
      return {
        default: vi.fn(),
      };
    });

    render(App);
  });
});
