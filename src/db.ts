import { MongoClient } from "mongodb";

import { env } from "./env";

export const client = new MongoClient(env.mongodb.uri);

export const db = client.db("spaceProgram");

await client.connect();

export interface LogDocument {
  flightId: string;
  sent: number;
  received: number;
  data: {
    gyro: {
      x: number;
      y: number;
      z: number;
    };
    acc: {
      x: number;
      y: number;
      z: number;
    };
    pressure: number;
    altitude: number;
    temperature: number;
  };
}
export const logsCollection = db.collection<LogDocument>("logs");
