import { baseURL } from "@/baseURL.config";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { RemoveJsonpPlugin } from "./RemoveJsonpPlugin";

// Define caching strategies for each URL
// Strategies:
//  - CacheFirst,   // Cache first, fallback to network. Use this for assets that consume quota.
//  - NetworkFirst, // Network first, fallback to cache. Use this for assets that don't consume quota.
// More infos: https://iotforce.medium.com/workbox-improving-the-pwa-4a5f5bda8c9d
// Make sure to add these URLs also to the `dns-prefetch` and `preconnect` (crossorigin: anonymous) headers in nuxt.config.ts!
export const CACHE_CONFIG = [
  {
    url: "tile.googleapis.com",
    strategy: new CacheFirst({
      cacheName: "google-tiles",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      fetchOptions: {
        mode: "cors",
        credentials: "omit",
      },
    }),
  },
  {
    url: "assets.ion.cesium.com",
    strategy: new CacheFirst({
      cacheName: "cesium-ion",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      fetchOptions: {
        mode: "cors",
        credentials: "omit",
      },
    }),
  },
  {
    url: "api.cesium.com",
    strategy: new NetworkFirst({
      cacheName: "cesium-api",
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
    url: "dev.virtualearth.net", // Bing Maps
    strategy: new CacheFirst({
      cacheName: "virtualearth",
      matchOptions: {
        ignoreVary: true,
        ignoreSearch: true,
      },
      plugins: [
        new RemoveJsonpPlugin(),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
      fetchOptions: {
        mode: "cors",
        credentials: "omit",
      },
    }),
  },
  {
    urlPattern:
      /^(http|https):\/\/([a-zA-Z0-9.-]+\.)?tiles\.virtualearth\.net\/.*/i, // Bing Maps
    strategy: new CacheFirst({
      cacheName: "virtualearth-tiles",
      matchOptions: {
        ignoreVary: true,
      },
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      fetchOptions: {
        mode: "cors",
        credentials: "omit",
      },
    }),
  },
  {
    url: "ibasemaps-api.arcgis.com",
    strategy: new NetworkFirst({
      cacheName: "arcgis",
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
    url: "tile.openstreetmap.org",
    strategy: new NetworkFirst({
      cacheName: "openstreetmap",
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
    url: "tiles.stadiamaps.com",
    strategy: new NetworkFirst({
      cacheName: "stadiamaps",
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
