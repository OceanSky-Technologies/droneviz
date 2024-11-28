import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false, // tauri needs this
  // Enables the development server to be discoverable by other devices when running on iOS physical devices
  devServer: { host: process.env.TAURI_DEV_HOST || "127.0.0.1" },
  telemetry: false,
  compatibilityDate: "2024-10-14",
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@nuxt/test-utils/module",
    "@nuxtjs/html-validator",
    "@nuxtjs/tailwindcss",
    "@primevue/nuxt-module",
    "@vite-pwa/nuxt",
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
          rel: "preconnect",
          href: "https://tile.googleapis.com",
          crossorigin: "anonymous",
        },
        {
          rel: "dns-prefetch",
          href: "https://assets.ion.cesium.com",
        },
        {
          rel: "preconnect",
          href: "https://assets.ion.cesium.com",
          crossorigin: "anonymous",
        },
        {
          rel: "dns-prefetch",
          href: "https://dev.virtualearth.net",
        },
        {
          rel: "preconnect",
          href: "https://dev.virtualearth.net",
          crossorigin: "anonymous",
        },
      ],
      meta: [{ name: "theme-color", content: "#242424" }],
      script: [
        {
          //must match the nitro config below for where the files are being served publicly
          children: `window.CESIUM_BASE_URL='_nuxt/Cesium';`,
        },
        {
          // Prevent right-click context menu globally
          children:
            'document.addEventListener("contextmenu", (event) => { \
               event.preventDefault(); \
             });',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      baseURL: "http://127.0.0.1:3000",
    },
  },
  routeRules: {
    "/api/**": { cors: true },
  },
  pwa: {
    devOptions: {
      enabled: true,
      type: "module",
      suppressWarnings: true,
    },
    manifest: {
      name: "Droneviz - OceanSky Technologies",
      short_name: "Droneviz",
      description: "Monitor and control software for OceanSky UAVs",
      theme_color: "#242424",
      id: "/",
      icons: [
        {
          src: "oceansky-logo.svg",
          sizes: "150x150",
          type: "image/svg",
        },
        {
          src: "oceansky-logo.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      screenshots: [
        // todo: add real screenshots
        {
          src: "oceansky-logo.png",
          sizes: "512x512",
          type: "image/png",
          form_factor: "wide",
        },
        {
          src: "oceansky-logo.png",
          sizes: "512x512",
          type: "image/png",
          form_factor: "narrow",
        },
      ],
    },

    workbox: {
      disableDevLogs: true, // enable to identify caching problems
      globPatterns: ["**/*"],
      maximumFileSizeToCacheInBytes: 200000000,
      navigateFallback: undefined,
      runtimeCaching: [
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
        {
          urlPattern: /^https:\/\/ibasemaps-api\.arcgis\.com\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "arcgis-cache",
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
          urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "openstreetmap-cache",
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
          urlPattern: /^https:\/\/tiles\.stadiamaps\.com\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "stadiamaps-cache",
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
          urlPattern: /^.*\/api\/geocoder.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "geocoder-cache",
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
  },
  // imports: {
  //   autoImport: false, // breaks nuxt
  // },
  typescript: {
    strict: true,
    // typeCheck: true, // breaks Nuxt
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
  },
  nitro: {
    sourceMap: process.env.NODE_ENV !== "production",
    esbuild: {
      options: {
        target: "esnext",
      },
    },
    publicAssets: [
      {
        //Nuxt will copy the files here and serve them publicly
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
