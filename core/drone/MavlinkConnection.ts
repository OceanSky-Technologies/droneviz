// MavlinkConnection.ts
import { baseURL } from "@/baseURL.config";
import { showToast, ToastSeverity } from "@/utils/ToastService";
import { Drone } from "./Drone";
import type {
  MavlinkMessageInterface,
  QueryResult,
} from "@/types/MessageInterface";
import { REGISTRY } from "@/types/MavlinkRegistry";
import type { ConnectionOptions } from "../../types/DroneConnectionOptions";
import type { CommandInt, CommandLong } from "mavlink-mappings/dist/lib/common";

/**
 * Structure for SSE-based request/response matching.
 */
interface ResponseCallback<T> {
  matcher: (msg: T, raw: MavlinkMessageInterface) => boolean;
  onDenied?: (msg: T) => [boolean, string?];
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

/** Default fetch options for HTTP calls. */
const defaultFetchOptions = {
  method: "POST" as const,
  baseURL,
};

/**
 * A single SSE connection that can handle multiple Drone instances.
 * Any newly discovered (sysId, compId) spawns a new Drone.
 */
export class MavlinkConnection {
  private connectionOptions: ConnectionOptions;
  private signatureKey?: string;
  private eventSource?: EventSource;
  private isConnected = false;

  // Request/response callbacks (for commands, pings, etc.)
  private responseCallbacks: Array<ResponseCallback<any>> = [];

  // Store drones in a plain Map. No reactivity here, so no type mismatches.
  private drones: Map<string, Drone> = new Map();

  constructor(connectionOptions: ConnectionOptions, signatureKey?: string) {
    this.connectionOptions = connectionOptions;
    this.signatureKey = signatureKey;
  }

  public get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Connect to the server with a single SSE stream.
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      showToast("Already connected.", ToastSeverity.Info);
      return;
    }
    this.isConnected = false;

    // 1) Call /api/drone/connect with the desired options
    const result = await this.sendHttp("/api/drone/connect", {
      connectionOptions: JSON.stringify(this.connectionOptions),
      signatureKey: JSON.stringify(this.signatureKey),
    });
    if (!result.success) {
      throw new Error(`Connection failed: ${result.message}`);
    }

    // 2) Open SSE on /api/drone/stream
    this.eventSource = new EventSource(new URL("/api/drone/stream", baseURL));
    this.eventSource.onmessage = (evt) => {
      const raw = JSON.parse(evt.data) as MavlinkMessageInterface;
      this.handleSseMessage(raw);
    };
    this.eventSource.onerror = (err) => {
      console.error("MavlinkConnection SSE error:", err);
      showToast(
        `MavlinkConnection SSE error: ${JSON.stringify(err)}`,
        ToastSeverity.Error,
      );
      this.isConnected = false;
      this.eventSource?.close();
    };

