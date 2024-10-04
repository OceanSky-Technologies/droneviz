import { afterEach } from "vitest";
import { enableAutoUnmount } from "@vue/test-utils";
import { cleanup } from "@testing-library/vue";

// clean up after each test
enableAutoUnmount(afterEach);

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  document.body.innerHTML = "";
});
