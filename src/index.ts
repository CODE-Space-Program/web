import crypto from "crypto";
import path from "path";

import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";

import { env } from "./env";

import { logsCollection, type LogDocument } from "./db";

export async function buildFastify(): Promise<FastifyInstance> {
  const app = Fastify();

  await app.register(fastifyCors, { origin: env.corsOrigins });
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allows inline scripts
        frameSrc: ["'self'", "https://www.youtube.com"], // Allows YouTube iframes
        objectSrc: ["'none'"], // Restrict embedding of plugins
      },
    },
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, "../frontend/dist"),
  });

  app.ready((err) => {
    if (err) throw err;
  });

  app.get("/", async function (req, reply) {
    return reply.sendFile("index.html");
  });

  app.post("/api/flights", async (req, reply) => {
    reply.send({
      data: {
        flightId: crypto.randomUUID(),
      },
    });
  });

  app.post<{
    Body: LogDocument["data"] & Pick<LogDocument, "sent">;
    Params: { flightId: string };
  }>("/api/flights/:flightId/logs", async (req, reply) => {
    try {
      const { flightId } = req.params;
      const { sent, ...data } = req.body;

      await logsCollection.insertOne({
        flightId,
        sent,
        received: Date.now(),
        data,
      });
      reply.send({
        data: {
          ok: true,
        },
      });
    } catch (err) {
      reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  });

  app.get<{ Params: { flightId: string } }>(
    "/api/flights/:flightId/logs",
    async (req, reply) => {
      const { flightId } = req.params;

      const data = await logsCollection
        .find({ flightId }, { projection: { _id: 0 } })
        .toArray();

      reply.send({
        data,
      });
    }
  );

  app.get("/api/health", async (req, reply) => {
    reply.send({
      data: {
        ok: true,
      },
    });
  });
  return app;
}

async function main(): Promise<void> {
  const app = await buildFastify();

  // host: '0.0.0.0' is required for Docker
  app.listen({ port: env.port, host: "0.0.0.0" }, (err) => {
    if (err) throw err;

    // eslint-disable-next-line no-console
    console.info("listening at http://localhost:" + env.port);
  });
}
main();