    this.isConnected = true;
    showToast("Connected (single SSE).", ToastSeverity.Success);
  }

  /**
   * Disconnect from the server, stop SSE, etc.
   */
  public async disconnect(force = false): Promise<void> {
    if (!this.isConnected && !force) return;

    this.eventSource?.close();
    this.eventSource = undefined;

    try {
      const result = await this.sendHttp("/api/drone/disconnect", {});
      if (!result.success) {
        showToast(`Disconnect error: ${result.message}`, ToastSeverity.Warn);
      }
    } catch (err: any) {
      console.error("Error in /api/drone/disconnect:", err);
    } finally {
      this.isConnected = false;
      showToast("Disconnected from server.", ToastSeverity.Success);
    }
  }

  /**
   * Remove and destroy all Drone objects from the internal Map.
   */
  public destroyAllDrones(): void {
    for (const drone of this.drones.values()) {
      drone.destroy();
    }
    this.drones.clear();
  }

  /**
   * Return an array of all known Drone instances.
   */
  public getAllDrones(): Drone[] {
    return Array.from(this.drones.values());
  }

  /**
   * Return a specific Drone by sysId/compId, if it exists.
   */
  public getDrone(sysId: number, compId: number): Drone | undefined {
    return this.drones.get(`${sysId}-${compId}`);
  }

  /**
   * HTTP POST helper with a timeout, using $fetch (Nuxt/Vite).
   */
  public async sendHttp<T extends object>(
    api: string,
    body: T,
    timeoutMs = 5000,
  ): Promise<QueryResult> {
    const ac = new AbortController();
    const timer = setTimeout(() => {
      ac.abort(`POST ${api} timed out after ${timeoutMs}ms`);
    }, timeoutMs);

    try {
      const response = await $fetch(api, {
        ...defaultFetchOptions,
        signal: ac.signal,
        body: { ...body },
      });
      return typeof response === "string" ? JSON.parse(response) : response;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * A general "send-and-expect" flow:
   *  - Perform an HTTP call (sendFunc)
   *  - Wait for an SSE message that matches or denies
   */
  public sendAndExpectResponse<T>(
    sendFunc: () => Promise<unknown> | undefined,
    matcher: (msg: T, raw: MavlinkMessageInterface) => boolean,
    onDenied?: (msg: T) => [boolean, string?],
    timeoutMessage = "Timed out waiting for SSE response.",
    timeoutMs = 5000,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const cb: ResponseCallback<T> = { matcher, onDenied, resolve, reject };
      this.responseCallbacks.push(cb);

      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const maybePromise = sendFunc();
      if (maybePromise instanceof Promise) {
        maybePromise
          .then(() => {
            // Start the SSE timeout once HTTP completes
            timeoutId = setTimeout(() => {
              this.removeCallback(cb);
              reject(new Error(timeoutMessage));
            }, timeoutMs);
          })
          .catch((err) => {
            this.removeCallback(cb);
            reject(err);
          });
      } else {
        // If sendFunc was synchronous:
        timeoutId = setTimeout(() => {
          this.removeCallback(cb);
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }

      // Wrap resolve/reject to clear timer
      const originalResolve = cb.resolve;
      cb.resolve = (val) => {
        if (timeoutId) clearTimeout(timeoutId);
        originalResolve(val);
      };

      const originalReject = cb.reject;
      cb.reject = (err) => {
        if (timeoutId) clearTimeout(timeoutId);
        originalReject(err);
      };
    });
  }

  /**
   * (Private) Called for every inbound SSE message.
   */
  private handleSseMessage(raw: MavlinkMessageInterface) {
    const { sysid, compid } = raw.header;
    const key = `${sysid}-${compid}`;

    let drone = this.drones.get(key);
    if (!drone) {
      // Create new Drone if not found
      drone = new Drone(sysid, compid, this);
      this.drones.set(key, drone);
      showToast(
        `New drone detected: sysId=${sysid}, compId=${compid}`,
        ToastSeverity.Info,
      );
    }
    // Pass the message to the drone
    drone.handleMavlinkMessage(raw);

    // Check if this message satisfies any pending request callbacks
    this.checkResponseCallbacks(raw);
  }

  /**
   * Checks pending response callbacks to see if the new raw message
   * (when parsed) matches or denies them.
   */
  private checkResponseCallbacks(raw: MavlinkMessageInterface): void {
    const Clazz = REGISTRY[raw.header.msgid];
    if (!Clazz) return; // unknown message, do nothing

    const parsed = Object.assign(new Clazz(), raw.data);

    const toRemove: ResponseCallback<any>[] = [];

    for (const cb of this.responseCallbacks) {
      // Check if "denied"
      if (cb.onDenied) {
        const [isDenied, reason] = cb.onDenied(parsed);
        if (isDenied) {
          cb.reject(new Error(reason || "Denied by onDenied."));
          toRemove.push(cb);
          continue;
        }
      }

      // Check if "matched"
      if (cb.matcher(parsed, raw)) {
        cb.resolve(parsed);
        toRemove.push(cb);
      }
    }

    if (toRemove.length > 0) {
      toRemove.forEach((item) => this.removeCallback(item));
    }
  }

  private removeCallback<T>(cb: ResponseCallback<T>) {
    const idx = this.responseCallbacks.indexOf(cb);
    if (idx >= 0) {
      this.responseCallbacks.splice(idx, 1);
    }
  }

  // ----------------------------------------------------------------
  // Helpers for sending MAVLink commands
  // ----------------------------------------------------------------
  public async sendCommandLong(
    sysId: number,
    compId: number,
    cmd: CommandLong,
    timeoutMs = 5000,
  ): Promise<QueryResult> {
    cmd.targetSystem = sysId;
    cmd.targetComponent = compId;
    return this.sendHttp("/api/drone/commandLong", cmd, timeoutMs);
  }

  public async sendCommandInt(
    sysId: number,
    compId: number,
    cmd: CommandInt,
    timeoutMs = 5000,
  ): Promise<QueryResult> {
    cmd.targetSystem = sysId;
    cmd.targetComponent = compId;

    return this.sendHttp("/api/drone/commandInt", cmd, timeoutMs);
  }
}
