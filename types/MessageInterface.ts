export interface ProtocolInterface {
  compatibilityFlags: number;
  compid: number;
  incompatibilityFlags: number;
  log: { context: string };
  sysid: number;
}

/**
 * Interface for Mavlink messages exchanged between the server and the client.
 */
export interface MavlinkMessageInterface {
  header: { msgid: number };
  protocol: ProtocolInterface;
  signature: unknown;
  data: unknown; // The data structure is determined by the message ID
}

export interface QueryResult {
  success: boolean;
  message: string;
}
