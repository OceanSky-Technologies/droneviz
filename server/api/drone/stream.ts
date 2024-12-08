import { drones } from "./DroneCollection";
import { setHttpHeaders } from "~/server/utils/headers";
import { createEventStream } from "h3";

interface QueryInterface {}

export default defineEventHandler(async (event): Promise<any> => {
  try {
    const query = getQuery<QueryInterface>(event);
    console.log("streaming request", query);

    setHttpHeaders(event);

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
