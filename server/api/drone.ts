import { Drone } from "~/server/droneInterface/Drone";
import {
  SerialOptions,
  TcpOptions,
  UdpOptions,
} from "~/types/DroneConnectionOptions";

const drones: Drone[] = [];

interface QueryInterface {
  connectionOptions: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery<QueryInterface>(event);
  console.log("Received connection request", query);

  if (typeof query.connectionOptions !== "string")
    throw new Error("Invalid connectionOption parameter");

  const parsedOptions = JSON.parse(query.connectionOptions);

  if (typeof parsedOptions.type !== "string")
    throw new Error("Invalid/unknown connectionOption.type");

  let drone;
  if (parsedOptions.type === "serial") {
    drone = new Drone(
      new SerialOptions(parsedOptions.path, parsedOptions.baudRate),
    );
  } else if (parsedOptions.type === "tcp") {
    drone = new Drone(new TcpOptions(parsedOptions.host, parsedOptions.port));
  } else if (parsedOptions.type === "udp") {
    drone = new Drone(Object.assign(new UdpOptions(), parsedOptions));
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
