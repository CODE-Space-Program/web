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

setTimeout(() => {
  fetch(`${BASE_URL}/api/flights/${flightData.data.flightId}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJsaW51cy5ib2xsc0Bjb2RlLmJlcmxpbiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQyMzQxMTY1fQ.IvNjuKapCP3r07MWUDFDTMZiyr3gwVGcPb5vemdMXrw`,
    },
    body: JSON.stringify({
      command: "test_tvc",
      args: {
        maxDegrees: 10,
        stepDegrees: 10,
      },
      sent: Date.now(),
    }),
  });
}, 1000);

const res1 = await fetch(
  `${BASE_URL}/api/flights/${flightData.data.flightId}/events`,
  {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${flightData.data.token}`,
    },
  }
);
const data1 = await res1.json();

console.log(data, data1);
