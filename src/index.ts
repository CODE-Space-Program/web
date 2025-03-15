import crypto from "crypto";
import path from "path";

import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";
import mitt from "mitt";

import { env } from "./env";
import { logsCollection, type LogDocument } from "./db";

class Commands {
  public events = mitt<{
    commandsAdded: { flightId: string; command: string }[];
  }>();

  private commands: Record<
    string,
    // completed is currently unused, because the rocket doesn't give feedback on which commands were completed
    { command: string; sent: boolean; completed: boolean }[]
  > = {};
  constructor() {}

  public processFromQueue(flightId: string) {
    this.commands[flightId] = this.commands[flightId]?.map((i) => ({
      ...i,
      sent: true,
    }));

    return (
      this.commands[flightId]
        ?.filter((i) => !i.sent)
        .map((i) => ({ command: i.command })) ?? []
    );
  }

  public addToQueue(flightId: string, command: string) {
    if (!this.commands[flightId]) {
      this.commands[flightId] = [];
    }
    this.commands[flightId].push({
      command,
      sent: false,
      completed: false,
    });
    this.events.emit("commandsAdded", [{ flightId, command }]);
  }
}
const commands = new Commands();

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

  app.get("/api/flights", async (req, reply) => {
    const totalNumFlights = await logsCollection.distinct("flightId");

    const flights = await logsCollection
      .aggregate([
        {
          $group: {
            _id: "$flightId",
            received: { $max: "$received" },
          },
        },
        {
          $sort: {
            received: -1,
          },
        },
        {
          $limit: 10,
        },
      ])
      .toArray();

    reply.send({
      data: {
        data: flights.map((i) => ({ id: i._id, lastReceived: i.received })),
        paging: {
          nextCursor: null,
          total: totalNumFlights.length,
          results: flights.length,
        },
      },
    });
  });

  app.post<{
    Body: { command: string };
    Params: { flightId: string };
  }>("/api/flights/:flightId/events", async (req, reply) => {
    const { flightId } = req.params;
    const { command } = req.body;

    commands.addToQueue(flightId, command);

    reply.send({
      data: {
        ok: true,
      },
    });
  });

  // this is a polling endpoint: while we don't have events, it will keep waiting
  app.get<{ Params: { flightId: string } }>(
    "/api/flights/:flightId/events",
    async (req, reply) => {
      const { flightId } = req.params;

      const backloggedCommands = commands.processFromQueue(flightId);

      if (backloggedCommands.length) {
        reply.send({
          data: backloggedCommands,
        });
        return;
      }

      const liveCommands = await new Promise<{ command: string }[]>((res) => {
        setTimeout(() => res([]), 10000);

        commands.events.on("commandsAdded", (commands) => {
          const dinger = commands.filter((i) => i.flightId === flightId);
          if (dinger.length) {
            res(dinger.map((i) => ({ command: i.command })));
          }
        });
      });
      reply.send({
        data: liveCommands,
      });
    }
  );

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
