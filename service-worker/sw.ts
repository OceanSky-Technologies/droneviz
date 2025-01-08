/// <reference lib="WebWorker" />
/// <reference types="vite/client" />

import { baseURL } from "@/baseURL.config";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { registerRoute } from "workbox-routing";
import { precacheAndRoute } from "workbox-precaching";
import { skipWaiting, clientsClaim, type WorkboxPlugin } from "workbox-core";

declare var self: ServiceWorkerGlobalScope;

(self as any).__WB_DISABLE_DEV_LOGS = true;

skipWaiting();
clientsClaim();

// Precaching will automatically inject the files defined in `globPatterns`.
precacheAndRoute(self.__WB_MANIFEST);

class RemoveJsonpPlugin implements WorkboxPlugin {
  // works
  async cacheWillUpdate({
    request,
    response,
  }: {
    request: Request;
    response: Response;
    event?: ExtendableEvent;
  }): Promise<Response | null> {
    const requestUrl = new URL(request.url);

    console.log("cacheWillUpdate");

    if (
      requestUrl.hostname !== "dev.virtualearth.net" ||
      !requestUrl.pathname.includes("/REST/v1/Imagery/Metadata/Aerial")
    )
      return response;

    if (!response || !response.ok) {
      return null; // Don't cache non-OK responses
    }

    console.log("original response", response);

    // Clone the response to ensure we don't modify the original
    const clonedResponse = response.clone();

    // Modify the request URL by setting the 'jsonp=deleted' parameter
    requestUrl.searchParams.set("jsonp", "deleted");

    // Store the cloned response in the cache with the modified URL
    const cache = await caches.open("virtualearth"); // Open a cache storage (adjust name as necessary)
    await cache.put(requestUrl.toString(), clonedResponse);

    console.log(`Stored response in cache with URL: ${requestUrl.toString()}`);

    return clonedResponse;
  }

  async getFromCache(request: Request): Promise<Response | undefined> {
    const originalUrl = new URL(request.url);
    console.log("now", request, originalUrl);

    // Check if the URL matches the target criteria
    if (
      originalUrl.hostname !== "dev.virtualearth.net" ||
      !originalUrl.pathname.includes("/REST/v1/Imagery/Metadata/Aerial")
    ) {
      return undefined;
    }

    try {
      const originalJsonp = originalUrl.searchParams.get("jsonp");
      if (!originalJsonp) {
        return undefined;
      }

      // Create a modified URL with jsonp set to "deleted"
      const modifiedUrl = new URL(originalUrl.toString());
      modifiedUrl.searchParams.set("jsonp", "deleted");

      // Open the cache and look for the modified URL
      const cache = await caches.open("virtualearth");
      const cachedResponse = await cache.match(modifiedUrl.toString());

      if (cachedResponse) {
        // Clone the cached response
        const clonedResponse = cachedResponse.clone();
        const responseText = await clonedResponse.text();

        // Extract and replace the callback function name
        const callbackRegex = /^(loadJsonp\d+)/; // Matches loadJsonp followed by digits
        const match = responseText.match(callbackRegex);

        if (match) {
          const cachedCallback = match[1]; // e.g., "loadJsonp210343"
          console.log(
            `Replacing cached callback "${cachedCallback}" with "${originalJsonp}"`,
          );

          // Replace the callback function name in the response body
          const restoredResponseText = responseText.replace(
            cachedCallback,
            originalJsonp,
          );

          // Create a new response with the restored body and headers
          const modifiedResponse = new Response(restoredResponseText, {
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            headers: clonedResponse.headers,
          });

          // Set the original URL (optional)
          Object.defineProperty(modifiedResponse, "url", {
            value: originalUrl.toString(),
          });

          return modifiedResponse;
        } else {
          console.warn("No callback function found in cached response");
          return undefined;
        }
      }

      // Return undefined if no cached response was found
      return undefined;
    } catch (error) {
      console.error("Error in getFromCache:", error);
      return undefined;
    }
  }
}

// Define caching strategies for each URL
// Strategies:
//  - CacheFirst,   // Cache first, fallback to network. Use this for assets that consume quota.
//  - NetworkFirst, // Network first, fallback to cache. Use this for assets that don't consume quota.
// More infos: https://iotforce.medium.com/workbox-improving-the-pwa-4a5f5bda8c9d
// Make sure to add these URLs also to the `dns-prefetch` and `preconnect` (crossorigin: anonymous) headers in nuxt.config.ts!
const CACHE_CONFIG = [
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
    if (response.ok) {
      return response;
    }

    // Throwing here should make it roughly equivalent to a network failure.
    throw new Error(`${response.status} ${response.statusText}`);
  },
};

// checks if two urls match independently of http:// or https:// (meaning they match even if the protocol differs)
function urlMatchesHttpHttps(url: string, requestUrl: URL) {
  // Normalize URLs by manually removing the protocol
  let normalizedUrl: string;
  if (url.startsWith("http://")) {
    normalizedUrl = url.slice(7); // Remove "http://"
  } else if (url.startsWith("https://")) {
    normalizedUrl = url.slice(8); // Remove "https://"
  } else {
    normalizedUrl = url;
  }

  let requestUrlWithoutProtocol: string;
  if (requestUrl.href.startsWith("http://")) {
    requestUrlWithoutProtocol = requestUrl.href.slice(7); // Remove "http://"
  } else if (requestUrl.href.startsWith("https://")) {
    requestUrlWithoutProtocol = requestUrl.href.slice(8); // Remove "https://"
  } else {
    requestUrlWithoutProtocol = requestUrl.href;
  }

  // Check if the request URL starts with the normalized URL
  return requestUrlWithoutProtocol.startsWith(normalizedUrl);
}

// Register routes for each config
CACHE_CONFIG.forEach(({ url, urlPattern, strategy }) => {
  // Add the DeliverCacheIfHttpErrorCodePlugin plugin to the NetworkFirst strategy
  if (strategy instanceof NetworkFirst) {
    if (
      !strategy.plugins.some(
        (item) => item === DeliverCacheIfHttpErrorCodePlugin,
      )
    ) {
      strategy.plugins.push(DeliverCacheIfHttpErrorCodePlugin);
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
