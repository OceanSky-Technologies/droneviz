import { mountCesiumViewerMock } from "~/tests/test-utils/MockUtils";
import { fireEvent } from "@testing-library/vue";
import { describe, test } from "vitest";

describe("Demo mode", () => {
  test("Select toolbar options", async () => {
    await mountCesiumViewerMock();

    const toolbar = document.getElementById(
      "demo-entity-selection",
    )! as HTMLSelectElement;

    // fire event to select each option
    for (let i = 0; i < toolbar.options.length; i += 1) {
      toolbar.options.selectedIndex = i;
      fireEvent.update(toolbar, toolbar.options[i]!.value);
    }
  });
});
