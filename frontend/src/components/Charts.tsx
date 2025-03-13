import Chart from "./Chart";

export default function Charts() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", height: "100%" }}>
        <Chart xAxis="Time (s)" yAxis="Altitude (m)" />
        <Chart xAxis="Time (s)" yAxis="Altitude (m)" />
      </div>
      <div style={{ display: "flex", height: "100%" }}>
        <Chart xAxis="Time (s)" yAxis="Altitude (m)" />
        <Chart xAxis="Time (s)" yAxis="Altitude (m)" />
      </div>
    </div>
  );
}
