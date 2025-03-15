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
    <div>
      <h1>Flight ID: {data.id}</h1>
      <button
        onClick={async () => {
          await fetch(`/api/flights/${data.id}/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sent: Date.now(),
              command: "start",
            }),
          });
        }}
      >
        Takeoff
      </button>
    </div>
  );
};

export const FlightControls = withQueryClientProvider(FlightControlss);
