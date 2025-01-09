/// <reference lib="WebWorker" />
/// <reference types="vite/client" />

import { NetworkFirst } from "workbox-strategies";
import { registerRoute } from "workbox-routing";
import { precacheAndRoute } from "workbox-precaching";
import { skipWaiting, clientsClaim } from "workbox-core";
import { RemoveJsonpPlugin } from "./RemoveJsonpPlugin";
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
  // Add the DeliverCacheIfHttpErrorCodePlugin plugin to the NetworkFirst strategy
  if (strategy instanceof NetworkFirst) {
    if (
      !strategy.plugins.some(
        (item) => item === DeliverCacheIfHttpErrorCodePlugin,
      )
    ) {
      strategy.plugins.push(new DeliverCacheIfHttpErrorCodePlugin());
    }
  }

  // Register route and silence 'no-response' logs
  registerRoute(
    ({ url: requestUrl }) => {
      if (url) {
        return urlMatchesHttpHttps(url, requestUrl);
      } else if (urlPattern) {
        return urlPattern.test(requestUrl.href);
      }
      return false; // Default case if neither `url` nor `urlPattern` is provided.
    },
    async (params) => {
      const { request, event } = params;
      try {
        // console.log(new Map(request.headers));

        // Attempt to fetch the response from the cache first (if the plugin applies)
        try {
          const cachedResponse = await new RemoveJsonpPlugin().getFromCache(
            request,
          );

          if (cachedResponse) {
            console.log("retruened", cachedResponse);
            console.log("original request", request);
            return cachedResponse; // Return the cached response if found
          }
        } catch (error) {}

        return await strategy.handle({ request, event });
      } catch (error) {
        console.debug("Fetch failed, returning fallback response:", error);
        return new Response("", { status: 500, statusText: "Fetch failed" });
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
