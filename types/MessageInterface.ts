/**
 * Interface for Mavlink messages exchanged between the server and the client.
 */
export interface MavlinkMessageInterface {
  header: { msgid: number };
  protocol: unknown;
  signature: unknown;
  data: unknown; // The data structure is determined by the message ID
}
