import type { QueryResult } from "@/types/MessageInterface";
import { drones } from "./DroneCollection";
import { Heartbeat } from "mavlink-mappings/dist/lib/minimal";

interface Query {
  data: Heartbeat;
}

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query = await readBody<Query>(event);

  if (drones.length !== 1) {
    return { success: false, message: `${drones.length} drones connected.` };
  }

  const drone = drones[0];

  const data = Object.assign(new Heartbeat(), query.data);

  try {
    await drone.send(data);
  } catch (e) {
    if (e instanceof Error) return { success: false, message: e.message };
    else return { success: false, message: JSON.stringify(e) };
  }

  return { success: true, message: "Success" };
});
