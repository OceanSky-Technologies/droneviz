import type { QueryResult } from "~/types/MessageInterface";
import { drones } from "./DroneCollection";

interface QueryInterface {
  connectionOptions: string;
}

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query = await readBody<QueryInterface>(event);
  console.log("Received disconnect request:", JSON.stringify(query));

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
