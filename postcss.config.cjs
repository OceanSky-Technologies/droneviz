/* eslint-disable no-undef */

module.exports = {
  plugins: {
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
    "postcss-nesting": {},
    ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {}),
  },
};
