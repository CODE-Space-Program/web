import React, { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import { withQueryClientProvider } from "./withQueryClientProvider";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  LogDocument,
} from "../../../src/socket";

export async function getSocket(): Promise<
  Socket<ServerToClientEvents, ClientToServerEvents>
> {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("", {
    transports: ["websocket"],
  });
  return socket;
}

function useLiveLogs(flightId?: string) {
  const [logs, setLogs] = useState<LogDocument[]>([]);

  const socket =
    useRef<Socket<ServerToClientEvents, ClientToServerEvents>>(null);

  useEffect(() => {
    getSocket().then((newSocket) => {
      socket.current = newSocket;

      newSocket.on("log", (data) => {
        if (data.flightId !== flightId) return;

        setLogs((prevLogs) => [...prevLogs, data]);
      });
    });
  }, []);

  const lastLogTimestamp: number | null = logs[logs.length - 1]?.received;

  return { logs, lastLogTimestamp };
}

async function fetchCurrentFlight() {
  const currentFlightRes = await fetch("/api/flights");

  const currentFlight: { id: string } | undefined = (
    await currentFlightRes.json()
  ).data.data[0];

  return currentFlight;
}

const useCurrentFlight = () =>
  useQuery({
    queryKey: ["currentFlight"],
    queryFn: fetchCurrentFlight,
  });

export interface FlightControlProps {}

export const FlightControlss: React.FC<FlightControlProps> = () => {
  const { data, isLoading, error } = useCurrentFlight();

  const { logs, lastLogTimestamp } = useLiveLogs(data?.id);

  const onTakeoffClick = async () => {
    if (!data?.id) return;

    const password = prompt('Please enter "takeoff" to confirm:');
    if (
      typeof password === "string" &&
      password.trim().toLowerCase() !== "takeoff"
    ) {
      alert("Invalid input, aborting takeoff.");
      return;
    }

    const takeOffRes = await fetch(`/api/flights/${data?.id}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sent: Date.now(),
        command: "start",
      }),
    });
    if (!takeOffRes.ok) {
      alert("Error: Failed to send takeoff command");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error :(</div>;
  }
  if (!data) {
    return <div>No flight in process.</div>;
  }

  const logStatus = lastLogTimestamp
    ? `Last update: ${dayjs(lastLogTimestamp).fromNow()}`
    : "No data yet";

  return (
    <>
      <div className="inner-left-bottom">
        <h1>Ground Control</h1>
        <p>
          Flight ID: {data.id} - {logStatus}
        </p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={onTakeoffClick} className="button">
            Takeoff
          </button>
          <a
            target="_blank"
            href={`/api/flights/${data.id}/logs`}
            className="button"
          >
            View Logs ({logs.length})
          </a>
        </div>
      </div>
    </>
  );
};

export const FlightControls = withQueryClientProvider(FlightControlss);
