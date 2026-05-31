import {
  type MavLinkPacketRegistry,
  minimal,
  standard,
  common,
  ardupilotmega,
  development,
} from "mavlink-mappings";

// create a registry of mappings between a message id and a data class
export const REGISTRY: MavLinkPacketRegistry = {
  ...minimal.REGISTRY,
  ...standard.REGISTRY, // GlobalPositionInt (msgid 33) moved here in mavlink-mappings 1.0.22
  ...common.REGISTRY,
  ...development.REGISTRY,
  ...ardupilotmega.REGISTRY,
};
