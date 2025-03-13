const flightRes = await fetch("http://localhost:3000/api/flights", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
});
const flightData = await flightRes.json();

console.log(flightData);

const res = await fetch(
  `http://localhost:3000/api/flights/${flightData.data.flightId}/logs`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sent: Date.now(),
      gyro: {
        x: 0,
        y: 0,
        z: 0,
      },
      acc: {
        x: 0,
        y: 0,
        z: 0,
      },
      pressure: 0,
      altitude: 0,
      temperature: 0,
    }),
  }
);
const data = await res.json();

console.log(data);
