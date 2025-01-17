export interface ProtocolInterface {
  compatibilityFlags: number;
  incompatibilityFlags: number;
  log: { context: string };
}

/**
 * Interface for Mavlink messages exchanged between the server and the client.
 */
export interface MavlinkMessageInterface {
  header: { msgid: number; sysid: number; compid: number };
  protocol: ProtocolInterface;
  signature: unknown;
  data: unknown; // The data structure is determined by the message ID
}

export interface QueryResult {
  success: boolean;
  message: string;
}
