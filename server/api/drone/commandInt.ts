import { CommandInt } from "mavlink-mappings/dist/lib/common";
import { drones } from "./DroneCollection";
import type { QueryResult } from "~/types/MessageInterface";

interface QueryInterface {
  data: CommandInt;
}

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query = await readBody<QueryInterface>(event);
  console.log("Received int command: ", JSON.stringify(query));

  if (drones.length !== 1) {
    return { success: false, message: `${drones.length} drones connected.` };
  }

  const drone = drones[0];

  const data = Object.assign(new CommandInt(), query.data);

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
