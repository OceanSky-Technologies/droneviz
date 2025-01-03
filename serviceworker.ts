import { baseURL } from "@/baseURL.config";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
// import "workbox-sw";

declare var self: ServiceWorkerGlobalScope;

self.__WB_DISABLE_DEV_LOGS = true;

// workbox.setConfig({
//   debug: false, // Disable all debug logging
// });

// Precaching will automatically inject the files defined in `globPatterns`.
precacheAndRoute(self.__WB_MANIFEST);

// Workbox will deliver the cached response even if the server returns an error.
// A 4xx or 5xx response from the network isn't consider a failure, so falling back to the cache won't happen automatically.
// https://github.com/GoogleChrome/workbox/issues/2084
const DeliverCacheIfHttpErrorCodePlugin = {
  fetchDidSucceed: async ({
    response,
  }: {
    request: Request;
    response: Response;
  }) => {
    // response.ok means there was a 2xx response code.
    if (response.ok || response.type === "opaque") {
      return response;
    }

    // Throwing here should make it roughly equivalent to a network failure.
    throw new Error(`${response.status} ${response.statusText}`);
  },
};

// Define caching strategies for each URL
// Strategies:
//  - CacheFirst,   // Cache first, fallback to network. Use this for assets that consume quota.
//  - NetworkFirst, // Network first, fallback to cache. Use this for assets that don't consume quota. Also add the DeliverCacheIfHttpErrorCodePlugin plugin in this case!
// More infos: https://iotforce.medium.com/workbox-improving-the-pwa-4a5f5bda8c9d
// Make sure to add these URLs also to the `dns-prefetch` and `preconnect` (crossorigin: anonymous) headers in nuxt.config.ts!
const CACHE_CONFIG = [
  {
    url: "https://tile.googleapis.com",
    strategy: new CacheFirst({
      cacheName: "google-tiles",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      fetchOptions: {
        mode: "cors",
      },
    }),
  },
  {
    url: "https://assets.ion.cesium.com",
    strategy: new CacheFirst({
      cacheName: "cesium-ion",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      fetchOptions: {
        mode: "cors",
      },
    }),
  },
  {
    url: "https://api.cesium.com",
    strategy: new NetworkFirst({
      cacheName: "cesium-api",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        DeliverCacheIfHttpErrorCodePlugin,
      ],
      fetchOptions: {
        mode: "cors",
      },
    }),
  },
  {
    url: "https://dev.virtualearth.net", // Bing Maps
    strategy: new CacheFirst({
      cacheName: "virtualearth",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      fetchOptions: {
        mode: "cors",
      },
    }),
  },
  {
    url: "https://ibasemaps-api.arcgis.com",
    strategy: new NetworkFirst({
      cacheName: "arcgis",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        DeliverCacheIfHttpErrorCodePlugin,
      ],
      fetchOptions: {
        mode: "cors",
      },
    }),
  },
  {
    url: "https://tile.openstreetmap.org",
    strategy: new NetworkFirst({
      cacheName: "openstreetmap",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        DeliverCacheIfHttpErrorCodePlugin,
      ],
      fetchOptions: {
        mode: "cors",
      },
    }),
  },
  {
    url: "https://tiles.stadiamaps.com",
    strategy: new NetworkFirst({
      cacheName: "stadiamaps",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        DeliverCacheIfHttpErrorCodePlugin,
      ],
      fetchOptions: {
        mode: "cors",
      },
    }),
  },
  {
    url: baseURL + "/api/geocoder",
    strategy: new CacheFirst({
      cacheName: "geocoder",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      fetchOptions: {
        mode: "cors",
      },
    }),
  },
];

// Register routes for each config
CACHE_CONFIG.forEach(({ url, strategy }) => {
  registerRoute(
    ({ url: requestUrl }) => requestUrl.href.startsWith(url),
    strategy,
  );
});

self.addEventListener("install", () => {
  console.log("[Service Worker] Installed");
  // Activate the new service worker immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  // Claim control of all clients
  event.waitUntil(self.clients.claim());
});
