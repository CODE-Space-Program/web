import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import TvcIndicator from "./TvcIndicator";

const display = (value: unknown): ReactNode =>
  value == null ? "N/A" : (value as ReactNode);

dayjs.extend(relativeTime);

const getQualifiedUrl = (): string =>
  typeof window === "undefined"
    ? ""
    : window.location.protocol +
      "//" +
      window.location.hostname +
      (window.location.hostname === "localhost"
        ? ":" + window.location.port
        : "");

const baseUrl = "https://spaceprogram.bolls.dev";

const isCrossOrigin = baseUrl !== getQualifiedUrl();

const getHeaders = (): Record<string, string> => {
  if (!isCrossOrigin) return {};

  const token = document.cookie.match(/auth=(.+);?/)?.[1];

  if (!token) return {};

  return {
    /**
     * in production, we can do authorization via cookies because the frontend and the backend are on the same hostname (spaceprogram.bolls.dev).
     * in development, we can't use the cookie header (which is more secure, which is why we use it in production) because the frontend and the backend are on different hostnames (localhost:3000 and localhost:4000),
     * and browser block cross-origin cookies by default.
     */
    Authorization: `Bearer ${token}`,
  };
};

export async function getSocket(): Promise<
  Socket<ServerToClientEvents, ClientToServerEvents>
