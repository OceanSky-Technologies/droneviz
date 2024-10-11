/* eslint-disable no-undef */

export default {
  plugins: {
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
    "postcss-nesting": {},
    ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {}),
  },
};
