import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { enableAutoUnmount } from "@vue/test-utils";
import { cleanup } from "@testing-library/vue";

enableAutoUnmount(afterEach);

afterEach(() => {
  cleanup();
});
