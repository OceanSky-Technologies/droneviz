import { drones } from "./DroneCollection";

export default defineEventHandler(async (event) => {
  const query = getQuery<QueryInterface>(event);
  console.log("streaming request", query);

  if (drones.length === 0) {
    return { result: "error", message: "No drone connected." };
  }

  setHeader(event, "cache-control", "no-cache");
  setHeader(event, "connection", "keep-alive");
  setHeader(event, "content-type", "text/event-stream");
  setResponseStatus(event, 200);

  const drone = drones[0];

  drone.eventStream = createEventStream(event);

  drone.eventStream.onClosed(() => {
    drone.disconnect();
  });

  return drone.eventStream.send();
});
