import dgram from "dgram";

export class SerialOptions {
  readonly type = "serial";
  readonly path: string;
  readonly baudRate: number;

  constructor(path: string, baudRate: number) {
    this.path = path;
    this.baudRate = baudRate;
  }
}

export class TcpOptions {
  readonly type = "tcp";
  readonly host: string;
  readonly port: number;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }
}

export class UdpOptions {
  readonly type = "udp";

  readonly autoBindInterface: boolean = false;
  readonly socketType: dgram.SocketType = "udp4";
  readonly sourceIp?: string; // empty IP means 0.0.0.0
  readonly sourcePort: number = 14550;
  readonly targetIp?: string; // empty IP means automatically determine IP
  readonly targetPort?: number; // empty means send the data to the port it was received from. 14555: MAVLink default port, 18570: PX4 simulator

  constructor(
    autoBindInterface?: boolean,
    socketType?: dgram.SocketType,
    sourceIp?: string,
    sourcePort?: number,
    targetIp?: string,
    targetPort?: number,
  ) {
    if (autoBindInterface !== undefined)
      this.autoBindInterface = autoBindInterface;
    if (socketType !== undefined) this.socketType = socketType;
    this.sourceIp = sourceIp;
    if (sourcePort !== undefined) this.sourcePort = sourcePort;
    this.targetIp = targetIp;
    this.targetPort = targetPort;
  }
}
