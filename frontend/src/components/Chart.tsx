import React, { useEffect, useState } from "react";
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
  xAxis: string;
  yAxis: string;
}
const Chart: React.FC<ChartProps> = ({ xAxis, yAxis }) => {
  const [flightData, setFlightData] = useState<
    { time: number; altitude: number }[]
  >([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlightData((prevData) => {
        const time =
          prevData.length > 0 ? prevData[prevData.length - 1].time + 1 : 0;
        const altitude = Math.sin(time * 0.1) * 100 + 100; // Simulated altitude

        return [...prevData.slice(-20), { time, altitude }]; // Keep last 20 points
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: flightData.map((d) => d.time),
    datasets: [
      {
        data: flightData.map((d) => d.altitude),
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
