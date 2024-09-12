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
// @ts-expect-error no declared types at this time
import primeui from "tailwindcss-primeui";

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
        { src: `images`, dest: `` },
      ],
    }),
    vue(),
    primeui,
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
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365 * 10, // <== 10 years
              },
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
                maxAgeSeconds: 60 * 60 * 24 * 365 * 10, // <== 10 years
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
                maxAgeSeconds: 60 * 60 * 24 * 365 * 10, // <== 10 years
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
                maxAgeSeconds: 60 * 60 * 24 * 365 * 10, // <== 10 years
              },
              matchOptions: { ignoreVary: true },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      includeAssets: ["images/**/*"],
      manifest: {
        name: "Droneviz - OceanSky Technologies",
        short_name: "Droneviz",
        description: "Monitor and control software for OceanSky UAVs",
        theme_color: "#242424",
        screenshots: [
          // todo: add real screenshots
          {
            src: "/images/oceansky-logo.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "/images/oceansky-logo.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
        icons: [
          {
            src: "/images/oceansky-logo.svg",
            sizes: "150x150",
            type: "image/svg",
          },
          {
            src: "/images/oceansky-logo.png",
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
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  test: {
    root: ".",
    exclude: ["node_modules", "mavlink-ts"],
    globals: true, // enable jest-like global test APIs
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
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
        "**/__tests__/**",
        "**/__x00__*",
        "**/.{eslint,mocha,prettier}rc.{?(c|m)js,yml}",
        "**/[.]**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
        "**/*.d.ts",
        "**/*{.,-}{test,spec,bench,benchmark}?(-d).?(c|m)[jt]s?(x)",
        "**/\x00*",
        "**/coverage/**",
        "**/cypress/**",
        "**/dev-dist/**",
        "**/dist/**",
        "**/forge.config.js",
        "**/node_modules/**",
        "**/packages/*/test?(s)/**",
        "**/postcss.config.js",
        "**/src/presets/*",
        "**/tailwind.config.js",
        "**/test?(-*).?(c|m)[jt]s?(x)",
        "**/test?(s)/**",
        "**/virtual:*",
        "**/vitest.{workspace,projects}.[jt]s?(on)",
        "mavlink-ts/**/*",
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
    exclude: ["@vitest/coverage-istanbul", "*/deps/workbox-window.js"],
  },
});
