import crypto from "crypto";
import path from "path";

import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyStatic from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import Fastify, { type FastifyInstance } from "fastify";
import mitt from "mitt";
import fastifySocketIO from "fastify-socket.io";
import type { Server, Socket } from "socket.io";

import { env } from "./env";
import { logsCollection, type LogDocument } from "./db";
import { generateDeviceToken, generateUserToken } from "./jwt";
import { assertFlightIdMatchesDevice, assertUserToken } from "./authGuards";

const sockets = new Set<Socket<ClientToServerEvents, ServerToClientEvents>>();

class Commands {
  public events = mitt<{
    commandsAdded: { flightId: string; command: string }[];
    commandsReceived: { flightId: string; command: string }[];
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

    const receivedCommands = this.commands[flightId]?.filter((i) => !i.sent);

    if (receivedCommands?.length) {
      this.events.emit(
        "commandsReceived",
        receivedCommands.map((i) => ({ flightId, command: i.command }))
      );
    }
    return receivedCommands.map((i) => ({ command: i.command })) ?? [];
  }

  public removeFromQueue(flightId: string, command: string) {
    this.commands[flightId] = this.commands[flightId]?.filter(
      (i) => i.command !== command
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
  const app = Fastify({ logger: true }) as unknown as FastifyInstance & {
    io: Server;
  };

  await app.register(fastifyCookie);
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
  await app.register(fastifySocketIO);

  await app.register(fastifyStatic, {
    root: path.join(__dirname, "../frontend/dist"),
  });

  app.ready((err) => {
    if (err) throw err;

    initSocketHandlers(app.io);
  });

  app.get("/", async function (req, reply) {
    return reply.sendFile("index.html");
  });

  app.post("/api/flights", async (req, reply) => {
    try {
      const flightId = crypto.randomUUID();

      const token = await generateDeviceToken(flightId);

      reply.send({
        data: {
          flightId,
          token,
        },
      });
    } catch (err) {
      console.error(`failed to POST /api/flights: ${err}`);
      reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  });

  app.get<{
    Querystring: { code: string };
  }>("/api/auth/google/callback", async (req, reply) => {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.google.clientId,
        client_secret: env.google.clientSecret,
        code: req.query.code,
        grant_type: "authorization_code",
        redirect_uri: env.publicUrl + "/api/auth/google/callback",
      }).toString(),
    }).then((res) => res.json());

    const accessToken = tokenResponse.access_token;

    if (!accessToken) {
      reply.status(400).send({ error: "Failed to obtain access token" });
      return;
    }

    const userInfo = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    ).then((res) => res.json());

    console.log("userInfo:", userInfo);

    if (!userInfo.email) {
      reply.status(400).send({ error: "Failed to obtain user email" });
      return;
    }
    const whitelistedEmails = [
      "linus.bolls@code.berlin",
      "ava.hurst@code.berlin",
      "alexandru.danciu@code.berlin",
      "jeel.thummar@code.berlin",
    ];

    if (!whitelistedEmails.includes(userInfo.email)) {
      reply.status(403).send({ error: "Email not whitelisted" });
      return;
    }
    const token = await generateUserToken(userInfo.email);

    reply.setCookie("auth", token, {
      path: "/",
      httpOnly: false,
      secure: false, // Send only over HTTPS (set to false for local dev)
      sameSite: "strict",
    });
    reply.redirect("/");
  });

  app.get("/api/logout", async (req, reply) => {
    reply.clearCookie("auth");
    reply.redirect("/");
  });

  app.get(
    "/api/flights",
    { preHandler: assertUserToken },
    async (req, reply) => {
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
    }
  );

  app.post<{
    Body: { command: string };
    Params: { flightId: string };
  }>(
    "/api/flights/:flightId/events",
    {
      preHandler: assertUserToken,
      schema: {
        body: {
          type: "object",
          required: ["data"],
          properties: {
            command: { type: "string" },
          },
        },
      },
    },
    async (req, reply) => {
      const { flightId } = req.params;
      const { command } = req.body;

      commands.addToQueue(flightId, command);

      const executed = await new Promise<boolean>((res) => {
        setTimeout(() => res(false), 5000);

        commands.events.on("commandsReceived", (commands) => {
          const executedCommand = commands.find(
            (i) => i.flightId === flightId && i.command === command
          );
          if (executedCommand) {
            res(true);
          }
        });
      });

      if (!executed) {
        commands.removeFromQueue(flightId, command);

        reply.status(504).send({
          error: "Command not received by device",
        });
      }

      reply.send({
        data: {
          ok: true,
        },
      });
    }
  );

  // this is a polling endpoint: while we don't have events, it will keep waiting
  app.get<{ Params: { flightId: string } }>(
    "/api/flights/:flightId/events",
    { preHandler: assertFlightIdMatchesDevice },
    async (req, reply) => {
      try {
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
      } catch (err) {
        console.error(
          `failed to GET /api/flights/${req.params.flightId}/events: ${err}`
        );
        reply.status(500).send({
          error: "Internal Server Error",
        });
      }
    }
  );

  app.post<{
    Body: { data: (LogDocument["data"] & Pick<LogDocument, "sent">)[] };
    Params: { flightId: string };
  }>(
    "/api/flights/:flightId/logs",
    {
      preHandler: assertFlightIdMatchesDevice,
      schema: {
        body: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "array",
              items: {
                type: "object",
                required: ["sent"],
                properties: {
                  sent: { type: "integer" },
                },
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const { flightId } = req.params;

        const newLogs = req.body.data.map((i) => {
          const { sent, ...data } = i;

          return {
            flightId,
            sent,
            received: Date.now(),
            data,
          };
        });
        await logsCollection.insertMany(newLogs);

        try {
          for (const socket of sockets) {
            socket.emit("logs", newLogs);
          }
        } catch (err) {}

        reply.send({
          data: {
            ok: true,
          },
        });
      } catch (err) {
        console.error(
          `failed to POST /api/flights/${req.params.flightId}/logs: ${err}`
        );
        reply.status(500).send({
          error: "Internal Server Error",
        });
      }
    }
  );

  app.get<{ Params: { flightId: string } }>(
    "/api/flights/:flightId/logs",
    { preHandler: assertUserToken },
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

export interface ServerToClientEvents {
  logs: (data: LogDocument[]) => void;
}

export interface ClientToServerEvents {}

export function initSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on(
    "connection",
    (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      sockets.add(socket);

      socket.on("disconnect", () => {
        sockets.delete(socket);
      });
    }
  );
}
