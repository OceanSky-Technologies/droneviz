import { defineNuxtConfig } from "nuxt/config";
import { baseURL, baseHost } from "./baseURL.config";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false, // tauri needs this
  // Enables the development server to be discoverable by other devices when running on iOS physical devices
  devServer: { host: process.env.TAURI_DEV_HOST || baseHost },
  telemetry: false,
  compatibilityDate: "2024-10-14",
  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxt/test-utils/module",
    "@nuxtjs/html-validator",
    "@nuxtjs/tailwindcss",
    "@primevue/nuxt-module",
    "@vite-pwa/nuxt",
    ["unplugin-icons/nuxt", { scale: 1.5 }],
  ],
  css: ["/assets/style.css"],
  primevue: {
    importTheme: { from: "@/assets/theme.ts" },
  },
  tailwindcss: {
    configPath: "tailwind.config.js",
  },
  htmlValidator: {
    options: {
      rules: {
        "element-case": "off",
        "text-content": "off",
      },
    },
  },
  pwa: {
    registerType: "autoUpdate",
    strategies: "injectManifest",
    injectRegister: "auto",
    srcDir: "service-worker",
    filename: "sw.ts",
    devOptions: {
      enabled: true,
      type: "module",
      suppressWarnings: true,
    },
    manifest: false,
    workbox: {
      disableDevLogs: true, // enable to identify caching problems
      sourcemap: process.env.NODE_ENV !== "production",
      globPatterns: ["**/*.{html,mjs,js,ts,css,png,jpg,svg,glb}"],
      cleanupOutdatedCaches: false,
    },
    injectManifest: {
      globPatterns: ["**/*.{html,mjs,js,ts,css,png,jpg,svg,glb}"],
      maximumFileSizeToCacheInBytes: 1000 * 1024 * 1024,
    },
  },
  app: {
    head: {
      title: "Droneviz",
      htmlAttrs: {
        lang: "en",
      },
      link: [
        {
          rel: "icon",
          href: "/oceansky-logo.svg",
          sizes: "any",
          type: "image/svg+xml",
        },
        {
          rel: "apple-touch-icon",
          href: "/oceansky-logo.svg",
          sizes: "any",
          type: "image/svg+xml",
        },
        {
          rel: "mask-icon",
          href: "/oceansky-logo.svg",
          color: "#242424",
        },
        {
          rel: "dns-prefetch",
          href: "https://tile.googleapis.com",
        },
        {
          rel: "dns-prefetch",
          href: "https://assets.ion.cesium.com",
        },
        {
          rel: "dns-prefetch",
          href: "https://api.cesium.com",
        },
        {
          rel: "dns-prefetch",
          href: "https://dev.virtualearth.net",
        },
        {
          rel: "dns-prefetch",
          href: "https://ibasemaps-api.arcgis.com",
        },
        {
          rel: "dns-prefetch",
          href: "https://tile.openstreetmap.org",
        },
        {
          rel: "dns-prefetch",
          href: "https://tiles.stadiamaps.com",
        },
        {
          rel: "preconnect",
          href: "https://tile.googleapis.com",
          crossorigin: "anonymous",
        },
        {
          rel: "preconnect",
          href: "https://assets.ion.cesium.com",
          crossorigin: "anonymous",
        },
        {
          rel: "preconnect",
          href: "https://api.cesium.com",
          crossorigin: "anonymous",
        },
        {
          rel: "preconnect",
          href: "https://dev.virtualearth.net",
          crossorigin: "anonymous",
        },
        {
          rel: "preconnect",
          href: "https://ibasemaps-api.arcgis.com",
          crossorigin: "anonymous",
        },
        {
          rel: "preconnect",
          href: "https://tile.openstreetmap.org",
          crossorigin: "anonymous",
        },
        {
          rel: "preconnect",
          href: "https://tiles.stadiamaps.com",
          crossorigin: "anonymous",
        },
      ],
      meta: [{ name: "theme-color", content: "#242424" }],
      script: [
        {
          //must match the nitro config below for where the files are being served publicly
          innerHTML: `window.CESIUM_BASE_URL='_nuxt/Cesium';`,
        },
        {
          // Prevent right-click context menu globally
          innerHTML:
            'document.addEventListener("contextmenu", (event) => { \
               event.preventDefault(); \
             });',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      baseURL: baseURL,
    },
  },
  routeRules: {
    "/**": {
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Expose-Headers": "*",
        "Access-Control-Request-Method": "*",
        "Access-Control-Request-Headers": "*",
      },
    },
  },
  // imports: {
  //   autoImport: false, // breaks nuxt
  // },
  typescript: {
    strict: true,
    // typeCheck: true, // breaks Nuxt
    tsConfig: {
      compilerOptions: {
        types: ["@types/wicg-file-system-access"],
      },
    },
  },
  vite: {
    // Better support for Tauri CLI output
    clearScreen: false,
    // Enable environment variables
    // Additional environment variables can be found at
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ["VITE_", "TAURI_"],
    server: {
      // Tauri requires a consistent port
      strictPort: true,
    },
    plugins: [nodePolyfills()],
    build: {
      sourcemap: process.env.NODE_ENV === "development",
    },
  },
  nitro: {
    sourceMap: process.env.NODE_ENV !== "production",
    esbuild: {
      options: {
        target: "esnext",
      },
    },
    compressPublicAssets: true,
    externals: {
      inline: ["mavlink-mappings"], // make sure mavlink-mappings can be imported by the server with tauri in production mode
    },
    publicAssets: [
      {
        // Nuxt will copy the files here and serve them publicly
        baseURL: "_nuxt/Cesium/Assets",
        dir: "../node_modules/cesium/Build/Cesium/Assets",
      },
      {
        baseURL: "_nuxt/Cesium/Workers",
        dir: "../node_modules/cesium/Build/Cesium/Workers",
      },
      {
        baseURL: "_nuxt/Cesium/ThirdParty",
        dir: "../node_modules/cesium/Build/Cesium/ThirdParty",
      },
      {
        baseURL: "_nuxt/Cesium/Widgets",
        dir: "../node_modules/cesium/Build/Cesium/Widgets",
      },
    ],
  },
});
