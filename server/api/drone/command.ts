import {
  CommandAck,
  CommandLong,
  MavResult,
} from "mavlink-mappings/dist/lib/common";
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

  const drone = drones[0];

  const command = Object.assign(new CommandLong(), query.command);

  try {
    await drone.sendAndExpectResponse(
      () => drone.send(command),
      (message) => {
        if (message instanceof CommandAck) {
          if (message.command === command.command) {
            if (message.result === MavResult.ACCEPTED) return true;
            if (message.result === MavResult.IN_PROGRESS) return true;
          }
        }
        return false;
      },
      (message) => {
        if (message instanceof CommandAck) {
          if (message.command === command.command) {
            if (
              message.result !== MavResult.ACCEPTED &&
              message.result !== MavResult.IN_PROGRESS
            ) {
              return [true, MavResult[message.result]];
            }
          }
        }
        return [false, undefined];
      },
    );
  } catch (e) {
    if (e instanceof Error) return { result: "error", message: e.message };
    else return { result: "error", message: JSON.stringify(e) };
  }

  return { result: "success" };
});
