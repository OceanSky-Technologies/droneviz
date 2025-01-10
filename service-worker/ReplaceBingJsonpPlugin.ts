import type { WorkboxPlugin } from "workbox-core";

// This plugin enables caching Bing tiles. Use this plugin in combination with the CacheFirst plugin.
//
// Background: Bing Maps uses a session-dependent JSONP parameter in the request URL and in the server responses that need to match.
// This plugin applies a workaround for offline caching by these steps:
// 1. When a new request is intercepted the strategy tells this plugin that a particular cache key will be used - meaning it informs is that it wants to query the cache for a given request.
//    This plugin then stores the original JSONP value and stores a modified request in the cache where the JSONP parameter is replaced with a stable value.
//    Due to the JSONP value now being stable, all requests with different JSONP parameters will be cached under the same key.
//    This creates cache hits for all requests with different JSONP parameters.
// 2. When a cached response is about to be used (cache hit), the plugin replaces the JSONP value in the response payload by the JSONP value from the original request that was saved before.
//    This way the response is modified such that it matches the original request.
export class ReplaceBingJsonpPlugin implements WorkboxPlugin {
  // The JSONP value from the original request.
  originalJsonp: string | undefined;

  // Intercept the request before querying the cache and store the JSONP value.
  // Also modify the request to use a stable JSONP value so all requests with different JSONP values are cached under the same key.
  async cacheKeyWillBeUsed({ request }: { request: Request }) {
    const url = new URL(request.url);

    // Keep track of the real callback (if needed):
    const realJsonp = url.searchParams.get("jsonp");
    if (realJsonp) {
      this.originalJsonp = realJsonp;
    }

    // Force a stable value for caching:
    url.searchParams.set("jsonp", "deleted");

    // Return a new Request using the "normalized" URL
    return new Request(url.toString(), {
      // Copy over method, headers, body if needed
      method: request.method,
      headers: request.headers,
    });
  }

  // When a cached response is about to be used, replace the JSONP value in the response payload by the JSONP value from the original request.
  async cachedResponseWillBeUsed({
    cachedResponse,
    request,
  }: {
    cachedResponse?: Response;
    request: Request;
  }): Promise<Response | undefined> {
    if (!cachedResponse || this.originalJsonp === undefined) {
      return undefined;
    }

    const url = new URL(request.url);

    // Figure out if the current request has a "jsonp" parameter. As the cacheKey was modified before this will always be "deleted".
    // Just double check that the parameter exists because we don't want to modify the response if it doesn't. (This shouldn't happen anyways).
    const currentJsonpParam = url.searchParams.get("jsonp");
    if (!currentJsonpParam) {
      return cachedResponse;
    }

    // 1. Read the cached response text.
    const clonedResponse = cachedResponse.clone();
    const responseText = await clonedResponse.text();

    // 2. Look for the jsonp value in the response body.
    //    e.g. the first line might look like "loadJsonp692886({ ... })"
    const callbackRegex = /^(loadJsonp\d+)/;
    const match = responseText.match(callbackRegex);

    if (!match) {
      // No jsonp value found, so just return the cached response as-is.
      return cachedResponse;
    }

    // 3. Replace the old jsonp value with the currently used JSONP param.
    const cachedCallback = match[1]; // e.g., "loadJsonp692886"
    const restoredResponseText = responseText.replace(
      cachedCallback,
      this.originalJsonp,
    );

    // 4. Return a new Response with the updated text.
    return new Response(restoredResponseText, {
      status: clonedResponse.status,
      statusText: clonedResponse.statusText,
      headers: clonedResponse.headers,
    });
  }
}
