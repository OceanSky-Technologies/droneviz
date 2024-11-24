import { drones } from "./DroneCollection";

interface QueryInterface {}

export default defineEventHandler(async (event) => {
  const query = getQuery<QueryInterface>(event);
  console.log("streaming request", query);

  if (drones.length !== 1) {
    return { success: false, message: `${drones.length} drones connected.` };
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
