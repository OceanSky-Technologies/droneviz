import { ManualControl } from "mavlink-mappings/dist/lib/common";
import { drones } from "./DroneCollection";
import { setHttpHeaders } from "~/server/utils/headers";
import type { QueryResult } from "@/types/MessageInterface";

interface Query {
  data: ManualControl;
}

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query = await readBody<Query>(event);

  setHttpHeaders(event);

  if (drones.length !== 1) {
    return { success: false, message: `${drones.length} drones connected.` };
  }

  const drone = drones[0];

  const data = Object.assign(new ManualControl(), query.data);

  try {
    await drone.send(data);
  } catch (e) {
    if (e instanceof Error) return { success: false, message: e.message };
    else return { success: false, message: JSON.stringify(e) };
  }

  return { success: true, message: "Success" };
});
