import { eventBus } from "@/utils/Eventbus";

export let darkMode: Ref<boolean | null> = ref(null);

let childWindows: WindowProxy[] = [];

export function setDarkMode(value: boolean) {
  darkMode.value = value;

  cleanupClosedWindows();

  if (value) {
    eventBus.emit("darkMode", true);

    document.documentElement.classList.add("dark");
    for (const window of childWindows) {
      window.document.documentElement.classList.add("dark");
    }
  } else {
    eventBus.emit("darkMode", false);

    document.documentElement.classList.remove("dark");
    for (const window of childWindows) {
      window.document.documentElement.classList.remove("dark");
    }
  }
}

export function toggleDarkMode() {
  if (darkMode.value) {
    setDarkMode(false);
  } else {
    setDarkMode(true);
  }
}

export function initDarkMode() {
  if (settings.darkMode.value === DarkMode.System) {
    // get system scheme
    if (import.meta.client) {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setDarkMode(true);
      } else {
        setDarkMode(false);
      }
    } else {
      setDarkMode(true);
    }
  } else {
    setDarkMode(settings.darkMode.value === DarkMode.Dark);
  }
}

export function registerDarkModeWindow(window: WindowProxy) {
  // When the new window opens, copy the dark mode class if it's already enabled in the main window
  window.onload = () => {
    if (document.body.classList.contains("dark")) {
      window.document.documentElement.classList.add("dark");
    }
  };

  childWindows.push(window);
}

export function cleanupClosedWindows() {
  childWindows = childWindows.filter((win) => !win.closed);
}
