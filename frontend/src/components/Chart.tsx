import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Filler,
  type ChartOptions,
  type ChartData,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Filler
);

export interface ChartProps {
  lookbackMs?: number;
  data: { time: number; value: number }[];
  xAxis: string;
  yAxis: string;
}
const Chart: React.FC<ChartProps> = ({ lookbackMs, data, xAxis, yAxis }) => {
  const latestData = data[data.length - 1];

  const slicedData = lookbackMs
    ? data.filter((d) => latestData.time - d.time < lookbackMs)
    : data;

  const chartData = {
    labels: slicedData.map((d) => d.time),
    datasets: [
      {
        data: slicedData.map((d) => d.value),
        borderColor: "rgba(255, 255, 255, 0.8)",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        pointBackgroundColor: "white",
        fill: true,
        tension: 0.4, // Smooth curve
      },
    ],
  } satisfies ChartData;

  const chartOptions = {
    responsive: true,
    animation: false as const,
    scales: {
      x: {
        title: { display: true, text: xAxis, color: "white" },
        grid: { color: "transparent" },
        ticks: { color: "white" },
      },
      y: {
        title: {
          display: true,
          text: yAxis,
          color: "white",
        },
        grid: { color: "transparent" },
        ticks: { color: "white" },
      },
    },
  } satisfies ChartOptions;

  return <Line data={chartData} options={chartOptions} />;
};
export default Chart;
