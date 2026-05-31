import { Socket, connect } from "node:net";
import dgram from "dgram";
import os from "os";
import { Readable, Writable } from "stream";
import type { MavLinkData } from "node-mavlink";
import {
  MavLinkPacketParser,
  MavLinkPacketSplitter,
  MavLinkPacketSignature,
  createMavLinkStream,
  send as mavlinkSend,
  sendSigned as mavlinkSendSigned,
  MavLinkProtocolV2,
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

/**
 *
 */
export class DroneInterface {
  private connectionOption: SerialOptions | TcpOptions | UdpOptions;

  private port: Socket | dgram.Socket | SerialPort | undefined;
  private readStream?: Readable;
  private writeStream?: Writable;
  private mavlinkPacketParser?: MavLinkPacketParser;
  private signatureKey?: Buffer;
  private clients = new Map<string, { address: string; port: number }>();

  // PX4 SITL (and many autopilots) only stream telemetry once the GCS has sent
  // them a packet first, so they learn where to send. Until a packet arrives we
  // periodically poke the configured target with a heartbeat to kick it off.
  private wakeupInterval?: ReturnType<typeof setInterval>;

  eventStream?: EventStream;

  /**
   *
   */
  constructor(
    connectionOption: SerialOptions | TcpOptions | UdpOptions,
    signatureKey?: string,
  ) {
    this.connectionOption = connectionOption;

    if (signatureKey) {
      this.signatureKey = MavLinkPacketSignature.key(signatureKey);
    }
  }

  /**
   *
   */
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

  /**
   *
   */
  async disconnect() {
    this.stopWakeup();
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

  /**
   *
   */
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

  /**
   *
   */
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

  /**
   *
   */
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

      // Got a packet -> the autopilot now knows us, stop poking.
      this.stopWakeup();

      this.readStream!.push(msg);
    });

    this.mavlinkPacketParser.on("data", (msg) => {
      this.onData(msg);
    });

    this.port.on("error", (err) => {
      console.error(`Server error: ${err}`);
      this.disconnect();
    });

    // Kick the autopilot so it starts streaming to us (see wakeupInterval doc).
    this.startWakeup();
  }

  /**
   * Periodically send a GCS heartbeat to the configured UDP target so the
   * autopilot learns our address:port and begins streaming. Stops once any
   * packet is received (see the "message" handler) or on disconnect.
   */
  private startWakeup() {
    const opt = this.connectionOption as UdpOptions;
    const targetIp = opt.targetIp;
    const targetPort = opt.targetPort;

    // Nothing to poke if we don't know where to send the initial packet.
    if (!targetIp || !targetPort) return;

    const sendPoke = () => {
      const port = this.port as dgram.Socket | undefined;
      if (!port) return;
      const frame = this.buildGcsHeartbeatFrame();
      port.send(frame, targetPort, targetIp, (err) => {
        if (err) console.error(`Wakeup poke failed: ${err.message}`);
      });
    };

    this.stopWakeup();
    sendPoke(); // immediate first poke
    this.wakeupInterval = setInterval(sendPoke, 1000);
  }

  /**
   * Stop sending wakeup pokes.
   */
  private stopWakeup() {
    if (this.wakeupInterval) {
      clearInterval(this.wakeupInterval);
      this.wakeupInterval = undefined;
    }
  }

  /**
   * Build a minimal MAVLink v2 HEARTBEAT frame (type=GCS) used only to make the
   * autopilot start streaming. Hand-built so it does not depend on a writable
   * stream or learned clients (which don't exist yet at connect time).
   * @returns {Buffer} Encoded MAVLink v2 heartbeat frame.
   */
  private buildGcsHeartbeatFrame(): Buffer {
    // payload: type(1)=6 GCS, autopilot(1)=8 INVALID, base_mode(1)=0,
    // custom_mode(4)=0, system_status(1)=0, mavlink_version(1)=3
    const payload = Buffer.from([0x06, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03]);
    const header = Buffer.from([
      0xfd, // STX (v2)
      payload.length, // len
      0x00, // incompat flags
      0x00, // compat flags
      0x00, // seq
      0xff, // sysid (GCS = 255)
      0xbe, // compid (190)
      0x00, // msgid low (HEARTBEAT = 0)
      0x00, // msgid mid
      0x00, // msgid high
    ]);
    const frameNoCrc = Buffer.concat([header, payload]);

    // CRC-16/MCRF4XX over everything after STX, plus the message CRC_EXTRA (50 for HEARTBEAT).
    const crc = this.mavlinkCrc(frameNoCrc.subarray(1), 50);
    const crcBuf = Buffer.from([crc & 0xff, (crc >> 8) & 0xff]);
    return Buffer.concat([frameNoCrc, crcBuf]);
  }

  /**
   * Compute MAVLink CRC-16/MCRF4XX with the trailing CRC_EXTRA byte.
   * @param {Buffer} data Bytes from len..end of payload (excludes STX).
   * @param {number} crcExtra Message-specific CRC_EXTRA seed byte.
   * @returns {number} 16-bit checksum.
   */
  private mavlinkCrc(data: Buffer, crcExtra: number): number {
    let crc = 0xffff;
    const accumulate = (b: number) => {
      let tmp = b ^ (crc & 0xff);
      tmp = (tmp ^ (tmp << 4)) & 0xff;
      crc = ((crc >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4)) & 0xffff;
    };
    for (const b of data) accumulate(b);
    accumulate(crcExtra);
    return crc;
  }

  /**
   *
   */
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

  /**
   *
   */
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

  /**
   *
   */
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

  /**
   *
   */
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
