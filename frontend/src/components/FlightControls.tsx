import React from "react";
import { useQuery } from "@tanstack/react-query";
import { withQueryClientProvider } from "./withQueryClientProvider";

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

  return (
    <>
      <div className="inner-left-bottom">
        <h1>Ground Control</h1>
        <p>Flight ID: {data.id}</p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={onTakeoffClick} className="button">
            Takeoff
          </button>
          <a
            target="_blank"
            href={`/api/flights/${data.id}/logs`}
            className="button"
          >
            View Logs
          </a>
        </div>
      </div>
    </>
  );
};

export const FlightControls = withQueryClientProvider(FlightControlss);
