import type { QueryResult } from "@/types/MessageInterface";
import { drones } from "./DroneCollection";
import { setHttpHeaders } from "~/server/utils/headers";
import { Ping } from "mavlink-mappings/dist/lib/common";
import { defineEventHandler, readBody } from "h3";
import { fixBigIntSerialization } from "@/types/bigIntSerializationHelper";

fixBigIntSerialization();

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query: Ping = await readBody<Ping>(event);

  setHttpHeaders(event);

  if (drones.length !== 1) {
    return { success: false, message: `${drones.length} drones connected.` };
  }

  const drone = drones[0];

  const data = Object.assign(new Ping(), query);
  data.timeUsec = BigInt(query.timeUsec); // fix bigint serialization

  try {
    await drone.send(data);
  } catch (e) {
    if (e instanceof Error) return { success: false, message: e.message };
    else return { success: false, message: JSON.stringify(e) };
  }

  return { success: true, message: "Success" };
});
