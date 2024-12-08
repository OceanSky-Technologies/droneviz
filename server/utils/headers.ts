export function setHttpHeaders(event) {
  // general
  setHeader(event, "cache-control", "no-cache");
  setHeader(event, "connection", "keep-alive");
  setHeader(event, "content-type", "text/event-stream");

  // CORS
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Headers", "*");
  setHeader(event, "Access-Control-Allow-Methods", "*");
  setHeader(event, "Access-Control-Allow-Credentials", "true");
  setHeader(event, "Access-Control-Expose-Headers", "*");
}
