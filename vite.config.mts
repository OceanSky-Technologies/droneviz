/// <reference types="vitest" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import vue from "@vitejs/plugin-vue";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

const cesiumSource = "node_modules/cesium/Build/Cesium";
// This is the base url for static files that CesiumJS needs to load.
// Set to an empty string to place the files at the site's root path
const cesiumBaseUrl = "cesiumStatic";

export default defineConfig({
  define: {
    // Define relative base path in cesium for loading assets
    // https://vitejs.dev/config/shared-options.html#define
    CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
  },
  plugins: [
    // Copy Cesium Assets, Widgets, and Workers to a static directory.
    // If you need to add your own static files to your project, use the `public` directory
    // and other options listed here: https://vitejs.dev/guide/assets.html#the-public-directory
    viteStaticCopy({
      targets: [
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
        { src: `src/assets/models`, dest: "assets" },
      ],
    }),
    vue(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "module",
      },
      workbox: {
        disableDevLogs: true, // enable to identify caching problems
        globPatterns: ["**/*"],
        maximumFileSizeToCacheInBytes: 200000000,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              return (
                !url.pathname.startsWith("http") &&
                !url.pathname.startsWith("www.")
              );
            },
            handler: "CacheFirst",
            options: {
              cacheName: "api-cache",
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/tile\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-tiles-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              matchOptions: { ignoreVary: true },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/assets\.ion\.cesium\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "cesium-ion-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              matchOptions: { ignoreVary: true },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/dev\.virtualearth\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "virtualearth-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              matchOptions: { ignoreVary: true },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      includeAssets: ["/src/assets/**/*"],
      manifest: {
        name: "Droneviz - OceanSky Technologies",
        short_name: "Droneviz",
        description: "Monitor and control software for OceanSky UAVs",
        theme_color: "#242424",
        screenshots: [
          // todo: add real screenshots
          {
            src: "/src/assets/oceansky-logo.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "/src/assets/oceansky-logo.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
        icons: [
          {
            src: "/src/assets/oceansky-logo.svg",
            sizes: "150x150",
            type: "image/svg",
          },
          {
            src: "/src/assets/oceansky-logo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  assetsInclude: ["**/*.glb"],
  build: {
    chunkSizeWarningLimit: 4000,
    emptyOutDir: true, // also necessary
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id!
              .toString()!
              .split("node_modules/")[1]!
              .split("/")[0]!
              .toString()!;
          } else return undefined;
        },
      },
    },
  },
  test: {
    root: ".",
    exclude: ["node_modules"],
    globals: true, // enable jest-like global test APIs
    environment: "happy-dom",
    browser: {
      name: "chromium",
      provider: "playwright",
      enabled: true,
      headless: true,
      ui: false,
      screenshotFailures: false,
      providerOptions: {
        launch: {
          args: ["--use-gl=egl", "--ignore-gpu-blocklist", "--use-gl=angle"],
        },
      },
    },
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      enabled: true,
      exclude: [
        "**/coverage/**",
        "**/dist/**",
        "**/dev-dist/**",
        "**/node_modules/**",
        "**/[.]**",
        "**/packages/*/test?(s)/**",
        "**/*.d.ts",
        "**/virtual:*",
        "**/__x00__*",
        "**/\x00*",
        "**/cypress/**",
        "**/test?(s)/**",
        "**/test?(-*).?(c|m)[jt]s?(x)",
        "**/*{.,-}{test,spec,bench,benchmark}?(-d).?(c|m)[jt]s?(x)",
        "**/__tests__/**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
        "**/vitest.{workspace,projects}.[jt]s?(on)",
        "**/.{eslint,mocha,prettier}rc.{?(c|m)js,yml}",
        "**/forge.config.js",
        "**/postcss.config.js",
        "**/tailwind.config.js",
        "**/src/pwa.mts",
        "**/src/presets/*",
      ],
      thresholds: {
        lines: 75,
        functions: 80,
        branches: 60,
        statements: 70,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  optimizeDeps: {
    exclude: ["@vitest/coverage-istanbul"],
  },
});
