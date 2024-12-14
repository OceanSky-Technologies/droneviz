import { Socket, connect } from "node:net";
import dgram from "dgram";
import os from "os";
import { Readable, Writable } from "stream";
import {
  MavLinkPacketParser,
  MavLinkPacketSplitter,
  MavLinkPacketSignature,
  createMavLinkStream,
  send as mavlinkSend,
  sendSigned as mavlinkSendSigned,
  MavLinkProtocolV2,
  MavLinkData,
  MavLinkProtocolV1,
} from "node-mavlink";
import { SerialPort } from "serialport";
import type { EventStream } from "h3";
import {
  SerialOptions,
  TcpOptions,
  UdpOptions,
} from "@/types/DroneConnectionOptions";
import { REGISTRY } from "@/types/MavlinkRegistry";
import type { MavlinkMessageInterface } from "@/types/MessageInterface";
import { fixBigIntSerialization } from "@/types/bigIntSerializationHelper";

fixBigIntSerialization();

export class DroneInterface {
  private connectionOption: SerialOptions | TcpOptions | UdpOptions;

  private port: Socket | dgram.Socket | SerialPort | undefined;
  private readStream?: Readable;
  private writeStream?: Writable;
  private mavlinkPacketParser?: MavLinkPacketParser;
  private signatureKey?: Buffer;
  private clients = new Map<string, { address: string; port: number }>();

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
    this.clients.clear();

    this.mavlinkPacketParser?.removeAllListeners();
    this.mavlinkPacketParser?.destroy();
    this.mavlinkPacketParser = undefined;

