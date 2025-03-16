import type { LogDocument } from "./db";

export interface ServerToClientEvents {
  logs: (data: LogDocument[]) => void;
}

export interface ClientToServerEvents {}

export { type LogDocument };
