import { ManualControl } from "mavlink-mappings/dist/lib/common";
import { drones } from "./DroneCollection";

interface QueryInterface {
  data: ManualControl;
}

export default defineEventHandler(async (event) => {
  const query = await readBody<QueryInterface>(event);

  if (drones.length === 0) {
    return { result: "error", message: "No drone connected." };
  }

  const drone = drones[0];

  const data = Object.assign(new ManualControl(), query.data);

  try {
    await drone.send(data);
  } catch (e) {
    if (e instanceof Error) return { result: "error", message: e.message };
    else return { result: "error", message: JSON.stringify(e) };
  }

  return { result: "success" };
});
