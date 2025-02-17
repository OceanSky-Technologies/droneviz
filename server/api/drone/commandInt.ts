import { CommandInt } from "mavlink-mappings/dist/lib/common";
import { setHttpHeaders } from "~/server/utils/headers";
import type { QueryResult } from "@/types/MessageInterface";
import { defineEventHandler, readBody } from "h3";
import { drones } from "./DroneCollection";

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query: CommandInt = await readBody<CommandInt>(event);
  console.log("Received int command: ", JSON.stringify(query));

  setHttpHeaders(event);

  if (drones.length !== 1) {
    return { success: false, message: `${drones.length} drones connected.` };
  }

  const drone = drones[0];

  const data = Object.assign(new CommandInt(), query);

  // Convert all `null` values to `NaN`
  for (const key in data) {
    if ((data as any)[key] === null) {
      (data as any)[key] = NaN;
    }
  }

  try {
    await drone.send(data);
  } catch (e) {
    if (e instanceof Error) return { success: false, message: e.message };
    else return { success: false, message: JSON.stringify(e) };
  }

  return { success: true, message: "Success" };
});
