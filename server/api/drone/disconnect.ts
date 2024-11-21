import { drones } from "./DroneCollection";

interface QueryInterface {
  connectionOptions: string;
}

export default defineEventHandler(async (event) => {
  const query = await readBody<QueryInterface>(event);
  console.log("Received disconnect request:", JSON.stringify(query));

  if (drones.length === 0) {
    return { result: "error", message: "No drone connected." };
  }

  try {
    await drones[0].disconnect();
  } catch (e) {
    if (e instanceof Error) return { result: "error", message: e.message };
    else return { result: "error", message: JSON.stringify(e) };
  }

  while (drones.length > 0) drones.pop();

  return { result: "success" };
});
