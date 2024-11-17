import {
  type MavLinkPacketRegistry,
  minimal,
  common,
  ardupilotmega,
  development,
} from "mavlink-mappings";

// create a registry of mappings between a message id and a data class
export const REGISTRY: MavLinkPacketRegistry = {
  ...minimal.REGISTRY,
  ...common.REGISTRY,
  ...development.REGISTRY,
  ...ardupilotmega.REGISTRY,
};
