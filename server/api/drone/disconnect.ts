import type { QueryResult } from "@/types/MessageInterface";
import { drones } from "./DroneCollection";
import { setHttpHeaders } from "~/server/utils/headers";
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query: string = await readBody<string>(event);
  console.log("Received disconnect request:", JSON.stringify(query));

  setHttpHeaders(event);

  if (drones.length === 0) {
    return { success: false, message: "Drone not connected." };
  }

  try {
    await drones[0].disconnect();
  } catch (e) {
    if (e instanceof Error) return { success: false, message: e.message };
    else return { success: false, message: JSON.stringify(e) };
  }

  while (drones.length > 0) drones.pop();

  return { success: true, message: "Success" };
});
