import type { QueryResult } from "@/types/MessageInterface";
import { drones } from "./DroneCollection";
import { setHttpHeaders } from "~/server/utils/headers";
import { Ping } from "mavlink-mappings/dist/lib/common";

interface QueryInterface {
  data: Ping;
}

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query = await readBody<QueryInterface>(event);

  setHttpHeaders(event);

  if (drones.length !== 1) {
    return { success: false, message: `${drones.length} drones connected.` };
  }

  const drone = drones[0];

  const data = Object.assign(new Ping(), query.data);

  try {
    await drone.send(data);
  } catch (e) {
    console.log(e);
    if (e instanceof Error) return { success: false, message: e.message };
    else return { success: false, message: JSON.stringify(e) };
  }

  return { success: true, message: "Success" };
});
