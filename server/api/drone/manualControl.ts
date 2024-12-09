import { ManualControl } from "mavlink-mappings/dist/lib/common";
import { drones } from "./DroneCollection";
import { setHttpHeaders } from "~/server/utils/headers";
import type { QueryResult } from "@/types/MessageInterface";
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query: ManualControl = await readBody<ManualControl>(event);

  setHttpHeaders(event);

  if (drones.length !== 1) {
    return { success: false, message: `${drones.length} drones connected.` };
  }

  const drone = drones[0];

  const data = Object.assign(new ManualControl(), query);

  try {
    await drone.send(data);
  } catch (e) {
    if (e instanceof Error) return { success: false, message: e.message };
    else return { success: false, message: JSON.stringify(e) };
  }

  return { success: true, message: "Success" };
});
