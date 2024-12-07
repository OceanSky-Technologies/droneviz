import {
  Attitude,
  Altitude,
  CommandAck,
  GlobalPositionInt,
  AttitudeQuaternion,
  PositionTargetLocalNed,
  ServoOutputRaw,
  AttitudeTarget,
  LocalPositionNed,
  GpsRawInt,
  OpenDroneIdSystem,
  ScaledPressure,
  SysStatus,
  VfrHud,
  ExtendedSysState,
  OpenDroneIdLocation,
} from "mavlink-mappings/dist/lib/common";
import { Heartbeat } from "mavlink-mappings/dist/lib/minimal";
import type { Reactive } from "vue";

// Interface to store a message and its reception timestamp
export class StoredMessage<T extends object> {
  public message: Reactive<T>; // The message instance
  public timestamp: number; // Reception unix timestamp in milliseconds

  constructor(message: T, timestamp: number) {
    this.message = reactive(message);
    this.timestamp = timestamp;
  }
}

export class MessageMap extends Map<string, StoredMessage<any>> {
  /**
   * Get the last message for the given class.
   * @param {new () => T} messageClass - The class of the message.
   * @returns {StoredMessage<T> | undefined} - The last message for the given class.
   */
  getLastMessage<T extends object>(
    messageClass: new () => T,
  ): StoredMessage<T> | undefined {
    // Retrieve the last message for the given class
    const messageType = messageClass.name;
    return this.get(messageType) as StoredMessage<T> | undefined;
  }

  get altitude(): StoredMessage<Altitude> | undefined {
    return this.getLastMessage(Altitude);
  }

  get attitude(): StoredMessage<Attitude> | undefined {
    return this.getLastMessage(Attitude);
  }

  get attitudeTarget(): StoredMessage<AttitudeTarget> | undefined {
    return this.getLastMessage(AttitudeTarget);
  }

  get attitudeQuaternion(): StoredMessage<AttitudeQuaternion> | undefined {
    return this.getLastMessage(AttitudeQuaternion);
  }

  get globalPositionInt(): StoredMessage<GlobalPositionInt> | undefined {
    return this.getLastMessage(GlobalPositionInt);
  }

  get servoOutputRaw(): StoredMessage<ServoOutputRaw> | undefined {
    return this.getLastMessage(ServoOutputRaw);
  }

  get commandAck(): StoredMessage<CommandAck> | undefined {
    return this.getLastMessage(CommandAck);
  }

  get positionTargetLocalNed():
    | StoredMessage<PositionTargetLocalNed>
    | undefined {
    return this.getLastMessage(PositionTargetLocalNed);
  }

  get localPositionNed(): StoredMessage<LocalPositionNed> | undefined {
    return this.getLastMessage(LocalPositionNed);
  }

  get heartbeat(): StoredMessage<Heartbeat> | undefined {
    return this.getLastMessage(Heartbeat);
  }

  get sysStatus(): StoredMessage<SysStatus> | undefined {
    return this.getLastMessage(SysStatus);
  }

  get extendedSysState(): StoredMessage<ExtendedSysState> | undefined {
    return this.getLastMessage(ExtendedSysState);
  }

  get gpsRawInt(): StoredMessage<GpsRawInt> | undefined {
    return this.getLastMessage(GpsRawInt);
  }

  get openDroneIdLocation(): StoredMessage<OpenDroneIdLocation> | undefined {
    return this.getLastMessage(OpenDroneIdLocation);
  }

  get openDroneIdSystem(): StoredMessage<OpenDroneIdSystem> | undefined {
    return this.getLastMessage(OpenDroneIdSystem);
  }

  get scaledPressure(): StoredMessage<ScaledPressure> | undefined {
    return this.getLastMessage(ScaledPressure);
  }

  get vfrHud(): StoredMessage<VfrHud> | undefined {
    return this.getLastMessage(VfrHud);
  }
}
