/** @type {import('tailwindcss').Config} */

import * as tailwindcss_primeui from "tailwindcss-primeui";

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./theme/**/*.{js,vue,ts}",
  ],
  theme: {},
  corePlugins: {
    // preflight: false,
  },
  darkMode: ["selector"],
  plugins: [tailwindcss_primeui],
};
