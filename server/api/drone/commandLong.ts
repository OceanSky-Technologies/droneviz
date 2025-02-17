import { CommandLong } from "mavlink-mappings/dist/lib/common";
import { drones } from "./DroneCollection";
import { setHttpHeaders } from "~/server/utils/headers";
import type { QueryResult } from "@/types/MessageInterface";
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query: CommandLong = await readBody<CommandLong>(event);
  console.log("Received long command: ", JSON.stringify(query));

  setHttpHeaders(event);

  if (drones.length !== 1) {
    return { success: false, message: `${drones.length} drones connected.` };
  }

  const drone = drones[0];

  const data = Object.assign(new CommandLong(), query);

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