    if (this.port instanceof SerialPort) {
      this.port.removeAllListeners();
      this.port.close();
      this.port = undefined;
    } else if (this.port instanceof Socket) {
      this.port.removeAllListeners();
      this.port.resetAndDestroy();
      this.port = undefined;
    } else if (this.port instanceof dgram.Socket) {
      this.port.removeAllListeners();
      this.port.close();
      this.port = undefined;
    }
  }

  private async connectSerial() {
    this.port = new SerialPort({
      path: (this.connectionOption as SerialOptions).path,
      baudRate: (this.connectionOption as SerialOptions).baudRate,
    });

    // constructing a reader that will emit each packet separately
    this.mavlinkPacketParser = this.port
      .pipe(new MavLinkPacketSplitter())
      .pipe(new MavLinkPacketParser());

    this.mavlinkPacketParser.on("data", (packet: any) => {
      this.onData(packet);
    });

    // TODO this hasn't been tested yet
    await new Promise<void>((resolve, reject) => {
      this.mavlinkPacketParser!.on("connect", () => {
        resolve();
      });

      this.mavlinkPacketParser!.on("error", (err) => {
        reject(new Error(`Connection failed: ${err.message}`));
      });

      // Optionally listen for "close" if no "error" occurs
      this.mavlinkPacketParser!.on("close", (hadError: unknown) => {
        if (hadError) {
          reject(new Error("Connection closed unexpectedly."));
        }
      });
    });
  }

  private async connectTcp() {
    // TODO: structure it the same way like UDP connection

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

    this.port.on("data", (packet: any) => {
      this.onData(packet);
    });
  }

  private async connectUdp() {
    this.connectionOption = this.connectionOption as UdpOptions;

    const socketOptions: dgram.SocketOptions = {
      type: this.connectionOption.socketType,
      reuseAddr: true,
    };
    this.port = dgram.createSocket(socketOptions);

    let bindAddress;
    if (this.connectionOption.sourceIp)
      bindAddress = this.connectionOption.sourceIp;
    else if (this.connectionOption.autoBindInterface)
      bindAddress = this.getInterfaceAddress(this.connectionOption.socketType);
    else {
      // bind to all interfaces -> receives packets twice: broadcast packets and packets sent to the drone's IP
      // specify the source IP to avoid this
      bindAddress = undefined;
    }

    this.port.bind(this.connectionOption.sourcePort, bindAddress, () => {
      const address = (this.port as dgram.Socket)!.address();
      console.log(`Server bound to ${address.address}:${address.port}`);
    });

    // create a Readable stream to pipe the UDP packets into the Mavlink parser
    this.readStream = new Readable({
      read() {
        // Intentionally empty because we manually push data
      },
    });

    this.mavlinkPacketParser = createMavLinkStream(this.readStream, {
      onCrcError: (buffer: Buffer) => {
        console.error(`CRC error: ${buffer}`);
      },
    });

    // create a Writable stream to pipe the Mavlink packets into the UDP port
    this.writeStream = new Writable();
    this.writeStream._write = (
      chunk: Buffer,
      _encoding: BufferEncoding,
      callback: (error?: Error | null) => void,
    ) => {
      // send to all connected clients
      for (const [_key, { address, port }] of this.clients.entries()) {
        (this.port as dgram.Socket).send(
          chunk,
          (this.connectionOption as UdpOptions).targetPort ?? port,
          (this.connectionOption as UdpOptions).targetIp ?? address,
          (err) => {
            if (err) callback(err);
            else callback();
          },
        );
      }
    };

    this.port.on("listening", () => {
      const address = (this.port as dgram.Socket).address();
      console.log(`Server is listening at ${address.address}:${address.port}`);
    });

    this.port.on("message", (msg, rinfo) => {
      // add client to the list of connected clients
      // TODO: handle automatic discovery of multiple drones in the frontend
      const clientKey = `${rinfo.address}:${rinfo.port}`;
      if (!this.clients.has(clientKey)) {
        this.clients.set(clientKey, {
          address: rinfo.address,
          port: rinfo.port,
        });
      }

      this.readStream!.push(msg);
    });

    this.mavlinkPacketParser.on("data", (msg) => {
      this.onData(msg);
    });

    this.port.on("error", (err) => {
      console.error(`Server error: ${err}`);
      this.disconnect();
    });
  }

  onData(packet: any) {
    // TODO: test signature verification with TCP -> the 'data' callback provides a 'Buffer' object which has no 'signature' property
    if (packet.signature) {
      if (packet.signature.matches(this.signatureKey)) {
        this.handleMessage(packet);
      } else {
        console.warn("Signature check failed! Fraudulent package received?");
      }
    } else {
      this.handleMessage(packet);
    }
  }

  handleMessage(packet: any) {
    // console.log(packet);
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

  private getInterfaceAddress(type: dgram.SocketType): string {
    const interfaces = os.networkInterfaces();

    for (const [name, addresses] of Object.entries(interfaces)) {
      for (const addressInfo of addresses!) {
        const { address, family, internal } = addressInfo;

        // Skip internal (loopback) interfaces
        if (internal) continue;

        // Match socket type: IPv4 or IPv6
        if (type === "udp4" && family === "IPv4") {
          console.log(`Selected interface: ${name}, address: ${address}`);
          return address;
        }

        if (type === "udp6" && family === "IPv6") {
          console.log(`Selected interface: ${name}, address: ${address}`);
          return address;
        }
      }
    }

    // Default to undefined or wildcard if no interface matches
    console.warn("No suitable interface found; binding to wildcard address.");
    return type === "udp4" ? "0.0.0.0" : "::";
  }

  send(command: MavLinkData): Promise<unknown> {
    if (!this.writeStream) {
      throw new Error("Connection not established");
    }

    // TODO: add support for serial connection

    if (this.port instanceof dgram.Socket || this.port instanceof Socket) {
      if (this.signatureKey === undefined) {
        return mavlinkSend(
          this.writeStream,
          command,
          new MavLinkProtocolV2(255, 190), // make the system and component ID configurable (they go in the message's header)
        );
      } else {
        return mavlinkSendSigned(this.writeStream, command, this.signatureKey);
      }
    } else throw new Error("Unsupported connection type for sending commands");
  }
}
