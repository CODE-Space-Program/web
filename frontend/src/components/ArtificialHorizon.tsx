import React from "react";

const ArtificialHorizon = ({ size = "5rem", pitch = 0, roll = 0 }) => {
  if (Number.isNaN(pitch) || pitch > 1 || pitch < -1) {
    throw new Error(
      "ArtificialHorizonProps.pitch must be a number between -1 and 1"
    );
  }
  if (Number.isNaN(roll) || roll > 1 || roll < -1) {
    throw new Error(
      "ArtificialHorizonProps.roll must be a number between -1 and 1"
    );
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",

        width: size,
        minWidth: size,
        height: size,
        minHeight: size,

        borderRadius: "50%",
        border: "2px solid #fff",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          width: "10%",
          height: "2px",
          backgroundColor: "#fff",
          transform: "translateY(-50%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: 0,
          top: "50%",
          width: "10%",
          height: "2px",
          backgroundColor: "#fff",
          transform: "translateY(-50%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "200%",
          height: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          transform: `translate(-50%, -50%) translateY(${pitch * 50}%) rotate(${
            roll * 90
          }deg)`,
          left: "50%",
          top: "100%",

          transformOrigin: "center top",
        }}
      />
    </div>
  );
};

export default ArtificialHorizon;
