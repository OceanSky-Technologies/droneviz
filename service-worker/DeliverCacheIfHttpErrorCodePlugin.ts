import { type WorkboxPlugin } from "workbox-core";
// Workbox will deliver the cached response even if the server returns an error.
// A 4xx or 5xx response from the network isn't consider a failure, so falling back to the cache won't happen automatically.
// https://github.com/GoogleChrome/workbox/issues/2084

export class DeliverCacheIfHttpErrorCodePlugin implements WorkboxPlugin {
  async fetchDidSucceed({
    response,
  }: {
    request: Request;
    response: Response;
  }) {
    // response.ok means there was a 2xx response code.
    if (response.ok) {
      return response;
    }

    // Throwing here should make it roughly equivalent to a network failure.
    throw new Error(`${response.status} ${response.statusText}`);
  }
}
