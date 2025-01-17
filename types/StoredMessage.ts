import { reactive, type UnwrapRef } from "vue";

/**
 * A class that holds a MAVLink message plus a reception timestamp.
 * The message is made reactive so that its fields can be tracked by Vue reactivity.
 */
export class StoredMessage<T extends object> {
  /** The MAVLink message, wrapped in reactive() for Vue tracking. */
  public message: UnwrapRef<T>;

  /** Unix timestamp in milliseconds when the message was received. */
  public timestamp: number;

  /**
   * Constructs a new StoredMessage instance.
   *
   * @param message   The raw MAVLink message object
   * @param timestamp The reception time (milliseconds)
   */
  constructor(message: T, timestamp: number) {
    this.message = reactive(message) as UnwrapRef<T>;
    this.timestamp = timestamp;
  }
}
