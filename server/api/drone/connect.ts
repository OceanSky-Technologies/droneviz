import { DroneInterface } from "~/server/api/drone/DroneInterface";
import {
  SerialOptions,
  TcpOptions,
  UdpOptions,
} from "~/types/DroneConnectionOptions";
import { drones } from "./DroneCollection";

interface QueryInterface {
  connectionOptions: string;
  signatureKey: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery<QueryInterface>(event);
  console.log("Received connection request", query);

  if (drones.length > 0) {
    return { result: "error", message: "Already connected to a drone" };
  }

  if (typeof query.connectionOptions !== "string")
    throw new Error("Invalid connectionOption parameter");

  const parsedOptions = JSON.parse(query.connectionOptions);

  if (typeof parsedOptions.type !== "string")
    throw new Error("Invalid/unknown connectionOption.type");

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
    if (e instanceof Error) return { result: "error", message: e.message };
    else return { result: "error", message: JSON.stringify(e) };
  }

  drones.push(drone);

  return { result: "success" };
});
