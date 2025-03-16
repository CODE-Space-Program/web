import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  type ChartOptions,
  type ChartData,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale);

export interface ChartProps {
  data: { time: number; value: number }[];
  xAxis: string;
  yAxis: string;
}
const Chart: React.FC<ChartProps> = ({ data, xAxis, yAxis }) => {
  const chartData = {
    labels: data.map((d) => d.time),
    datasets: [
      {
        data: data.map((d) => d.value),
        borderColor: "rgba(255, 255, 255, 0.8)",
        backgroundColor: "white",
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
