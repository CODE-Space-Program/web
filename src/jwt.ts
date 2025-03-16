import { createSecretKey } from "crypto";

import { jwtVerify, SignJWT } from "jose";

import { env } from "./env";

const secretKey = createSecretKey(Buffer.from(env.jwt.secret, "utf-8"));

export async function generateDeviceToken(flightId: string): Promise<string> {
  const token = await new SignJWT({ sub: flightId, role: "device" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .sign(secretKey);

  return token;
}

export async function generateUserToken(email: string): Promise<string> {
  const token = await new SignJWT({ sub: email, role: "user" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .sign(secretKey);

  return token;
}

export async function verifyDeviceToken(
  token: string
): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token.replace("Bearer ", ""), secretKey);

  return payload as { sub: string };
}

export async function verifyUserToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token.replace("Bearer ", ""), secretKey);

  return payload as { sub: string };
}
