import { drones } from "./DroneCollection";

interface QueryInterface {
  connectionOptions: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery<QueryInterface>(event);
  console.log("Received disconnect request", query);

  if (drones.length === 0) {
    return { result: "error", message: "No drone connected." };
  }

  try {
    await drones[0].disconnect();
  } catch (e) {
    if (e instanceof Error) return { result: "error", message: e.message };
    else return { result: "error", message: JSON.stringify(e) };
  }

  drones.pop();

  return { result: "success" };
});
