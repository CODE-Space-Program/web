import React, { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { withQueryClientProvider } from "./withQueryClientProvider";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  LogDocument,
} from "../../../src/socket";
import { useInterval } from "./useInterval";
import ArtificialHorizon from "./ArtificialHorizon";
import Chart from "./Chart";

dayjs.extend(relativeTime);

const getQualifiedUrl = () =>
  window.location.protocol +
  "//" +
  window.location.hostname +
  (window.location.hostname === "localhost" ? ":" + window.location.port : "");

export async function getSocket(): Promise<
  Socket<ServerToClientEvents, ClientToServerEvents>
> {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    getQualifiedUrl(),
    {
      transports: ["websocket"],
    }
  );
  return socket;
}

function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useInterval(() => {
    setCurrentTime(Date.now());
  }, 1000);

  return currentTime;
}

function useLogs(flightId?: string) {
  const [logs, setLogs] = useState<LogDocument[]>([]);

  const socket =
    useRef<Socket<ServerToClientEvents, ClientToServerEvents>>(null);

  useEffect(() => {
    if (!flightId) return;

    getSocket().then(async (newSocket) => {
      socket.current = newSocket;

      const logsRes = await fetch(`/api/flights/${flightId}/logs`);
      const logsData = await logsRes.json();

      setLogs(logsData.data);

      newSocket.on("logs", (data) => {
        setLogs((prevLogs) => [
          ...prevLogs,
          ...data.filter((i) => i.flightId === flightId),
        ]);
      });
    });
  }, [flightId]);

  const lastLogTimestamp: number | null = logs[logs.length - 1]?.received;

  const isInProgress = lastLogTimestamp
    ? Date.now() - lastLogTimestamp < 2000
    : false;

  return { logs, lastLogTimestamp, isInProgress };
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
  // rerender timestamp every second
  useCurrentTime();

  const { data, isLoading, error } = useCurrentFlight();

  const { logs, lastLogTimestamp, isInProgress } = useLogs(data?.id);

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
    return (
      <div className="inner-left-bottom">
        <h1>Ground Control</h1>
        <p>Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="inner-left-bottom">
        <h1>Ground Control</h1>
        <p>An error occurred</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="inner-left-bottom">
        <h1>Ground Control</h1>
        <p>No flight in progress</p>
      </div>
    );
  }

  function getGoogleAuthUrl() {
    const clientId =
      "362081384026-k7jclf68lclap0am9qocuoojons27j1d.apps.googleusercontent.com";
    const redirectUri = getQualifiedUrl() + "/api/auth/google/callback";

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

    return googleAuthUrl;
  }

  const lastUpdateString = lastLogTimestamp
    ? isInProgress
      ? "Receiving data"
      : `Last update ${dayjs(lastLogTimestamp).fromNow()}`
    : "No data yet";

  const startTime = logs[0]?.sent;

  return (
    <>
      {/* <a href={getGoogleAuthUrl()} aria-label="Login with Google">
        Login with Google
      </a> */}
      <div className="inner-left-bottom">
        <h1>Ground Control</h1>
        <p style={{ marginBottom: 0 }}>Flight ID: {data.id}</p>
        <p style={{ marginTop: 0 }}>{lastUpdateString}</p>
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
          <ArtificialHorizon
            pitch={(logs[logs.length - 1]?.data.pitch || 0) / 180}
            roll={(logs[logs.length - 1]?.data.yaw || 0) / 180}
            size="54px"
          />
        </div>
      </div>
      {logs.length > 1 ? (
        <div
          style={{
            display: "flex",
            maxWidth: "420px",
            width: "100%",

            position: "absolute",

            top: "50%",
            right: "50px",
          }}
        >
          <Chart
            lookbackMs={10000}
            data={logs.map((i) => ({
              time: i.sent - startTime,
              value: i.data.altitude,
            }))}
            xAxis="Time (ms)"
            yAxis="Altitude (m)"
          />
        </div>
      ) : null}
    </>
  );
};

export const FlightControls = withQueryClientProvider(FlightControlss);
