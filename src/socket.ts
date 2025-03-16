import type { LogDocument } from "./db";

export interface ServerToClientEvents {
  log: (data: LogDocument) => void;
}

export interface ClientToServerEvents {}

export { type LogDocument };
