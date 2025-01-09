// checks if two urls match independently of http:// or https:// (meaning they match even if the protocol differs)
export function urlMatchesHttpHttps(url: string, requestUrl: URL) {
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
