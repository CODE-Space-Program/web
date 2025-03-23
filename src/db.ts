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
    gyro_x: number;
    gyro_y: number;
    gyro_z: number;
    pitch: number;
    yaw: number;
    roll: number;
    pressure: number;
    altitude: number;
    temperature: number;

    nominalPitchServoDegrees: number;
    nominalYawServoDegrees: number;

    velocity: number;

    state: string;
  };
}
export const logsCollection = db.collection<LogDocument>("logs");
