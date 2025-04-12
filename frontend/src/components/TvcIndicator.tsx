import React from "react";

const TvcIndicator = ({ size = "5rem", pitch = 0, yaw = 0 }) => {
  if (Number.isNaN(pitch) || pitch > 1 || pitch < -1) {
    throw new Error(
      "TvcIndicatorProps.pitch must be a number between -1 and 1, received " +
        pitch
    );
  }
  if (Number.isNaN(yaw) || yaw > 1 || yaw < -1) {
    throw new Error(
      "TvcIndicatorProps.yaw must be a number between -1 and 1, received " + yaw
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
          left: "50%",
          top: 0,
          height: "10%",
          width: "2px",
          backgroundColor: "#fff",
          transform: "translateX(-50%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          height: "10%",
          width: "2px",
          backgroundColor: "#fff",
          transform: "translateX(-50%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "1rem",
          height: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          transform: `translate(-50%, -50%) translateY(${
            pitch * 50
          }%) translateX(${yaw * 50}%)`,
          left: "50%",
          top: "50%",

          borderRadius: "50%",
        }}
      />
    </div>
  );
};

export default TvcIndicator;
