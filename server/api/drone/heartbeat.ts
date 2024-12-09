import type { QueryResult } from "@/types/MessageInterface";
import { drones } from "./DroneCollection";
import { setHttpHeaders } from "~/server/utils/headers";
import { Heartbeat } from "mavlink-mappings/dist/lib/minimal";
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query: Heartbeat = await readBody<Heartbeat>(event);

  setHttpHeaders(event);

  if (drones.length !== 1) {
    return { success: false, message: `${drones.length} drones connected.` };
  }

  const drone = drones[0];

  const data = Object.assign(new Heartbeat(), query);

  try {
    await drone.send(data);
  } catch (e) {
    if (e instanceof Error) return { success: false, message: e.message };
    else return { success: false, message: JSON.stringify(e) };
  }

  return { success: true, message: "Success" };
});
