import { CommandLong } from "mavlink-mappings/dist/lib/common";
import { drones } from "./DroneCollection";

interface QueryInterface {
  command: CommandLong;
}

export default defineEventHandler(async (event) => {
  const query = await readBody<QueryInterface>(event);
  console.log("Received command: ", JSON.stringify(query));

  if (drones.length === 0) {
    return { result: "error", message: "No drone connected." };
  }

  // Rehydrate the CommandLong instance
  const command = Object.assign(new CommandLong(), query.command);

  try {
    await drones[0].sendCommandLong(command);

    // TODO: wait for confirmation
  } catch (e) {
    if (e instanceof Error) return { result: "error", message: e.message };
    else return { result: "error", message: JSON.stringify(e) };
  }

  return { result: "success" };
});
