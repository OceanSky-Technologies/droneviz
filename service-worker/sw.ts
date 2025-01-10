/// <reference lib="WebWorker" />
/// <reference types="vite/client" />

import { NetworkFirst } from "workbox-strategies";
import { registerRoute } from "workbox-routing";
import { precacheAndRoute } from "workbox-precaching";
import { skipWaiting, clientsClaim } from "workbox-core";
import { DeliverCacheIfHttpErrorCodePlugin } from "./DeliverCacheIfHttpErrorCodePlugin";
import { CACHE_CONFIG } from "./CacheConfig";
import { urlMatchesHttpHttps } from "./Utils";

declare var self: ServiceWorkerGlobalScope;

(self as any).__WB_DISABLE_DEV_LOGS = true;

skipWaiting();
clientsClaim();

// Precaching will automatically inject the files defined in `globPatterns`.
precacheAndRoute(self.__WB_MANIFEST);

// Register routes for each config
CACHE_CONFIG.forEach(({ url, urlPattern, strategy }) => {
  // For NetworkFirst strategy add the DeliverCacheIfHttpErrorCodePlugin plugin automatically
  if (
    strategy instanceof NetworkFirst &&
    !strategy.plugins.some((item) => item === DeliverCacheIfHttpErrorCodePlugin)
  ) {
    strategy.plugins.push(new DeliverCacheIfHttpErrorCodePlugin());
  }

  // Register route and silence 'no-response' logs
  registerRoute(
    ({ url: requestUrl }) => {
      try {
        // Check if the request URL matches the provided `url` or `urlPattern`
        if (url) {
          return urlMatchesHttpHttps(url, requestUrl);
        } else if (urlPattern) {
          return urlPattern.test(requestUrl.href);
        }
      } catch (error) {}

      return false; // Default case if neither `url` nor `urlPattern` is provided.
    },
    async (params) => {
      const { request, event } = params;
      try {
        return await strategy.handle({ request, event });
      } catch (error) {
        console.debug("Fetch failed, returning fallback response:", error);
        return new Response("", {
          status: 500,
          statusText: "Fetch failed from service worker",
        });
      }
    },
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
