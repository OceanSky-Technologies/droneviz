import { type WorkboxPlugin } from "workbox-core";

export class RemoveJsonpPlugin implements WorkboxPlugin {
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
