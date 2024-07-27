import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (confirm("New content available. Reload?")) {
      updateSW(true);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onOfflineReady() {},
});
