import { render } from "@testing-library/vue";
import App from "../src/App.vue";

import "../src/main";

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
