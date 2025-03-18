import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyDeviceToken } from "./jwt";

function getToken(request: FastifyRequest): string | undefined {
  return (request.cookies.auth || request.headers.authorization)?.replace(
    "Bearer ",
    ""
  );
}

export async function assertFlightIdMatchesDevice(
  request: FastifyRequest<{ Params: { flightId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const token = getToken(request);

  if (!token) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  try {
    const payload = await verifyDeviceToken(token);

    if (!payload.sub) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const flightId = request.params.flightId;

    if (payload.sub !== flightId) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  } catch (err) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}

export async function assertUserToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = getToken(request);

  if (!token) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  try {
    await verifyDeviceToken(token);
  } catch (err) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}
