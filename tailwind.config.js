/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */

module.exports = {
  // ...
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./presets/**/*.{js,vue,ts}",
    // other paths
  ],
  theme: {
    extend: {},
  },
  plugins: [require("tailwindcss-primeui")],
};
