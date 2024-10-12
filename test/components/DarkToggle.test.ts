import { mount } from "@vue/test-utils";
import DarkToggle from "../../src/components/DarkToggle.vue";

describe("DarkToggle", () => {
  test("Toggle dark mode", async () => {
    const wrapper = mount(DarkToggle);

    // figure out if the dark mode was enabled by the system
    const darkModeInitially =
      document.documentElement.classList.contains("dark");

    // dark mode can be toggled
    await wrapper.find("button#dark-mode-toggle-button").trigger("click");

    expect(document.documentElement.classList.contains("dark")).toBe(
      !darkModeInitially,
    );

    // another toggle reverts it back
    await wrapper.find("button#dark-mode-toggle-button").trigger("click");

    expect(document.documentElement.classList.contains("dark")).toBe(
      darkModeInitially,
    );
  });
});
