export let darkMode: Ref<boolean | null> = ref(null);

// using localStorage the dark mode setting is synchronized between windows
//
// react to changes to it like this:
//   window.addEventListener("storage", (event) => {
//     if (event.key === "dark-mode") {
//       const isDarkMode = event.newValue === "true";
//       document.documentElement.classList.toggle("dark", isDarkMode);
//     }
//   });

export function setDarkMode(value: boolean) {
  darkMode.value = value;

  if (value) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("dark-mode", true.toString());
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("dark-mode", false.toString());
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
