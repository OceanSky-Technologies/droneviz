import {
  Attitude,
  Altitude,
  AutotuneAxis,
  CommandAck,
  CommandLong,
  DoRepositionCommand,
  GlobalPositionInt,
  ManualControl,
  MavCmd,
  MavDoRepositionFlags,
  MavResult,
  Ping,
  PrecisionLandMode,
} from "mavlink-mappings/dist/lib/common";

// Interface to store a message and its reception timestamp
export interface StoredMessage<T> {
  message: T; // The message instance
  timestamp: number; // Reception unix timestamp in milliseconds
}

export class MessageMap extends Map<string, StoredMessage<any>> {
  /**
   * Get the last message for the given class.
   * @param {new () => T} messageClass - The class of the message.
   * @returns {StoredMessage<T> | undefined} - The last message for the given class.
   */
  getLastMessage<T>(messageClass: new () => T): StoredMessage<T> | undefined {
    // Retrieve the last message for the given class
    const messageType = messageClass.name;
    return this.get(messageType) as StoredMessage<T> | undefined;
  }

  get altitude(): StoredMessage<Altitude> | undefined {
    return this.getLastMessage(Altitude);
  }

  get globalPositionInt(): StoredMessage<GlobalPositionInt> | undefined {
    return this.getLastMessage(GlobalPositionInt);
  }
}