> {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    baseUrl,
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

      const logsRes = await fetch(baseUrl + `/api/flights/${flightId}/logs`, {
        headers: getHeaders(),
      });
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
  const currentFlightRes = await fetch(baseUrl + "/api/flights", {
    headers: getHeaders(),
  });

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

async function sendCommand(
  flightId: string | undefined,
  command: string,
  args?: unknown
) {
  if (!flightId) return;

  const takeoffRes = await fetch(baseUrl + `/api/flights/${flightId}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getHeaders(),
    },
    body: JSON.stringify({
      sent: Date.now(),
      command,
      args,
    }),
  });
  if (!takeoffRes.ok) {
    if (takeoffRes.status === 504) {
      throw new Error("Command not received by device");
    }
    throw new Error("Status " + takeoffRes.status);
  }
}

const useTakeoffCommand = (flightId?: string) =>
  useMutation({
    mutationFn: () => sendCommand(flightId, "start"),
  });

const useSetParametersCommand = (flightId?: string) =>
  useMutation<
    unknown,
    Error,
    {
      seaLevelPressure: number;
    }
  >({
    mutationFn: (data) => sendCommand(flightId, "set_parameters", data),
  });

const useTvcTestCommand = (flightId?: string) =>
  useMutation<
    unknown,
    Error,
    { maxDegrees: number; stepDegrees: number; duration: number }
  >({
    mutationFn: (data) =>
      sendCommand(flightId, "test_tvc", {
        maxDegrees: data.maxDegrees,
        stepDegrees: data.stepDegrees,
        duration: data.duration,
      }),
  });

const useZeroTvcCommand = (flightId?: string) =>
  useMutation({
    mutationFn: () => sendCommand(flightId, "zero_tvc"),
  });

export const FlightControlss: React.FC<FlightControlProps> = () => {
  // rerender timestamp every second
  useCurrentTime();

  const { data, isLoading, error } = useCurrentFlight();

  const { logs, lastLogTimestamp, isInProgress } = useLogs(data?.id);

  const {
    mutate: sendTakeoffCommand,
    isPending: isTakeoffPending,
    failureReason: takeoffFailureReason,
  } = useTakeoffCommand(data?.id);

  const {
    mutate: sendTvcTestCommand,
    isPending: isTvcTestPending,
    failureReason: tvcTestFailureReason,
  } = useTvcTestCommand(data?.id);

  const {
    mutate: sendSetParametersCommand,
    isPending: isSetParametersPending,
    failureReason: setParametersFailureReason,
  } = useSetParametersCommand(data?.id);

  const {
    mutate: sendZeroTvcCommand,
    isPending: isZeroTvcPending,
    failureReason: zeroTvcFailureReason,
  } = useZeroTvcCommand(data?.id);

  const onSetParametersClick = async () => {
    if (!data?.id) return;
    const seaLevelPressure = prompt("Please enter sea level pressure:");
    if (!seaLevelPressure) return;
    try {
      sendSetParametersCommand({
        seaLevelPressure: parseFloat(seaLevelPressure),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to send command: Failed to parse input parameters");
    }
  };

  const onTvcTestClick = async () => {
    if (!data?.id) return;

    const maxDegrees = prompt("Please enter max degrees:");
    if (!maxDegrees) return;

    const stepDegrees = prompt("Please enter step degrees:");
    if (!stepDegrees) return;

    const durationSeconds = prompt("Please enter duration in seconds:");
    if (!durationSeconds) return;

    try {
      sendTvcTestCommand({
        maxDegrees: parseFloat(maxDegrees),
        stepDegrees: parseFloat(stepDegrees),
        duration: parseInt(durationSeconds) * 1000,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to send command: Failed to parse input parameters");
    }
  };

  const onTakeoffClick = async () => {
    if (!data?.id) return;

    const password = prompt('Please enter "takeoff" to confirm:');
    if (!password) return;
    if (
      typeof password === "string" &&
      password.trim().toLowerCase() !== "takeoff"
    ) {
      alert("Invalid input, aborting takeoff.");
      return;
    }
    sendTakeoffCommand();
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

  const lastUpdateString = lastLogTimestamp
    ? isInProgress
      ? "Receiving data"
      : `Last update ${dayjs(lastLogTimestamp).fromNow()}`
    : "No data yet";

  const startTime = logs[0]?.sent;

  const currentLog = logs[logs.length - 1]?.data;

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
          <button
            onClick={onTakeoffClick}
            className="button"
            disabled={isTakeoffPending}
          >
            {isTakeoffPending ? "Sending..." : "Takeoff"}
          </button>
          <button
            onClick={onSetParametersClick}
            className="button"
            disabled={isSetParametersPending}
          >
            {isSetParametersPending ? "Sending..." : "Set Params"}
          </button>
          <button
            onClick={onTvcTestClick}
            className="button"
            disabled={isTvcTestPending}
          >
            {isTvcTestPending ? "Sending..." : "Test TVC"}
          </button>
          <button
            onClick={() => sendZeroTvcCommand()}
            className="button"
            disabled={isZeroTvcPending}
          >
            {isZeroTvcPending ? "Sending..." : "Zero TVC"}
          </button>
          <a
            target="_blank"
            href={baseUrl + `/api/flights/${data.id}/logs`}
            className="button"
          >
            View Logs ({logs.length})
          </a>
          <ArtificialHorizon
            pitch={(logs[logs.length - 1]?.data.pitch || 0) / 180}
            roll={(logs[logs.length - 1]?.data.yaw || 0) / 180}
            size="54px"
          />
          <TvcIndicator
            pitch={
              (logs[logs.length - 1]?.data.nominalPitchServoDegrees || 0) /
              360 /
              360
            }
            yaw={
              (logs[logs.length - 1]?.data.nominalYawServoDegrees || 0) /
              360 /
              360 /
              3
            }
            size="54px"
          />
        </div>
        {takeoffFailureReason && (
          <p>Takeoff failed: {takeoffFailureReason.message}</p>
        )}
        {tvcTestFailureReason && (
          <p>Test TVC failed: {tvcTestFailureReason.message}</p>
        )}
        {zeroTvcFailureReason && (
          <p>Test TVC failed: {zeroTvcFailureReason.message}</p>
        )}
        {setParametersFailureReason && (
          <p>Set parameters failed: {setParametersFailureReason.message}</p>
        )}
      </div>
      {logs.length > 1 ? (
        <table
          className="datatable"
          style={{
            position: "absolute",
            top: "10%",
            right: "50px",
            borderCollapse: "collapse",
            borderSpacing: 0,
            maxWidth: "420px",
            textAlign: "left",

            minWidth: "300px",
          }}
        >
          <tbody>
            <tr>
              <th>Pitch</th>
              <th>{display(currentLog?.pitch?.toFixed(1))} °</th>
            </tr>
            <tr>
              <th>Yaw</th>
              <th>{display(currentLog?.yaw?.toFixed(1))} °</th>
            </tr>
            <tr>
              <th>Roll</th>
              <th>{display(currentLog?.roll?.toFixed(1))} °</th>
            </tr>
            <tr>
              <th>Pitch Servo</th>
              <th>
                {display(currentLog?.nominalPitchServoDegrees?.toFixed(1))} °
              </th>
            </tr>
            <tr>
              <th>Yaw Servo</th>
              <th>
                {display(currentLog?.nominalYawServoDegrees?.toFixed(1))} °
              </th>
            </tr>
            <tr>
              <th>Speed</th>
              <th>{display(currentLog?.velocity?.toFixed(1))} m/s</th>
            </tr>
            <tr>
              <th>Temperature</th>
              <th>{display(currentLog?.temperature?.toFixed(1))} °C</th>
            </tr>
            <tr>
              <th>Altitude</th>
              <th>{display(currentLog?.altitude?.toFixed(1))} m</th>
            </tr>
          </tbody>
        </table>
      ) : null}
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
