import type { Socket } from "net";
import { connect } from "net";
import {
  MavEsp8266,
  MavLinkPacketParser,
  MavLinkPacketSplitter,
  MavLinkPacketSignature,
} from "node-mavlink";
import { SerialPort } from "serialport";
import type { EventStream } from "h3";
import {
  SerialOptions,
  TcpOptions,
  UdpOptions,
} from "~/types/DroneConnectionOptions";
import { REGISTRY } from "~/types/MavlinkRegistry";
import type { MavlinkMessageInterface } from "~/types/MessageInterface";

// fix BigInt serialization: https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-953187833
declare global {
  interface BigInt {
    toJSON: () => string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};
// fix BigInt serialization end

export class DroneInterface {
  private connectionOption: SerialOptions | TcpOptions | UdpOptions;

  private serialPort?: SerialPort;
  private port: MavEsp8266 | Socket | MavLinkPacketParser | undefined;
  private signatureKey?: Buffer;

  eventStream?: EventStream;

  constructor(
    connectionOption: SerialOptions | TcpOptions | UdpOptions,
    signatureKey?: string,
  ) {
    this.connectionOption = connectionOption;

    if (signatureKey) {
      this.signatureKey = MavLinkPacketSignature.key(signatureKey);
    }
  }

  async connect() {
    try {
      if (this.connectionOption instanceof SerialOptions) {
        await this.connectSerial();
      } else if (this.connectionOption instanceof TcpOptions) {
        await this.connectTcp();
      } else if (this.connectionOption instanceof UdpOptions) {
        await this.connectUdp();
      } else {
        throw new Error(
          "Invalid connection option: " + JSON.stringify(this.connectionOption),
        );
      }
    } catch (err) {
      throw new Error(`Failed to establish connection: ${err}`);
    }
  }

  async disconnect() {
    try {
      if (this.connectionOption instanceof SerialOptions) {
        (this.port as MavLinkPacketParser)?.removeAllListeners();
        (this.port as MavLinkPacketParser)?.destroy();
        (this.port as MavLinkPacketParser)?.unpipe();
        this.port = undefined;

        this.serialPort?.close();
        this.serialPort = undefined;
      } else if (this.connectionOption instanceof TcpOptions) {
        (this.port as Socket)?.removeAllListeners();
        (this.port as Socket)?.resetAndDestroy();
        this.port = undefined;
      } else if (this.connectionOption instanceof UdpOptions) {
        (this.port as MavEsp8266)?.removeAllListeners();
        await (this.port as MavEsp8266)?.close();
        this.port = undefined;
      } else {
        throw new Error(
          "Invalid connection option: " + JSON.stringify(this.connectionOption),
        );
      }
    } catch (err) {
      throw new Error(`Failed to close connection: ${err}`);
    }
  }

  private async connectSerial() {
    this.serialPort = new SerialPort({
      path: (this.connectionOption as SerialOptions).path,
      baudRate: (this.connectionOption as SerialOptions).baudRate,
    });

    // constructing a reader that will emit each packet separately
    this.port = this.serialPort
      .pipe(new MavLinkPacketSplitter())
      .pipe(new MavLinkPacketParser());

    this.port.on("data", (packet) => {
      this.onData(packet);
    });

    // TODO this hasn't been tested yet
    await new Promise<void>((resolve, reject) => {
      (this.port as MavLinkPacketParser).on("connect", () => {
        resolve();
      });

      (this.port as MavLinkPacketParser).on("error", (err) => {
        reject(new Error(`Connection failed: ${err.message}`));
      });

      // Optionally listen for "close" if no "error" occurs
      (this.port as MavLinkPacketParser).on("close", (hadError: unknown) => {
        if (hadError) {
          reject(new Error("Connection closed unexpectedly."));
        }
      });
    });
  }

  private async connectTcp() {
    this.port = connect({
      host: (this.connectionOption as TcpOptions).host,
      port: (this.connectionOption as TcpOptions).port,
    });

    await new Promise<void>((resolve, reject) => {
      (this.port as Socket).on("connect", () => {
        resolve();
      });

      (this.port as Socket).on("error", (err) => {
        reject(new Error(`Connection failed: ${err.message}`));
      });

      // Optionally listen for "close" if no "error" occurs
      (this.port as Socket).on("close", (hadError) => {
        if (hadError) {
          reject(new Error("Connection closed unexpectedly."));
        }
      });
    });

    this.port.on("data", (packet) => {
      this.onData(packet);
    });
  }

  private async connectUdp() {
    this.port = new MavEsp8266();
    await this.port.start(
      (this.connectionOption as UdpOptions).receivePort,
      (this.connectionOption as UdpOptions).sendPort,
      (this.connectionOption as UdpOptions).ip,
    );

    this.port.on("data", (packet) => {
      this.onData(packet);
    });

    this.port.on("error", (err) => {
      console.error(`Connection failed: ${err.message}`);
    });

    // Optionally listen for "close" if no "error" occurs
    this.port.on("close", (hadError) => {
      if (hadError) {
        console.error("Connection closed unexpectedly.");
      }
    });
  }

  onData(packet: any) {
    // TODO: test signature verification with TCP -> the 'data' callback provides a 'Buffer' object which has no 'signature' property
    if (packet.signature) {
      if (packet.signature.matches(this.signatureKey)) {
        this.streamToBrowser(packet);
      } else {
        console.warn("Signature check failed! Fraudulent package received?");
      }
    } else {
      this.streamToBrowser(packet);
    }
  }

  streamToBrowser(packet: any) {
    console.log(packet);
    try {
      // push data through event stream to the frontend
      if (this.eventStream) {
        const clazz = REGISTRY[packet.header.msgid]; // Lookup the class
        if (clazz) {
          const data = packet.protocol.data(packet.payload, clazz);

          this.eventStream.push({
            event: "message",
            data: JSON.stringify({
              header: packet.header,
              protocol: packet.protocol,
              signature: packet.signature,
              data: data,
            } as MavlinkMessageInterface),
          });
        } else console.warn(`Unknown message ID: ${packet.header.msgid}`);
      }
    } catch (err) {
      console.error(`Failed to stream packet: ${err}`);
    }
  }
}
