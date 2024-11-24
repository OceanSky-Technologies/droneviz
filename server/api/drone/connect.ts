import { DroneInterface } from "~/server/api/drone/DroneInterface";
import {
  SerialOptions,
  TcpOptions,
  UdpOptions,
} from "~/types/DroneConnectionOptions";
import { drones } from "./DroneCollection";
import type { QueryResult } from "~/types/MessageInterface";

interface QueryInterface {
  connectionOptions: string;
  signatureKey: string;
}

export default defineEventHandler(async (event): Promise<QueryResult> => {
  const query = await readBody<QueryInterface>(event);
  console.log("Received connection request:", JSON.stringify(query));

  if (drones.length !== 0) {
    return { success: false, message: "A drone is already connected." };
  }

  const parsedOptions = JSON.parse(query.connectionOptions);

  let drone;
  if (parsedOptions.type === "serial") {
    drone = new DroneInterface(
      new SerialOptions(parsedOptions.path, parsedOptions.baudRate),
      query.signatureKey,
    );
  } else if (parsedOptions.type === "tcp") {
    drone = new DroneInterface(
      new TcpOptions(parsedOptions.host, parsedOptions.port),
      query.signatureKey,
    );
  } else if (parsedOptions.type === "udp") {
    drone = new DroneInterface(
      Object.assign(new UdpOptions(), parsedOptions),
      query.signatureKey,
    );
  } else {
    throw new Error("Invalid connection option");
  }

  try {
    await drone.connect();
  } catch (e) {
    if (e instanceof Error) return { success: false, message: e.message };
    else return { success: false, message: JSON.stringify(e) };
  }

  drones.push(drone);

  return { success: true, message: "Success" };
});
