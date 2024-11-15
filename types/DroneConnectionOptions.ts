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
  readonly receivePort?: number;
  readonly sendPort?: number;
  readonly ip?: string; // empty IP means broadcast

  constructor(receivePort?: number, sendPort?: number, ip?: string) {
    this.receivePort = receivePort;
    this.sendPort = sendPort;
    this.ip = ip;
  }
}
