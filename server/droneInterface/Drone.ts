import type { Socket } from "net";
import { connect } from "net";
import {
  MavEsp8266,
  MavLinkPacketParser,
  type MavLinkPacketRegistry,
  minimal,
  common,
  ardupilotmega,
  MavLinkPacketSplitter,
  MavLinkPacketSignature,
} from "node-mavlink";
import { SerialPort } from "serialport";
import {
  SerialOptions,
  TcpOptions,
  UdpOptions,
} from "../../types/DroneConnectionOptions";

export class Drone {
  private connectionOption: SerialOptions | TcpOptions | UdpOptions;

  private serialPort?: SerialPort;
  private port: MavEsp8266 | Socket | MavLinkPacketParser | undefined;
  private signatureKey?: Buffer;

  // create a registry of mappings between a message id and a data class
  private REGISTRY: MavLinkPacketRegistry = {
    ...minimal.REGISTRY,
    ...common.REGISTRY,
    ...ardupilotmega.REGISTRY,
  };

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
        console.log("tcp");
        await this.connectTcp();
      } else if (this.connectionOption instanceof UdpOptions) {
        console.log("udp");
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
        this.parseData(packet);
      } else {
        console.warn("Signature check failed! Fraudulent package?");
      }
    } else {
      this.parseData(packet);
    }
  }

  parseData(packet: any) {
    const clazz = this.REGISTRY[packet.header.msgid];
    if (clazz) {
      const data = packet.protocol.data(packet.payload, clazz);
      console.log("Parsed packet:", data);
    } else {
      console.log("Not registered packet received:", packet);
    }
  }
}
