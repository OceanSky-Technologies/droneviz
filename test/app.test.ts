import { render } from "@testing-library/vue";
import App from "../src/App.vue";

describe("App", () => {
  test("App startup", () => {
    try {
      render(App);
    } catch (error) {
      // expect a webGL exception
      if (String(error).includes("The browser does not support WebGL")) {
        return;
      } else throw error;
    }
  });
});
