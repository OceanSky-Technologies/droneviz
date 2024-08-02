/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */

module.exports = {
  // ...
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./presets/**/*.{js,vue,ts}",
  ],
  theme: {
    extend: {},
  },
  corePlugins: {
    // preflight: false,
  },
  darkMode: ["selector", '[class*="dark"]'],
  plugins: [require("tailwindcss-primeui")],
};
