const BASE_URL = "https://spaceprogram.bolls.dev";

const flightRes = await fetch(`${BASE_URL}/api/flights`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
});
const flightData = await flightRes.json();

console.log(flightData);

const res = await fetch(
  `${BASE_URL}/api/flights/${flightData.data.flightId}/logs`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${flightData.data.token}`,
    },
    body: JSON.stringify([
      {
        sent: Date.now(),
        // this can have any arbitrary fields
      },
      {
        sent: Date.now(),
        foo: { gyro_roll: 1 },
        // this can have any arbitrary fields
      },
    ]),
  }
);
const data = await res.json();

console.log(data);
