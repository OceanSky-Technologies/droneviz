import { setHeader, H3Event, type EventHandlerRequest } from "h3";

export function setHttpHeaders(
  event: H3Event<EventHandlerRequest>,
  keepAlive: boolean = false,
  contentType?: string,
) {
  // general
  setHeader(event, "cache-control", "no-cache");

  if (keepAlive) setHeader(event, "connection", "keep-alive");

  if (process.env.TAURI) {
    setHeader(event, "content-type", "text/event-stream");
  } else if (contentType) {
    setHeader(event, "content-type", contentType);
  }

  // CORS
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(event, "Access-Control-Allow-Headers", "*");
  setHeader(event, "Access-Control-Allow-Methods", "*");
  setHeader(event, "Access-Control-Allow-Credentials", "true");
  setHeader(event, "Access-Control-Expose-Headers", "*");
}
