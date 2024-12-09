import { drones } from "./DroneCollection";
import { setHttpHeaders } from "~/server/utils/headers";
import {
  createEventStream,
  defineEventHandler,
  getQuery,
  setResponseStatus,
  setHeader,
} from "h3";

export default defineEventHandler(async (event): Promise<any> => {
  try {
    const query = getQuery(event);
    console.log("streaming request", query);

    setHttpHeaders(event, true, "text/event-stream");

    if (drones.length !== 1) {
      return { success: false, message: `${drones.length} drones connected.` };
    }

    const drone = drones[0];

    drone.eventStream = createEventStream(event);

    drone.eventStream.onClosed(() => {
      drone.disconnect();
    });

    return drone.eventStream.send();
  } catch (err) {
    console.error("Error creating event stream:", err);
    setResponseStatus(event, 500); // Internal Server Error
    setHeader(event, "Content-Type", "application/json");
    return { success: false, message: "Failed to create event stream." };
  }
});
