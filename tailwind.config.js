/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */

import * as tailwindcss_primeui from "tailwindcss-primeui";

module.exports = {
  // ...
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  corePlugins: {
    // preflight: false,
  },
  darkMode: ["selector", '[class*="dark"]'],
  plugins: [tailwindcss_primeui],
};
